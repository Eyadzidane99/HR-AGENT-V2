"use client";

import { useEffect, useRef } from "react";
import { Send, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
};

export function ChatComposer({ value, onChange, onSubmit, disabled, placeholder }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = Math.min(element.scrollHeight, 180) + "px";
  }, [value]);

  useEffect(() => {
    if (!disabled) ref.current?.focus();
  }, [disabled]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!disabled && value.trim()) onSubmit();
    }
  }

  const canSend = !disabled && value.trim().length > 0;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative">
      <div className="group relative rounded-2xl border border-vodafone-red/20 bg-white/95 backdrop-blur-md p-3 shadow-[0_12px_35px_-24px_rgba(230,0,0,0.45)] focus-within:border-vodafone-red/60 focus-within:shadow-[0_0_40px_-8px_rgba(230,0,0,0.55)] transition-all">
        <div className="flex items-end gap-2">
          <Sparkles className="ml-1 mb-3 h-4 w-4 shrink-0 text-vodafone-red/70" />
          <textarea
            ref={ref}
            rows={1}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={placeholder || "Type your answer…"}
            className="flex-1 resize-none bg-transparent px-1 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none max-h-44"
          />
          <Button type="button" onClick={onSubmit} disabled={!canSend} size="icon" className="h-10 w-10 shrink-0" aria-label="Send">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <p className="mt-2 text-center text-[11px] text-zinc-500">Enter to send • Shift+Enter for a new line</p>
    </motion.div>
  );
}
