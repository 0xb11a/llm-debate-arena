import { ModelDef } from "./types";

// --- Deterministic color from model ID ---

const COLOR_PALETTE = [
  "#10a37f", "#d4a27f", "#a78bfa", "#ef4444",
  "#3b82f6", "#f59e0b", "#06b6d4", "#ec4899",
  "#84cc16", "#8b5cf6", "#f97316", "#14b8a6",
];

function hashString(s: string): number {
  let hash = 5381;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) + hash + s.charCodeAt(i)) | 0;
  }
  return hash;
}

export function getModelColor(id: string): string {
  return COLOR_PALETTE[Math.abs(hashString(id)) % COLOR_PALETTE.length];
}

// --- Provider-based avatar ---

const PROVIDER_AVATARS: Record<string, string> = {
  openai: "⚡",
  anthropic: "✦",
  "x-ai": "𝕏",
  google: "◇",
  "meta-llama": "🦙",
  mistralai: "🌀",
  deepseek: "🔍",
  cohere: "◈",
  perplexity: "🔮",
};

function extractProvider(modelId: string): string {
  return modelId.split("/")[0] || "unknown";
}

export function getModelAvatar(modelId: string): string {
  const provider = extractProvider(modelId);
  return PROVIDER_AVATARS[provider] ?? "●";
}

// --- Personality overrides for known providers ---

const CURATED_PERSONALITIES: [string, string][] = [
  ["openai/", "Structured, analytical, evidence-driven, methodical. You build arguments step by step, marshaling data and logical frameworks. You prefer clarity over flair."],
  ["anthropic/", "Nuanced, philosophical, finds edge cases, elegant prose. You explore the spaces between positions, surfacing subtleties others miss. You write with care and precision."],
  ["x-ai/", "Sharp, irreverent, contrarian, cuts through politeness. You challenge assumptions directly, use wit to expose weak arguments, and don't sugarcoat your analysis."],
  ["google/", "Balanced, thorough, draws on broad knowledge. You consider multiple perspectives systematically and ground your arguments in well-sourced reasoning."],
  ["meta-llama/", "Direct, practical, community-oriented. You favor clear reasoning and accessible arguments, cutting through jargon to reach the core of an issue."],
  ["mistralai/", "Precise, efficient, cosmopolitan. You synthesize ideas concisely, blending analytical rigor with continental intellectual flair."],
  ["deepseek/", "Methodical, detail-oriented, rigorous. You approach topics with thorough technical analysis and carefully structured arguments."],
];

const DEFAULT_PERSONALITY =
  "Thoughtful, rigorous, and substantive. You build arguments carefully, engage directly with opposing points, and pursue truth over rhetoric.";

export function getPersonality(modelId: string): string {
  for (const [prefix, personality] of CURATED_PERSONALITIES) {
    if (modelId.startsWith(prefix)) return personality;
  }
  return DEFAULT_PERSONALITY;
}

// --- Build ModelDef from OpenRouter API response ---

export interface OpenRouterModel {
  id: string;
  name: string;
}

function formatProviderName(slug: string): string {
  const names: Record<string, string> = {
    openai: "OpenAI",
    anthropic: "Anthropic",
    "x-ai": "xAI",
    google: "Google",
    "meta-llama": "Meta",
    mistralai: "Mistral",
    deepseek: "DeepSeek",
    cohere: "Cohere",
    perplexity: "Perplexity",
  };
  return names[slug] ?? slug.charAt(0).toUpperCase() + slug.slice(1);
}

export function buildModelDef(raw: OpenRouterModel): ModelDef {
  const providerSlug = extractProvider(raw.id);
  return {
    key: raw.id,
    openRouterId: raw.id,
    displayName: raw.name,
    provider: formatProviderName(providerSlug),
    avatar: getModelAvatar(raw.id),
    color: getModelColor(raw.id),
    personality: getPersonality(raw.id),
  };
}

export function fallbackModelDef(id: string): ModelDef {
  return buildModelDef({ id, name: id.split("/").pop() || id });
}

// --- Suggested topics ---

export const SUGGESTED_TOPICS = [
  "How should humanity govern superintelligent AI?",
  "What is the ideal economic system for 2050?",
  "Should humans colonize Mars?",
  "What is consciousness?",
  "How should we handle deepfakes?",
  "Is privacy still possible in the digital age?",
  "What role should religion play in modern society?",
  "How should we restructure education for the AI era?",
  "The right balance between free speech and safety",
  "How should we approach human genetic engineering?",
];
