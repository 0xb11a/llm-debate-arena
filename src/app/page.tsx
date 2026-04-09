"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiKeyGate } from "@/components/ApiKeyGate";
import { DebateHistory } from "@/components/DebateHistory";
import { DebateSetup } from "@/components/DebateSetup";
import { DebateView } from "@/components/DebateView";
import { GitHubLink } from "@/components/GitHubLink";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useDebate } from "@/hooks/useDebate";
import { useDebateHistory } from "@/hooks/useDebateHistory";
import { buildModelDef, fallbackModelDef } from "@/lib/models";
import { DebateHistoryItem, ModelDef } from "@/lib/types";

export default function Home() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [models, setModels] = useState<ModelDef[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const { state, startDebate, cancelDebate, resetDebate, updateConfig } = useDebate();
  const { history, addItem, removeItem, clearHistory } = useDebateHistory();
  const savedDebateIdRef = useRef<string | null>(null);

  const modelsMap = useMemo(() => {
    const map = new Map<string, ModelDef>();
    for (const m of models) map.set(m.key, m);
    return map;
  }, [models]);

  useEffect(() => {
    const stored = localStorage.getItem("openrouter-api-key");
    if (stored) {
      setApiKey(stored);
      import("@/lib/openrouter").then(({ validateAndFetchModels }) => {
        validateAndFetchModels(stored).then((result) => {
          if (result.valid) {
            setModels(result.models.map(buildModelDef));
          }
        });
      });
    }
  }, []);

  // Auto-save completed debates to history
  useEffect(() => {
    if (state.phase === "done" && state.verdict && state.entries.length > 0) {
      const id = `${state.config.topic}-${state.entries[0]?.timestamp ?? Date.now()}`;
      if (savedDebateIdRef.current === id) return;
      savedDebateIdRef.current = id;

      const modelNames: DebateHistoryItem["modelNames"] = {};
      const allKeys = [...state.config.debaters, state.config.judge];
      for (const key of allKeys) {
        const m = modelsMap.get(key) ?? fallbackModelDef(key);
        modelNames[key] = { displayName: m.displayName, avatar: m.avatar, color: m.color };
      }
      addItem({
        id,
        timestamp: Date.now(),
        config: state.config,
        entries: state.entries,
        verdict: state.verdict,
        modelNames,
      });
    }
  }, [state.phase, state.verdict, state.entries, state.config, modelsMap, addItem]);

  const handleKeySet = useCallback(
    (key: string, rawModels: { id: string; name: string }[]) => {
      setApiKey(key);
      setModels(rawModels.map(buildModelDef));
    },
    []
  );

  const handleStart = useCallback(() => {
    if (apiKey) {
      savedDebateIdRef.current = null;
      startDebate(apiKey, modelsMap);
    }
  }, [apiKey, startDebate, modelsMap]);

  const handleExport = useCallback(async () => {
    const getModel = (key: string) => modelsMap.get(key) ?? fallbackModelDef(key);

    const lines = [
      `# LLM Debate Arena`,
      `## Topic: ${state.config.topic}`,
      `Debaters: ${state.config.debaters.map((k) => getModel(k).displayName).join(", ")}`,
      `Judge: ${getModel(state.config.judge).displayName}`,
      `Rounds: ${state.config.rounds}`,
      "",
      "---",
      "",
    ];

    for (const entry of state.entries) {
      const model = getModel(entry.modelKey);
      lines.push(`### ${model.avatar} ${model.displayName} — Round ${entry.round}`);
      lines.push("");
      lines.push(entry.text);
      lines.push("");
    }

    if (state.verdict) {
      lines.push("---");
      lines.push("");
      lines.push("## Verdict");
      lines.push("");
      lines.push(state.verdict);
    }

    const markdown = lines.join("\n");
    try {
      await navigator.clipboard.writeText(markdown);
    } catch {
      const blob = new Blob([markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "debate-export.md";
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [state, modelsMap]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("openrouter-api-key");
    setApiKey(null);
    setModels([]);
  }, []);

  if (!apiKey || models.length === 0) {
    return <ApiKeyGate onKeySet={handleKeySet} />;
  }

  if (showHistory) {
    return (
      <DebateHistory
        history={history}
        onClose={() => setShowHistory(false)}
        onRemove={removeItem}
        onClear={clearHistory}
      />
    );
  }

  if (state.phase === "setup") {
    return (
      <div className="relative">
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <GitHubLink />
          <ThemeToggle />
          {history.length > 0 && (
            <button
              onClick={() => setShowHistory(true)}
              className="text-xs font-mono text-ink/30 hover:text-ink/60 transition-colors cursor-pointer"
            >
              History ({history.length})
            </button>
          )}
          <button
            onClick={handleLogout}
            className="text-xs font-mono text-ink/30 hover:text-ink/60 transition-colors cursor-pointer"
          >
            Change API Key
          </button>
        </div>
        <DebateSetup
          config={state.config}
          models={models}
          onConfigChange={updateConfig}
          onStart={handleStart}
        />
      </div>
    );
  }

  return (
    <DebateView
      state={state}
      modelsMap={modelsMap}
      onCancel={cancelDebate}
      onReset={resetDebate}
      onExport={handleExport}
    />
  );
}
