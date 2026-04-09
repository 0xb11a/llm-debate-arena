"use client";

import { useState } from "react";
import { DebateHistoryItem } from "@/lib/types";
import { DebateEntryCard } from "./DebateEntry";
import { VerdictCard } from "./VerdictCard";

interface DebateHistoryProps {
  history: DebateHistoryItem[];
  onClose: () => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

function timeAgo(ts: number): string {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

export function DebateHistory({ history, onClose, onRemove, onClear }: DebateHistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const expanded = expandedId ? history.find((h) => h.id === expandedId) : null;

  if (expanded) {
    return <DebateHistoryDetail item={expanded} onBack={() => setExpandedId(null)} onRemove={() => { onRemove(expanded.id); setExpandedId(null); }} />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <div className="w-full max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-mono font-bold tracking-tight text-ink">
            DEBATE HISTORY
          </h2>
          <button
            onClick={onClose}
            className="text-xs font-mono text-ink/30 hover:text-ink/60 transition-colors cursor-pointer"
          >
            Back
          </button>
        </div>

        {history.length === 0 ? (
          <p className="text-ink/30 font-mono text-sm text-center py-12">
            No debates yet. Completed debates will appear here.
          </p>
        ) : (
          <>
            <div className="space-y-2">
              {history.map((item) => {
                const debaterNames = item.config.debaters
                  .map((k) => item.modelNames[k]?.displayName ?? k.split("/").pop())
                  .join(" vs ");
                const judgeName = item.modelNames[item.config.judge]?.displayName ?? item.config.judge.split("/").pop();
                return (
                  <button
                    key={item.id}
                    onClick={() => setExpandedId(item.id)}
                    className="w-full text-left p-4 rounded-lg border border-ink/10 hover:border-ink/20 hover:bg-ink/5 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-sm font-bold text-ink truncate">
                          &ldquo;{item.config.topic}&rdquo;
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs font-mono text-ink/40 flex-wrap">
                          <span>{debaterNames}</span>
                          <span className="text-ink/20">&middot;</span>
                          <span className="text-yellow-600 dark:text-yellow-400/60">
                            &#9878;&#65039; {judgeName}
                          </span>
                          <span className="text-ink/20">&middot;</span>
                          <span>{item.config.rounds}R</span>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-ink/20 shrink-0">
                        {timeAgo(item.timestamp)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-center pt-2">
              {!confirmClear ? (
                <button
                  onClick={() => setConfirmClear(true)}
                  className="text-xs font-mono text-ink/20 hover:text-red-400 transition-colors cursor-pointer"
                >
                  Clear all history
                </button>
              ) : (
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="text-red-400">Delete all debates?</span>
                  <button
                    onClick={() => { onClear(); setConfirmClear(false); }}
                    className="text-red-400 hover:text-red-500 cursor-pointer font-bold"
                  >
                    Yes, clear
                  </button>
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="text-ink/30 hover:text-ink/50 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- Detail view ---------- */

function DebateHistoryDetail({
  item,
  onBack,
  onRemove,
}: {
  item: DebateHistoryItem;
  onBack: () => void;
  onRemove: () => void;
}) {
  const getModel = (key: string) => {
    const snap = item.modelNames[key];
    return {
      key,
      openRouterId: key,
      displayName: snap?.displayName ?? key.split("/").pop() ?? key,
      provider: "",
      avatar: snap?.avatar ?? "?",
      color: snap?.color ?? "#888888",
      personality: "",
    };
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-paper/90 backdrop-blur-sm border-b border-ink/5 p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-1">
            <button
              onClick={onBack}
              className="text-xs font-mono text-ink/30 hover:text-ink/60 transition-colors cursor-pointer"
            >
              &larr; History
            </button>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-ink/20">
                {new Date(item.timestamp).toLocaleString()}
              </span>
              <button
                onClick={onRemove}
                className="text-xs font-mono text-red-400/50 hover:text-red-400 transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
          <p className="text-ink/80 font-mono text-sm font-bold truncate">
            &ldquo;{item.config.topic}&rdquo;
          </p>
          <div className="flex items-center gap-3 mt-1 text-xs font-mono text-ink/40 flex-wrap">
            {item.config.debaters.map((key) => {
              const m = getModel(key);
              return (
                <span key={key} style={{ color: m.color }}>
                  {m.avatar} {m.displayName}
                </span>
              );
            })}
            <span className="text-ink/20">&middot;</span>
            <span className="text-yellow-600 dark:text-yellow-400/60">
              &#9878;&#65039; {getModel(item.config.judge).displayName}
            </span>
          </div>
        </div>
      </div>

      {/* Entries */}
      <div className="flex-1 max-w-3xl mx-auto w-full p-4 space-y-4">
        {item.entries.map((entry, i) => (
          <DebateEntryCard
            key={i}
            model={getModel(entry.modelKey)}
            round={entry.round}
            text={entry.text}
          />
        ))}

        {item.verdict && <VerdictCard text={item.verdict} />}
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-paper/90 backdrop-blur-sm border-t border-ink/5 p-4">
        <div className="max-w-3xl mx-auto flex justify-end">
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-lg border border-ink/20 text-ink font-mono text-sm hover:bg-ink/10 transition-colors cursor-pointer"
          >
            Back to History
          </button>
        </div>
      </div>
    </div>
  );
}
