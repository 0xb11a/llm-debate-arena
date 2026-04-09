"use client";

import { useEffect, useRef, useState } from "react";
import { ModelDef } from "@/lib/types";

interface ModelSelectProps {
  value: string;
  onChange: (modelId: string) => void;
  models: ModelDef[];
  disabledIds?: Set<string>;
  placeholder?: string;
}

export function ModelSelect({
  value,
  onChange,
  models,
  disabledIds,
  placeholder = "Select a model...",
}: ModelSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = models.find((m) => m.key === value);

  useEffect(() => {
    if (open) {
      setSearch("");
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleEscape);
      };
    }
  }, [open]);

  const lowerSearch = search.toLowerCase();
  const filtered = models.filter((m) => {
    if (!search) return true;
    return (
      m.displayName.toLowerCase().includes(lowerSearch) ||
      m.provider.toLowerCase().includes(lowerSearch) ||
      m.key.toLowerCase().includes(lowerSearch)
    );
  });

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border font-mono text-sm text-left transition-all cursor-pointer"
        style={
          selected
            ? { borderColor: `${selected.color}60`, backgroundColor: `${selected.color}10` }
            : { borderColor: "var(--ink-color, #999)", opacity: 0.3 }
        }
      >
        {selected ? (
          <>
            <span className="text-lg shrink-0">{selected.avatar}</span>
            <span className="truncate" style={{ color: selected.color }}>
              {selected.displayName}
            </span>
            <span className="text-ink/30 text-xs ml-auto shrink-0">{selected.provider}</span>
          </>
        ) : (
          <span className="text-ink/30">{placeholder}</span>
        )}
        <span className="text-ink/20 ml-auto shrink-0">&#9662;</span>
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-lg border border-ink/10 bg-paper-up shadow-xl max-h-72 flex flex-col overflow-hidden">
          <div className="p-2 border-b border-ink/5">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search models..."
              className="w-full px-2 py-1.5 rounded bg-ink/5 border border-ink/10 text-ink font-mono text-xs placeholder:text-ink/20 focus:outline-none focus:border-ink/30"
            />
          </div>
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 && (
              <div className="px-3 py-4 text-xs font-mono text-ink/30 text-center">
                No models found
              </div>
            )}
            {filtered.map((m) => {
              const isDisabled = disabledIds?.has(m.key);
              const isSelected = m.key === value;
              return (
                <button
                  key={m.key}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => {
                    onChange(m.key);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left font-mono text-xs transition-colors ${
                    isDisabled
                      ? "opacity-30 cursor-not-allowed"
                      : isSelected
                      ? "bg-ink/10"
                      : "hover:bg-ink/5 cursor-pointer"
                  }`}
                >
                  <span className="text-base shrink-0">{m.avatar}</span>
                  <span className="truncate text-ink/80">{m.displayName}</span>
                  <span className="text-ink/20 text-[10px] ml-auto shrink-0">{m.provider}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
