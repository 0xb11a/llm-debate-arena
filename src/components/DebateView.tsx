"use client";

import { useEffect, useRef } from "react";
import { fallbackModelDef } from "@/lib/models";
import { DebateState, ModelDef } from "@/lib/types";
import { DebateEntryCard } from "./DebateEntry";
import { VerdictCard } from "./VerdictCard";

interface DebateViewProps {
  state: DebateState;
  modelsMap: Map<string, ModelDef>;
  onCancel: () => void;
  onReset: () => void;
  onExport: () => void;
}

function getModel(map: Map<string, ModelDef>, key: string): ModelDef {
  return map.get(key) ?? fallbackModelDef(key);
}

export function DebateView({ state, modelsMap, onCancel, onReset, onExport }: DebateViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.entries.length, state.streamingText, state.verdict]);

  const isActive = state.phase === "debating" || state.phase === "judging";

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-paper/90 backdrop-blur-sm border-b border-ink/5 p-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-ink/80 font-mono text-sm font-bold truncate">
            &ldquo;{state.config.topic}&rdquo;
          </p>
          <div className="flex items-center gap-3 mt-1 text-xs font-mono text-ink/40 flex-wrap">
            {state.config.debaters.map((key) => {
              const m = getModel(modelsMap, key);
              return (
                <span key={key} style={{ color: m.color }}>
                  {m.avatar} {m.displayName}
                </span>
              );
            })}
            <span className="text-ink/20">&middot;</span>
            <span className="text-yellow-600 dark:text-yellow-400/60">
              &#9878;&#65039; {getModel(modelsMap, state.config.judge).displayName}
            </span>
          </div>
        </div>
      </div>

      {/* Entries */}
      <div className="flex-1 max-w-3xl mx-auto w-full p-4 space-y-4">
        {state.entries.map((entry, i) => (
          <DebateEntryCard
            key={i}
            model={getModel(modelsMap, entry.modelKey)}
            round={entry.round}
            text={entry.text}
          />
        ))}

        {/* Streaming debater turn */}
        {state.phase === "debating" && state.currentSpeaker && state.streamingText && (
          <DebateEntryCard
            model={getModel(modelsMap, state.currentSpeaker)}
            round={state.currentRound}
            text={state.streamingText}
            isStreaming
          />
        )}

        {/* Thinking indicator */}
        {state.phase === "debating" && state.currentSpeaker && !state.streamingText && (() => {
          const m = getModel(modelsMap, state.currentSpeaker);
          return (
            <div className="flex items-center gap-2 py-2 font-mono text-sm animate-pulse">
              <span style={{ color: m.color }}>
                {m.avatar} {m.displayName}
              </span>
              <span className="text-ink/30">is thinking...</span>
            </div>
          );
        })()}

        {/* Judging */}
        {(state.phase === "judging" || state.phase === "done") && state.streamingText && (
          <VerdictCard text={state.streamingText} isStreaming={state.phase === "judging"} />
        )}

        {state.phase === "done" && state.verdict && !state.streamingText && (
          <VerdictCard text={state.verdict} />
        )}

        {/* Judging thinking indicator */}
        {state.phase === "judging" && !state.streamingText && (
          <div className="flex items-center gap-2 py-2 font-mono text-sm animate-pulse">
            <span className="text-yellow-600 dark:text-yellow-400">&#9878;&#65039;</span>
            <span className="text-ink/30">Judge is deliberating...</span>
          </div>
        )}

        {/* Error */}
        {state.error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4 font-mono text-sm text-red-500 dark:text-red-400">
            {state.error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Footer actions */}
      <div className="sticky bottom-0 bg-paper/90 backdrop-blur-sm border-t border-ink/5 p-4">
        <div className="max-w-3xl mx-auto flex justify-end gap-3">
          {isActive && (
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-lg border border-red-500/30 text-red-500 dark:text-red-400 font-mono text-sm hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          )}
          {state.phase === "done" && (
            <>
              <button
                onClick={onExport}
                className="px-4 py-2 rounded-lg border border-ink/10 text-ink/60 font-mono text-sm hover:bg-ink/5 transition-colors cursor-pointer"
              >
                Export
              </button>
              <button
                onClick={onReset}
                className="px-4 py-2 rounded-lg border border-ink/20 text-ink font-mono text-sm hover:bg-ink/10 transition-colors cursor-pointer"
              >
                New Debate
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
