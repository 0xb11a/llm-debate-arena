"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiKeyGate } from "@/components/ApiKeyGate";
import { DebateSetup } from "@/components/DebateSetup";
import { DebateView } from "@/components/DebateView";
import { GitHubLink } from "@/components/GitHubLink";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useDebate } from "@/hooks/useDebate";
import { buildModelDef, fallbackModelDef } from "@/lib/models";
import { ModelDef } from "@/lib/types";

export default function Home() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [models, setModels] = useState<ModelDef[]>([]);
  const { state, startDebate, cancelDebate, resetDebate, updateConfig } = useDebate();

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

  const handleKeySet = useCallback(
    (key: string, rawModels: { id: string; name: string }[]) => {
      setApiKey(key);
      setModels(rawModels.map(buildModelDef));
    },
    []
  );

  const handleStart = useCallback(() => {
    if (apiKey) startDebate(apiKey, modelsMap);
  }, [apiKey, startDebate, modelsMap]);

  const handleExport = useCallback(() => {
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
    navigator.clipboard.writeText(markdown);
  }, [state, modelsMap]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("openrouter-api-key");
    setApiKey(null);
    setModels([]);
  }, []);

  if (!apiKey || models.length === 0) {
    return <ApiKeyGate onKeySet={handleKeySet} />;
  }

  if (state.phase === "setup") {
    return (
      <div className="relative">
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <GitHubLink />
          <ThemeToggle />
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
