"use client";

import { useState } from "react";
import { getPersonality, SUGGESTED_TOPICS } from "@/lib/models";
import { DebateConfig, ModelDef } from "@/lib/types";
import { InstructionModal } from "./InstructionModal";
import { ModelSelect } from "./ModelSelect";
import { TopicChip } from "./TopicChip";

const MIN_DEBATERS = 2;
const MAX_DEBATERS = 6;

interface DebateSetupProps {
  config: DebateConfig;
  models: ModelDef[];
  onConfigChange: (config: DebateConfig) => void;
  onStart: () => void;
}

type ModalTarget = { type: "debater"; index: number } | { type: "judge" } | null;

export function DebateSetup({ config, models, onConfigChange, onStart }: DebateSetupProps) {
  const [customTopic, setCustomTopic] = useState(config.topic);
  const [modalTarget, setModalTarget] = useState<ModalTarget>(null);

  const setTopic = (topic: string) => {
    setCustomTopic(topic);
    onConfigChange({ ...config, topic });
  };

  const setDebater = (index: number, key: string) => {
    const debaters = [...config.debaters];
    const instructions = [...config.instructions];
    debaters[index] = key;
    instructions[index] = getPersonality(key);
    onConfigChange({ ...config, debaters, instructions });
  };

  const setInstruction = (index: number, value: string) => {
    const instructions = [...config.instructions];
    instructions[index] = value;
    onConfigChange({ ...config, instructions });
  };

  const addDebater = () => {
    if (config.debaters.length < MAX_DEBATERS) {
      onConfigChange({
        ...config,
        debaters: [...config.debaters, ""],
        instructions: [...config.instructions, ""],
      });
    }
  };

  const removeDebater = (index: number) => {
    if (config.debaters.length > MIN_DEBATERS) {
      onConfigChange({
        ...config,
        debaters: config.debaters.filter((_, i) => i !== index),
        instructions: config.instructions.filter((_, i) => i !== index),
      });
    }
  };

  const setJudge = (key: string) => {
    onConfigChange({ ...config, judge: key });
  };

  const setJudgeInstruction = (value: string) => {
    onConfigChange({ ...config, judgeInstruction: value });
  };

  const setRounds = (rounds: number) => {
    onConfigChange({ ...config, rounds });
  };

  const handleModalSave = (value: string) => {
    if (!modalTarget) return;
    if (modalTarget.type === "debater") {
      setInstruction(modalTarget.index, value);
    } else {
      setJudgeInstruction(value);
    }
  };

  const getModalTitle = (): string => {
    if (!modalTarget) return "";
    if (modalTarget.type === "judge") {
      const m = models.find((m) => m.key === config.judge);
      return `Judge Instructions \u2014 ${m?.displayName ?? "Judge"}`;
    }
    const m = models.find((m) => m.key === config.debaters[modalTarget.index]);
    return `Debater ${modalTarget.index + 1} Instructions \u2014 ${m?.displayName ?? ""}`;
  };

  const getModalValue = (): string => {
    if (!modalTarget) return "";
    if (modalTarget.type === "judge") return config.judgeInstruction;
    return config.instructions[modalTarget.index] || "";
  };

  const allDebatersSelected = config.debaters.every((d) => d !== "");
  const selectedDebaters = config.debaters.filter(Boolean);
  const hasUniqueDebaters = new Set(selectedDebaters).size === selectedDebaters.length;
  const canStart =
    config.topic.trim().length > 0 &&
    config.debaters.length >= MIN_DEBATERS &&
    allDebatersSelected &&
    hasUniqueDebaters &&
    config.judge !== "";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-mono font-bold tracking-tight text-ink">
            LLM DEBATE ARENA
          </h1>
          <p className="text-ink/40 font-mono text-sm">
            {config.debaters.length}&nbsp;agents &middot; neutral &middot; no sides
          </p>
        </div>

        {/* Topic */}
        <div className="space-y-3">
          <label className="block text-xs font-mono text-ink/50 uppercase tracking-wider">
            Topic
          </label>
          <input
            type="text"
            value={customTopic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter a debate topic..."
            className="w-full px-4 py-3 rounded-lg bg-ink/5 border border-ink/10 text-ink font-mono text-sm placeholder:text-ink/20 focus:outline-none focus:border-ink/30 transition-colors"
          />
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_TOPICS.map((t) => (
              <TopicChip
                key={t}
                topic={t}
                selected={config.topic === t}
                onClick={() => setTopic(t)}
              />
            ))}
          </div>
        </div>

        {/* Debaters */}
        <div className="space-y-4">
          <label className="block text-xs font-mono text-ink/50 uppercase tracking-wider">
            Debaters ({config.debaters.length})
          </label>
          {config.debaters.map((_, i) => {
            const otherDebaters = new Set(
              config.debaters.filter((d, idx) => idx !== i && d !== "")
            );
            const hasInstruction = !!(config.instructions[i]?.trim());
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs font-mono text-ink/30 w-5 shrink-0">{i + 1}.</span>
                <div className="flex-1">
                  <ModelSelect
                    value={config.debaters[i]}
                    onChange={(key) => setDebater(i, key)}
                    models={models}
                    disabledIds={otherDebaters}
                    placeholder="Select a model..."
                  />
                </div>
                {config.debaters[i] && (
                  <button
                    onClick={() => setModalTarget({ type: "debater", index: i })}
                    className={`shrink-0 w-8 h-8 rounded-lg border font-mono text-xs transition-colors cursor-pointer ${
                      hasInstruction
                        ? "border-ink/20 text-ink/50 hover:text-ink/70"
                        : "border-ink/10 text-ink/20 hover:text-ink/40"
                    }`}
                    title="Edit instructions"
                  >
                    {"{}"}
                  </button>
                )}
                {config.debaters.length > MIN_DEBATERS && (
                  <button
                    onClick={() => removeDebater(i)}
                    className="shrink-0 w-8 h-8 rounded-lg border border-ink/10 text-ink/30 hover:text-red-400 hover:border-red-400/30 font-mono text-sm transition-colors cursor-pointer"
                    title="Remove debater"
                  >
                    &times;
                  </button>
                )}
              </div>
            );
          })}
          {config.debaters.length < MAX_DEBATERS && (
            <button
              onClick={addDebater}
              className="w-full py-2 rounded-lg border border-dashed border-ink/10 text-ink/30 hover:text-ink/50 hover:border-ink/20 font-mono text-xs transition-colors cursor-pointer"
            >
              + Add Debater
            </button>
          )}
        </div>

        {/* Judge */}
        <div className="space-y-2">
          <label className="block text-xs font-mono text-ink/50 uppercase tracking-wider">
            Judge
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <ModelSelect
                value={config.judge}
                onChange={setJudge}
                models={models}
                placeholder="Select a judge model..."
              />
            </div>
            {config.judge && (
              <button
                onClick={() => setModalTarget({ type: "judge" })}
                className={`shrink-0 w-8 h-8 rounded-lg border font-mono text-xs transition-colors cursor-pointer ${
                  config.judgeInstruction.trim()
                    ? "border-ink/20 text-ink/50 hover:text-ink/70"
                    : "border-ink/10 text-ink/20 hover:text-ink/40"
                }`}
                title="Edit judge instructions"
              >
                {"{}"}
              </button>
            )}
          </div>
        </div>

        {/* Rounds */}
        <div className="space-y-2">
          <label className="block text-xs font-mono text-ink/50 uppercase tracking-wider">
            Rounds
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setRounds(n)}
                className={`w-10 h-10 rounded-lg font-mono text-sm border transition-all cursor-pointer ${
                  config.rounds === n
                    ? "border-ink/40 bg-ink/10 text-ink"
                    : "border-ink/10 bg-ink/5 text-ink/40 hover:border-ink/20"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {allDebatersSelected && !hasUniqueDebaters && (
          <p className="text-yellow-500 dark:text-yellow-400/80 text-xs font-mono">
            Each debater must be a different model.
          </p>
        )}

        {/* Start */}
        <button
          onClick={onStart}
          disabled={!canStart}
          className="w-full py-4 rounded-lg bg-ink/10 border border-ink/20 text-ink font-mono font-bold tracking-wider hover:bg-ink/15 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          BEGIN DEBATE &#9876;&#65039;
        </button>
      </div>

      {/* Instruction Modal */}
      {modalTarget && (
        <InstructionModal
          title={getModalTitle()}
          value={getModalValue()}
          onSave={handleModalSave}
          onClose={() => setModalTarget(null)}
        />
      )}
    </div>
  );
}
