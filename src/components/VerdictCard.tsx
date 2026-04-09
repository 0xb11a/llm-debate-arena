"use client";

interface VerdictCardProps {
  text: string;
  isStreaming?: boolean;
}

export function VerdictCard({ text, isStreaming }: VerdictCardProps) {
  return (
    <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4 space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-2 font-mono text-sm text-yellow-600 dark:text-yellow-400">
        <span className="text-lg">&#9878;&#65039;</span>
        <span className="font-bold">VERDICT</span>
      </div>
      <div className="text-sm text-ink/80 leading-relaxed whitespace-pre-wrap font-mono">
        {text}
        {isStreaming && (
          <span className="inline-block w-2 h-4 bg-yellow-400 animate-pulse ml-0.5" />
        )}
      </div>
    </div>
  );
}
