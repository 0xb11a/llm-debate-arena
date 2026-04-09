import { fallbackModelDef } from "./models";
import { streamChatCompletion } from "./openrouter";
import {
  buildDebaterSystemPrompt,
  buildDebaterUserMessage,
  buildJudgeSystemPrompt,
  buildJudgeUserMessage,
} from "./prompts";
import { DebateConfig, DebateEntry, ModelDef } from "./types";

export interface DebateCallbacks {
  onTurnStart: (modelKey: string, round: number) => void;
  onChunk: (text: string) => void;
  onTurnEnd: (entry: DebateEntry) => void;
  onJudgingStart: () => void;
  onVerdictChunk: (text: string) => void;
  onVerdictEnd: (verdict: string) => void;
  onError: (error: string) => void;
}

export async function runDebate(
  apiKey: string,
  config: DebateConfig,
  models: Map<string, ModelDef>,
  callbacks: DebateCallbacks,
  signal: AbortSignal
): Promise<void> {
  const entries: DebateEntry[] = [];

  function getModel(key: string): ModelDef {
    return models.get(key) ?? fallbackModelDef(key);
  }

  for (let round = 1; round <= config.rounds; round++) {
    for (let i = 0; i < config.debaters.length; i++) {
      if (signal.aborted) return;

      const modelKey = config.debaters[i];
      const otherKeys = config.debaters.filter((_, idx) => idx !== i);

      callbacks.onTurnStart(modelKey, round);

      const systemPrompt = buildDebaterSystemPrompt(
        modelKey,
        otherKeys,
        config.topic,
        round,
        config.rounds,
        config.instructions[i] || "",
        models
      );
      const userMessage = buildDebaterUserMessage(
        config.topic,
        round,
        round === 1 && i === 0,
        entries,
        models
      );

      const model = getModel(modelKey);
      let turnText = "";

      await new Promise<void>((resolve, reject) => {
        streamChatCompletion(
          apiKey,
          model.openRouterId,
          systemPrompt,
          userMessage,
          {
            onChunk: (text) => {
              turnText += text;
              callbacks.onChunk(text);
            },
            onDone: () => resolve(),
            onError: (err) => reject(new Error(err)),
          },
          signal
        );
      });

      const entry: DebateEntry = {
        modelKey,
        round,
        text: turnText,
        timestamp: Date.now(),
      };
      entries.push(entry);
      callbacks.onTurnEnd(entry);

      // Small delay between calls to avoid rate limiting
      if (!(round === config.rounds && i === config.debaters.length - 1)) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }
  }

  // Judging phase
  if (signal.aborted) return;
  callbacks.onJudgingStart();

  const judgeSystemPrompt = buildJudgeSystemPrompt(config.judge, config.judgeInstruction, models);
  const judgeUserMessage = buildJudgeUserMessage(
    config.topic,
    config.debaters,
    entries,
    models
  );

  const judgeModel = getModel(config.judge);
  let verdictText = "";

  await new Promise<void>((resolve, reject) => {
    streamChatCompletion(
      apiKey,
      judgeModel.openRouterId,
      judgeSystemPrompt,
      judgeUserMessage,
      {
        onChunk: (text) => {
          verdictText += text;
          callbacks.onVerdictChunk(text);
        },
        onDone: () => resolve(),
        onError: (err) => reject(new Error(err)),
      },
      signal
    );
  });

  callbacks.onVerdictEnd(verdictText);
}
