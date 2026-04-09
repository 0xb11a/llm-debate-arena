"use client";

import { useState } from "react";
import { validateAndFetchModels } from "@/lib/openrouter";

interface ApiKeyGateProps {
  onKeySet: (key: string, models: { id: string; name: string }[]) => void;
}

export function ApiKeyGate({ onKeySet }: ApiKeyGateProps) {
  const [key, setKey] = useState("");
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) return;

    setValidating(true);
    setError("");

    const result = await validateAndFetchModels(key.trim());
    setValidating(false);

    if (result.valid) {
      localStorage.setItem("openrouter-api-key", key.trim());
      onKeySet(key.trim(), result.models);
    } else {
      setError("Invalid API key. Check your key and try again.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 p-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-mono font-bold tracking-tight text-ink">
          LLM DEBATE ARENA
        </h1>
        <p className="text-ink/40 font-mono text-sm">
          2-6 agents &middot; neutral &middot; no sides
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
        <div className="space-y-2">
          <label className="block text-xs font-mono text-ink/50 uppercase tracking-wider">
            OpenRouter API Key
          </label>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="sk-or-..."
            className="w-full px-4 py-3 rounded-lg bg-ink/5 border border-ink/10 text-ink font-mono text-sm placeholder:text-ink/20 focus:outline-none focus:border-ink/30 transition-colors"
          />
        </div>

        {error && <p className="text-red-400 text-xs font-mono">{error}</p>}

        <button
          type="submit"
          disabled={validating || !key.trim()}
          className="w-full py-3 rounded-lg bg-ink/10 border border-ink/20 text-ink font-mono text-sm hover:bg-ink/15 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {validating ? "Connecting..." : "Connect"}
        </button>

        <p className="text-center text-ink/20 text-xs font-mono">
          Key stored in browser only &middot; never sent to our servers
        </p>
      </form>
    </div>
  );
}
