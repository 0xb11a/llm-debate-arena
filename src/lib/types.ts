export interface ModelDef {
  key: string;
  openRouterId: string;
  displayName: string;
  provider: string;
  avatar: string;
  color: string;
  personality: string;
}

export interface DebateConfig {
  topic: string;
  rounds: number;
  debaters: string[];
  instructions: string[];
  judge: string;
  judgeInstruction: string;
}

export interface DebateEntry {
  modelKey: string;
  round: number;
  text: string;
  timestamp: number;
}

export type DebatePhase = "setup" | "debating" | "judging" | "done";

export interface DebateState {
  phase: DebatePhase;
  config: DebateConfig;
  entries: DebateEntry[];
  currentSpeaker: string | null;
  currentRound: number;
  currentDebaterIndex: number;
  streamingText: string;
  verdict: string | null;
  error: string | null;
}

export interface DebateHistoryItem {
  id: string;
  timestamp: number;
  config: DebateConfig;
  entries: DebateEntry[];
  verdict: string;
  /** Snapshot of display names so history works without re-fetching models */
  modelNames: Record<string, { displayName: string; avatar: string; color: string }>;
}

export type DebateAction =
  | { type: "SET_CONFIG"; config: DebateConfig }
  | { type: "START_DEBATE" }
  | { type: "START_TURN"; modelKey: string; round: number }
  | { type: "STREAM_CHUNK"; text: string }
  | { type: "END_TURN"; entry: DebateEntry }
  | { type: "START_JUDGING" }
  | { type: "STREAM_VERDICT"; text: string }
  | { type: "END_JUDGING"; verdict: string }
  | { type: "SET_ERROR"; error: string }
  | { type: "RESET" };
