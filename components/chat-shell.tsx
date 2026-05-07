"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, Plus, Trash2, Users } from "lucide-react";

import { ChatComposer, type ComposerAttachment } from "@/components/chat-composer";
import {
  ChatMessage,
  ChatMessageData,
  TypingIndicator
} from "@/components/chat-message";
import { VodafoneLogo } from "@/components/vodafone-logo";
import { Button } from "@/components/ui/button";
import { Spotlight } from "@/components/ui/spotlight";
import {
  addCandidate,
  Candidate,
  clearAll,
  listCandidates
} from "@/lib/candidates";
import { extractPdfText } from "@/lib/pdf";

const WELCOME: ChatMessageData = {
  id: "welcome",
  role: "agent",
  content:
    "Welcome to **Vodafone HR Agent**. I help you capture and retrieve candidate information.\n\nYou can:\n• Type or paste candidate details.\n• **Attach a PDF CV** (paperclip icon) — I'll parse it and store the candidate.\n• Ask about a candidate by name, skill, email, phone, etc.\n\nTry: *Add candidate. Name: Sara Ahmed. Email: sara@vodafone.com. Skills: React, Node. Years: 5.*",
  createdAt: Date.now()
};

const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10 MB

export function ChatShell() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessageData[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [attachment, setAttachment] = useState<ComposerAttachment | undefined>(undefined);
  const [extractedText, setExtractedText] = useState<string>("");
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCandidates(listCandidates());
    const handler = () => setCandidates(listCandidates());
    window.addEventListener("hr-agent:candidates-updated", handler);
    return () => window.removeEventListener("hr-agent:candidates-updated", handler);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  async function handleAttach(file: File) {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setAttachment({ file, status: "error", error: "Only PDF files are supported" });
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      setAttachment({ file, status: "error", error: "File too large (max 10 MB)" });
      return;
    }
    setAttachment({ file, status: "extracting" });
    setExtractedText("");
    try {
      const { text, pages, charCount } = await extractPdfText(file);
      if (!text) {
        setAttachment({
          file,
          status: "error",
          error: "Couldn't extract text. Is this a scanned PDF?"
        });
        return;
      }
      setExtractedText(text);
      setAttachment({ file, status: "ready", pages, charCount });
    } catch (err) {
      setAttachment({
        file,
        status: "error",
        error: err instanceof Error ? err.message : "Failed to read PDF"
      });
    }
  }

  function clearAttachment() {
    setAttachment(undefined);
    setExtractedText("");
  }

  async function send() {
    const text = input.trim();
    const hasAttachment = attachment?.status === "ready" && extractedText;
    if ((!text && !hasAttachment) || thinking) return;

    const userMsg: ChatMessageData = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      createdAt: Date.now(),
      attachment: hasAttachment
        ? { name: attachment!.file.name, size: attachment!.file.size, pages: attachment!.pages }
        : undefined
    };
    setMessages((m) => [...m, userMsg]);

    const payloadAttachment = hasAttachment
      ? {
          name: attachment!.file.name,
          mimeType: attachment!.file.type || "application/pdf",
          size: attachment!.file.size,
          pages: attachment!.pages,
          text: extractedText
        }
      : undefined;

    setInput("");
    setAttachment(undefined);
    setExtractedText("");
    setThinking(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          attachment: payloadAttachment,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          candidates: listCandidates()
        })
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }
      const data = (await res.json()) as {
        reply: string;
        candidate?: Candidate;
        matches?: Candidate[];
      };

      if (data.candidate) addCandidate(data.candidate);

      const agentMsg: ChatMessageData = {
        id: crypto.randomUUID(),
        role: "agent",
        content: data.reply,
        createdAt: Date.now()
      };
      setMessages((m) => [...m, agentMsg]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "agent",
          content: "Sorry — something went wrong reaching the agent. Please try again.",
          createdAt: Date.now()
        }
      ]);
    } finally {
      setThinking(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" })
    });
    router.push("/login");
    router.refresh();
  }

  function newChat() {
    setMessages([WELCOME]);
    setInput("");
    clearAttachment();
  }

  function fillSearch(name?: string) {
    if (!name) return;
    setInput(`Tell me about ${name}`);
  }

  const enterEase = [0.22, 1, 0.36, 1] as const;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="flex h-[100dvh] w-full text-white"
    >
      {/* Sidebar */}
      <motion.aside
        initial={{ x: "-110%" }}
        animate={{ x: 0 }}
        transition={{ duration: 0.65, ease: enterEase, delay: 0.05 }}
        className="hidden md:flex w-72 shrink-0 flex-col border-r border-vodafone-red/15 bg-black/40 backdrop-blur-xl"
      >
        <div className="p-5 border-b border-vodafone-red/10">
          <VodafoneLogo withWordmark />
        </div>
        <div className="p-4">
          <Button onClick={newChat} className="w-full" variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            New chat
          </Button>
        </div>
        <div className="px-5 pt-2 pb-1 text-xs uppercase tracking-wider text-zinc-500 flex items-center gap-2">
          <Users className="h-3.5 w-3.5" /> Candidates
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {candidates.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-zinc-500">
              No candidates yet. Add one or attach a CV.
            </p>
          ) : (
            candidates.map((c) => (
              <button
                key={c.id}
                onClick={() => fillSearch(c.name || c.email || c.phone)}
                className="group w-full text-left rounded-lg px-3 py-2.5 hover:bg-vodafone-red/10 border border-transparent hover:border-vodafone-red/30 transition"
              >
                <div className="text-sm font-medium text-white truncate">
                  {c.name || c.email || c.phone || "Unnamed candidate"}
                </div>
                <div className="text-xs text-zinc-500 truncate">
                  {[c.role, c.skills?.slice(0, 3).join(", ")].filter(Boolean).join(" • ")}
                </div>
              </button>
            ))
          )}
        </div>
        <div className="p-3 border-t border-vodafone-red/10 space-y-1">
          {candidates.length > 0 ? (
            <Button
              onClick={() => {
                if (confirm("Clear all stored candidates?")) clearAll();
              }}
              variant="ghost"
              size="sm"
              className="w-full justify-start text-zinc-400 hover:text-vodafone-accent"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear all
            </Button>
          ) : null}
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            className="w-full justify-start text-zinc-400 hover:text-white"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </motion.aside>

      {/* Main */}
      <motion.main
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        transition={{ duration: 0.65, ease: enterEase }}
        className="relative flex-1 flex flex-col overflow-hidden"
      >
        <Spotlight className="-top-40 left-10 md:left-1/3" fill="#E60000" />

        <header className="relative z-10 flex items-center justify-between border-b border-vodafone-red/15 bg-black/40 backdrop-blur px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="md:hidden">
              <VodafoneLogo size={32} />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-wide">HR Agent</h1>
              <p className="text-[11px] text-zinc-500">
                Powered by Azure AI • Vodafone Egypt
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:flex items-center gap-2 text-xs text-zinc-400">
              <span className="h-2 w-2 rounded-full bg-vodafone-red animate-pulse-red" />
              online
            </span>
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="md:hidden text-zinc-400"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <div ref={scrollerRef} className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-8 py-6">
          <div className="mx-auto max-w-3xl space-y-5">
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <ChatMessage key={m.id} message={m} />
              ))}
            </AnimatePresence>
            {thinking ? <TypingIndicator /> : null}
          </div>
        </div>

        <div className="relative z-10 border-t border-vodafone-red/15 bg-black/40 backdrop-blur px-4 sm:px-8 py-4">
          <div className="mx-auto max-w-3xl">
            <ChatComposer
              value={input}
              onChange={setInput}
              onSubmit={send}
              onAttach={handleAttach}
              onClearAttachment={clearAttachment}
              attachment={attachment}
              disabled={thinking}
            />
          </div>
        </div>

        <motion.div
          className="pointer-events-none absolute inset-0 z-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)",
            backgroundSize: "44px 44px"
          }}
          animate={{ backgroundPosition: ["0 0", "44px 44px"] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        />
      </motion.main>
    </motion.div>
  );
}
