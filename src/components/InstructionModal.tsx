"use client";

import { useEffect, useRef, useState } from "react";

interface InstructionModalProps {
  title: string;
  value: string;
  onSave: (value: string) => void;
  onClose: () => void;
}

export function InstructionModal({ title, value, onSave, onClose }: InstructionModalProps) {
  const [draft, setDraft] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSave = () => {
    onSave(draft);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg rounded-xl border border-ink/10 bg-paper-up shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink/5">
          <h3 className="font-mono text-sm font-bold text-ink">{title}</h3>
          <button
            onClick={onClose}
            className="text-ink/30 hover:text-ink/60 font-mono text-lg transition-colors cursor-pointer"
          >
            &times;
          </button>
        </div>
        <div className="p-5">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={6}
            placeholder="Enter instructions for this agent..."
            className="w-full px-3 py-2.5 rounded-lg bg-ink/5 border border-ink/10 text-ink/80 font-mono text-xs leading-relaxed placeholder:text-ink/20 focus:outline-none focus:border-ink/25 transition-colors resize-y"
          />
        </div>
        <div className="flex justify-end gap-3 px-5 py-4 border-t border-ink/5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-ink/10 text-ink/40 font-mono text-xs hover:text-ink/60 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-ink/10 border border-ink/20 text-ink font-mono text-xs hover:bg-ink/15 transition-colors cursor-pointer"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
