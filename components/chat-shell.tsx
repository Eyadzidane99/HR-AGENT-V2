"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, Plus, Trash2, Users } from "lucide-react";

import { ChatComposer, type ComposerAttachment } from "@/components/chat-composer";
import { ChatMessage, TypingIndicator } from "@/components/chat-message";
import { VodafoneLogo } from "@/components/vodafone-logo";
import { Button } from "@/components/ui/button";
import { Spotlight } from "@/components/ui/spotlight";
import {
  WorkflowSession,
  createSession,
  expectedAttachment,
  handleCv,
  handleText,
  loadSession,
  saveSession,
  userMessage
} from "@/lib/assessment-workflow";
import { Candidate, StoredCv, clearAll, getCandidate, listCandidates } from "@/lib/candidates";
import { extractPdfText } from "@/lib/pdf";

const MAX_PDF_BYTES = 5 * 1024 * 1024;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read the PDF"));
    reader.readAsDataURL(file);
  });
}

export function ChatShell() {
  const router = useRouter();
  const [session, setSession] = useState<WorkflowSession>(() => createSession());
  const [hydrated, setHydrated] = useState(false);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [attachment, setAttachment] = useState<ComposerAttachment>();
  const [storedCv, setStoredCv] = useState<StoredCv>();
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSession(loadSession());
    setCandidates(listCandidates());
    setHydrated(true);
    const handler = () => setCandidates(listCandidates());
    window.addEventListener("hr-agent:candidates-updated", handler);
    return () => window.removeEventListener("hr-agent:candidates-updated", handler);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      saveSession(session);
    } catch {
      // Candidate data is still persisted; a quota warning is shown during upload.
    }
  }, [hydrated, session]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [session.messages, thinking]);

  async function handleAttach(file: File) {
    if (!expectedAttachment(session)) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setAttachment({ file, status: "error", error: "Only PDF files are supported" });
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      setAttachment({ file, status: "error", error: "File too large (max 5 MB)" });
      return;
    }
    setAttachment({ file, status: "extracting" });
    setStoredCv(undefined);
    try {
      const [{ text, pages, charCount }, dataUrl] = await Promise.all([
        extractPdfText(file),
        readAsDataUrl(file)
      ]);
      if (!text) throw new Error("Couldn't extract text. Is this a scanned PDF?");
      setStoredCv({
        name: file.name,
        mimeType: file.type || "application/pdf",
        size: file.size,
        pages,
        dataUrl,
        uploadedAt: Date.now()
      });
      setAttachment({ file, status: "ready", pages, charCount });
    } catch (error) {
      setAttachment({
        file,
        status: "error",
        error: error instanceof Error ? error.message : "Failed to read PDF"
      });
    }
  }

  function clearAttachment() {
    setAttachment(undefined);
    setStoredCv(undefined);
  }

  function submit(value?: string) {
    const text = (value ?? input).trim();
    const hasCv = attachment?.status === "ready" && storedCv;
    if ((!text && !hasCv) || thinking) return;

    const visibleUser = hasCv
      ? {
          ...userMessage(text || `Uploaded ${storedCv.name}`),
          attachment: { name: storedCv.name, size: storedCv.size, pages: storedCv.pages }
        }
      : userMessage(text);
    const base = { ...session, messages: [...session.messages, visibleUser] };
    setSession(base);
    setInput("");
    setThinking(true);

    window.setTimeout(() => {
      try {
        const next = hasCv ? handleCv(base, storedCv) : handleText(base, text);
        setSession(next);
        clearAttachment();
      } catch (error) {
        const isQuota =
          error instanceof DOMException &&
          (error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED");
        const content = isQuota
          ? "This PDF does not fit in local browser storage. Existing records are safe; please upload a smaller PDF."
          : "I couldn't save that response. Existing records are safe; please try again.";
        setSession({
          ...base,
          messages: [
            ...base.messages,
            { id: crypto.randomUUID(), role: "agent", content, createdAt: Date.now() }
          ]
        });
      } finally {
        setThinking(false);
      }
    }, 450);
  }

  function handleAction(value: string) {
    if (value.startsWith("download_cv:")) {
      const candidate = getCandidate(value.slice("download_cv:".length));
      if (!candidate?.cv?.dataUrl) return;
      const link = document.createElement("a");
      link.href = candidate.cv.dataUrl;
      link.download = candidate.cv.name || `${candidate.candidateName}-CV.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      return;
    }
    submit(value);
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
    if (session.candidateId && session.step !== "main") {
      submit("menu");
      return;
    }
    setSession(createSession());
    setInput("");
    clearAttachment();
    setThinking(false);
  }

  function startSearch(name: string) {
    const fresh = createSession();
    const selected = handleText(fresh, "2");
    setSession(handleText({ ...selected, messages: [...selected.messages, userMessage(name)] }, name));
  }

  const enterEase = [0.22, 1, 0.36, 1] as const;
  const lastMessageId = session.messages.at(-1)?.id;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex h-[100dvh] w-full bg-white text-zinc-900">
      <motion.aside
        initial={{ x: "-110%" }}
        animate={{ x: 0 }}
        transition={{ duration: 0.65, ease: enterEase, delay: 0.05 }}
        className="hidden md:flex w-72 shrink-0 flex-col border-r border-vodafone-red/15 bg-white/90 backdrop-blur-xl"
      >
        <div className="p-5 border-b border-vodafone-red/10"><VodafoneLogo withWordmark /></div>
        <div className="p-4">
          <Button onClick={newChat} className="w-full" variant="outline"><Plus className="mr-2 h-4 w-4" />New chat</Button>
        </div>
        <div className="px-5 pt-2 pb-1 text-xs uppercase tracking-wider text-zinc-500 flex items-center gap-2">
          <Users className="h-3.5 w-3.5" /> Candidates
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {candidates.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-zinc-500">No completed candidates yet.</p>
          ) : candidates.map((candidate) => (
            <button
              key={candidate.id}
              onClick={() => startSearch(candidate.candidateName)}
              className="group w-full text-left rounded-lg px-3 py-2.5 hover:bg-vodafone-red/10 border border-transparent hover:border-vodafone-red/30 transition"
            >
              <div className="text-sm font-medium text-zinc-900 truncate">{candidate.candidateName}</div>
              <div className="text-xs text-zinc-500 truncate">
                {[candidate.titleInterviewedFor, candidate.finalDecision].filter(Boolean).join(" • ")}
              </div>
            </button>
          ))}
        </div>
        <div className="p-3 border-t border-vodafone-red/10 space-y-1">
          {candidates.length > 0 ? (
            <Button
              onClick={() => { if (confirm("Clear all stored candidates and chat history?")) { clearAll(); setSession(createSession()); } }}
              variant="ghost" size="sm" className="w-full justify-start text-zinc-400 hover:text-vodafone-accent"
            ><Trash2 className="mr-2 h-4 w-4" />Clear all</Button>
          ) : null}
          <Button onClick={handleLogout} variant="ghost" size="sm" className="w-full justify-start text-zinc-500 hover:text-zinc-900">
            <LogOut className="mr-2 h-4 w-4" />Sign out
          </Button>
        </div>
      </motion.aside>

      <motion.main initial={{ x: "100%" }} animate={{ x: 0 }} transition={{ duration: 0.65, ease: enterEase }} className="relative flex-1 flex flex-col overflow-hidden">
        <Spotlight className="-top-40 left-10 md:left-1/3" fill="#E60000" />
        <header className="relative z-10 flex items-center justify-between border-b border-vodafone-red/15 bg-white/90 backdrop-blur px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="md:hidden"><VodafoneLogo size={32} /></div>
            <div><h1 className="text-sm font-semibold tracking-wide">Candidate Assessment Agent</h1><p className="text-[11px] text-zinc-500">Guided local assessment • Vodafone Egypt</p></div>
          </div>
          <Button onClick={handleLogout} variant="ghost" size="sm" className="md:hidden text-zinc-400" aria-label="Sign out"><LogOut className="h-4 w-4" /></Button>
        </header>

        <div ref={scrollerRef} className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-8 py-6">
          <div className="mx-auto max-w-3xl space-y-5">
            <AnimatePresence initial={false}>
              {session.messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onAction={handleAction}
                  actionsDisabled={thinking || message.id !== lastMessageId}
                />
              ))}
            </AnimatePresence>
            {thinking ? <TypingIndicator /> : null}
          </div>
        </div>

        <div className="relative z-10 border-t border-vodafone-red/15 bg-white/90 backdrop-blur px-4 sm:px-8 py-4">
          <div className="mx-auto max-w-3xl">
            <ChatComposer
              value={input}
              onChange={setInput}
              onSubmit={() => submit()}
              onAttach={handleAttach}
              onClearAttachment={clearAttachment}
              attachment={attachment}
              disabled={thinking}
              allowAttachment={expectedAttachment(session)}
              placeholder={expectedAttachment(session) ? "Upload a PDF CV to continue…" : "Type your answer…"}
            />
          </div>
        </div>
        <motion.div
          className="pointer-events-none absolute inset-0 z-0 opacity-[0.06]"
          style={{ backgroundImage: "linear-gradient(rgba(24,24,27,.35) 1px, transparent 1px),linear-gradient(90deg, rgba(24,24,27,.35) 1px, transparent 1px)", backgroundSize: "44px 44px" }}
          animate={{ backgroundPosition: ["0 0", "44px 44px"] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        />
      </motion.main>
    </motion.div>
  );
}
