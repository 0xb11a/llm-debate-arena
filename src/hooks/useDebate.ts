"use client";

import { useCallback, useReducer, useRef } from "react";
import { runDebate } from "@/lib/debate-engine";
import { DebateAction, DebateConfig, DebateState, ModelDef } from "@/lib/types";

const initialConfig: DebateConfig = {
  topic: "",
  rounds: 3,
  debaters: ["", ""],
  instructions: ["", ""],
  judge: "",
  judgeInstruction: "You are an impartial debate judge. Evaluate rigorously and specifically.",
};

const initialState: DebateState = {
  phase: "setup",
  config: initialConfig,
  entries: [],
  currentSpeaker: null,
  currentRound: 0,
  currentDebaterIndex: 0,
  streamingText: "",
  verdict: null,
  error: null,
};

function debateReducer(state: DebateState, action: DebateAction): DebateState {
  switch (action.type) {
    case "SET_CONFIG":
      return { ...state, config: action.config };
    case "START_DEBATE":
      return {
        ...state,
        phase: "debating",
        entries: [],
        verdict: null,
        error: null,
        currentRound: 1,
        currentDebaterIndex: 0,
        streamingText: "",
      };
    case "START_TURN":
      return {
        ...state,
        currentSpeaker: action.modelKey,
        currentRound: action.round,
        streamingText: "",
      };
    case "STREAM_CHUNK":
      return {
        ...state,
        streamingText: state.streamingText + action.text,
      };
    case "END_TURN":
      return {
        ...state,
        entries: [...state.entries, action.entry],
        currentSpeaker: null,
        streamingText: "",
      };
    case "START_JUDGING":
      return {
        ...state,
        phase: "judging",
        currentSpeaker: null,
        streamingText: "",
      };
    case "STREAM_VERDICT":
      return {
        ...state,
        streamingText: state.streamingText + action.text,
      };
    case "END_JUDGING":
      return {
        ...state,
        phase: "done",
        verdict: action.verdict,
        streamingText: "",
      };
    case "SET_ERROR":
      return { ...state, error: action.error, currentSpeaker: null };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

export function useDebate() {
  const [state, dispatch] = useReducer(debateReducer, initialState);
  const abortRef = useRef<AbortController | null>(null);

  const startDebate = useCallback(
    async (apiKey: string, modelsMap: Map<string, ModelDef>) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      dispatch({ type: "START_DEBATE" });

      try {
        await runDebate(
          apiKey,
          state.config,
          modelsMap,
          {
            onTurnStart: (modelKey: string, round: number) => {
              dispatch({ type: "START_TURN", modelKey, round });
            },
            onChunk: (text: string) => {
              dispatch({ type: "STREAM_CHUNK", text });
            },
            onTurnEnd: (entry) => {
              dispatch({ type: "END_TURN", entry });
            },
            onJudgingStart: () => {
              dispatch({ type: "START_JUDGING" });
            },
            onVerdictChunk: (text: string) => {
              dispatch({ type: "STREAM_VERDICT", text });
            },
            onVerdictEnd: (verdict: string) => {
              dispatch({ type: "END_JUDGING", verdict });
            },
            onError: (error: string) => {
              dispatch({ type: "SET_ERROR", error });
            },
          },
          controller.signal
        );
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          dispatch({ type: "SET_ERROR", error: err.message });
        }
      }
    },
    [state.config]
  );

  const cancelDebate = useCallback(() => {
    abortRef.current?.abort();
    dispatch({ type: "SET_ERROR", error: "Debate cancelled" });
  }, []);

  const resetDebate = useCallback(() => {
    abortRef.current?.abort();
    dispatch({ type: "RESET" });
  }, []);

  const updateConfig = useCallback((config: DebateConfig) => {
    dispatch({ type: "SET_CONFIG", config });
  }, []);

  return {
    state,
    startDebate,
    cancelDebate,
    resetDebate,
    updateConfig,
  };
}
