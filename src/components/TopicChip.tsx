"use client";

interface TopicChipProps {
  topic: string;
  selected: boolean;
  onClick: () => void;
}

export function TopicChip({ topic, selected, onClick }: TopicChipProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all border cursor-pointer ${
        selected
          ? "border-ink/40 bg-ink/10 text-ink"
          : "border-ink/10 bg-ink/5 text-ink/50 hover:border-ink/20 hover:text-ink/70"
      }`}
    >
      {topic}
    </button>
  );
}
