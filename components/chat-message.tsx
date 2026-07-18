"use client";

import { motion } from "framer-motion";
import { Bot, FileText, User } from "lucide-react";

import { cn } from "@/lib/utils";

export type ChatRole = "user" | "agent";

export type ChatAttachmentMeta = {
  name: string;
  size?: number;
  pages?: number;
};

export type ChatMessageData = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
  attachment?: ChatAttachmentMeta;
  actions?: { label: string; value: string }[];
};

function renderContent(content: string) {
  const lines = content.split("\n");
  return lines.map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((seg, j) => {
      if (seg.startsWith("**") && seg.endsWith("**")) {
        return (
          <strong key={j} className="font-semibold">
            {seg.slice(2, -2)}
          </strong>
        );
      }
      return <span key={j}>{seg}</span>;
    });
    return (
      <p key={i} className={cn("leading-relaxed", line.trim() === "" && "h-2")}>
        {parts}
      </p>
    );
  });
}

function formatSize(bytes?: number) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AttachmentChip({ a, isUser }: { a: ChatAttachmentMeta; isUser: boolean }) {
  return (
    <div
      className={cn(
        "mb-2 flex items-center gap-2 rounded-lg px-2.5 py-2",
        isUser ? "bg-white/15 border border-white/25" : "bg-vodafone-red/10 border border-vodafone-red/30"
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
          isUser ? "bg-white/15 text-white" : "bg-vodafone-red/20 text-vodafone-red"
        )}
      >
        <FileText className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium truncate">{a.name}</p>
        <p className={cn("text-[10px] truncate", isUser ? "text-white/80" : "text-zinc-500")}>
          PDF CV
          {a.pages ? ` • ${a.pages} page${a.pages === 1 ? "" : "s"}` : ""}
          {a.size ? ` • ${formatSize(a.size)}` : ""}
        </p>
      </div>
    </div>
  );
}

export function ChatMessage({
  message,
  onAction,
  actionsDisabled
}: {
  message: ChatMessageData;
  onAction?: (value: string) => void;
  actionsDisabled?: boolean;
}) {
  const isUser = message.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, x: isUser ? 20 : -20 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}
    >
      {!isUser ? (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-vodafone-red to-vodafone-deep shadow-[0_0_18px_-4px_rgba(230,0,0,0.7)]">
          <Bot className="h-4 w-4 text-white" />
        </div>
      ) : null}

      <div
        className={cn(
          "max-w-[78%] rounded-2xl px-4 py-3 text-sm shadow-sm",
          isUser
            ? "rounded-tr-sm bg-vodafone-red/90 text-white"
            : "rounded-tl-sm bg-white border border-zinc-200 text-zinc-800 backdrop-blur shadow-[0_8px_24px_-18px_rgba(0,0,0,0.35)]"
        )}
      >
        {message.attachment ? <AttachmentChip a={message.attachment} isUser={isUser} /> : null}
        {message.content ? <div className="space-y-1">{renderContent(message.content)}</div> : null}
        {!isUser && message.actions?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.actions.map((action) => (
              <button
                key={`${action.label}-${action.value}`}
                type="button"
                disabled={actionsDisabled}
                onClick={() => onAction?.(action.value)}
                className="rounded-lg border border-vodafone-red/40 bg-vodafone-red/10 px-3 py-1.5 text-xs text-zinc-900 transition hover:border-vodafone-red hover:bg-vodafone-red/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {action.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {isUser ? (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 ring-1 ring-zinc-200">
          <User className="h-4 w-4 text-zinc-700" />
        </div>
      ) : null}
    </motion.div>
  );
}

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 justify-start"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-vodafone-red to-vodafone-deep">
        <Bot className="h-4 w-4 text-white" />
      </div>
      <div className="rounded-2xl rounded-tl-sm bg-white border border-zinc-200 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-vodafone-red animate-bounce-dot [animation-delay:-0.32s]" />
          <span className="h-2 w-2 rounded-full bg-vodafone-red animate-bounce-dot [animation-delay:-0.16s]" />
          <span className="h-2 w-2 rounded-full bg-vodafone-red animate-bounce-dot" />
        </div>
      </div>
    </motion.div>
  );
}
