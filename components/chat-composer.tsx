"use client";

import { useEffect, useRef } from "react";
import { Loader2, Paperclip, Send, Sparkles, X, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/pdf";

export type ComposerAttachment = {
  file: File;
  pages?: number;
  charCount?: number;
  status: "extracting" | "ready" | "error";
  error?: string;
};

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onAttach: (file: File) => void;
  onClearAttachment: () => void;
  attachment?: ComposerAttachment;
  disabled?: boolean;
  allowAttachment?: boolean;
  placeholder?: string;
};

export function ChatComposer({
  value,
  onChange,
  onSubmit,
  onAttach,
  onClearAttachment,
  attachment,
  disabled,
  allowAttachment = true,
  placeholder
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 180) + "px";
  }, [value]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && (value.trim() || attachment?.status === "ready")) onSubmit();
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onAttach(file);
    e.target.value = "";
  }

  const canSend =
    !disabled &&
    (value.trim().length > 0 || attachment?.status === "ready") &&
    attachment?.status !== "extracting";

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative">
      <input
        ref={fileRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={handleFile}
      />

      <div
        className={cn(
          "group relative rounded-2xl border border-vodafone-red/20 bg-white/95 backdrop-blur-md p-3 shadow-[0_12px_35px_-24px_rgba(230,0,0,0.45)]",
          "focus-within:border-vodafone-red/60 focus-within:shadow-[0_0_40px_-8px_rgba(230,0,0,0.55)] transition-all"
        )}
      >
        <AnimatePresence>
          {attachment ? (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 8 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden"
            >
              <div
                className={cn(
                  "flex items-center gap-3 rounded-xl border bg-zinc-50 px-3 py-2",
                  attachment.status === "error"
                    ? "border-red-500/50"
                    : "border-vodafone-red/30"
                )}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-vodafone-red/15 text-vodafone-red">
                  {attachment.status === "extracting" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-900 truncate">{attachment.file.name}</p>
                  <p className="text-[11px] text-zinc-500 truncate">
                    {attachment.status === "extracting"
                      ? "Extracting text…"
                      : attachment.status === "error"
                      ? attachment.error || "Failed to read PDF"
                      : `${formatBytes(attachment.file.size)} • ${attachment.pages ?? 0} page${
                          attachment.pages === 1 ? "" : "s"
                        } • ${attachment.charCount ?? 0} chars`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClearAttachment}
                  className="shrink-0 rounded-md p-1.5 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 transition"
                  aria-label="Remove attachment"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="flex items-end gap-2">
          <Button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={disabled || !allowAttachment || !!attachment}
            size="icon"
            variant="ghost"
            className="h-10 w-10 shrink-0 text-zinc-400 hover:text-vodafone-red"
            aria-label="Attach PDF CV"
            title={allowAttachment ? "Attach PDF CV" : "CV upload is not expected at this step"}
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          <Sparkles className="ml-1 mb-3 h-4 w-4 shrink-0 text-vodafone-red/70" />

          <textarea
            ref={ref}
            rows={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={
              placeholder ||
              (attachment
                ? "Add a note about this CV (optional)…"
                : "Add a candidate, attach a CV, or ask about one…")
            }
            className="flex-1 resize-none bg-transparent px-1 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none max-h-44"
          />

          <Button
            type="button"
            onClick={onSubmit}
            disabled={!canSend}
            size="icon"
            className="h-10 w-10 shrink-0"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <p className="mt-2 text-center text-[11px] text-zinc-500">
        Enter to send • Shift+Enter for new line • PDF CVs supported
      </p>
    </motion.div>
  );
}
