"use client";

import { ModelDef } from "@/lib/types";

interface DebateEntryProps {
  model: ModelDef;
  round: number;
  text: string;
  isStreaming?: boolean;
}

export function DebateEntryCard({ model, round, text, isStreaming }: DebateEntryProps) {
  return (
    <div
      className="rounded-lg border p-4 space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300"
      style={{
        borderColor: `${model.color}30`,
        backgroundColor: `${model.color}08`,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-mono text-sm" style={{ color: model.color }}>
          <span className="text-lg">{model.avatar}</span>
          <span className="font-bold">{model.displayName}</span>
        </div>
        <span className="text-xs font-mono text-ink/30">R{round}</span>
      </div>
      <div className="text-sm text-ink/80 leading-relaxed whitespace-pre-wrap font-mono">
        {text}
        {isStreaming && (
          <span className="inline-block w-2 h-4 bg-current animate-pulse ml-0.5" />
        )}
      </div>
    </div>
  );
}
