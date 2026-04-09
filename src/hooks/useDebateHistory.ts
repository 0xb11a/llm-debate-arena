"use client";

import { useCallback, useEffect, useState } from "react";
import { DebateHistoryItem } from "@/lib/types";

const STORAGE_KEY = "debate-history";
const MAX_ITEMS = 50;

function loadHistory(): DebateHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as DebateHistoryItem[];
  } catch {
    return [];
  }
}

function saveHistory(items: DebateHistoryItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
}

export function useDebateHistory() {
  const [history, setHistory] = useState<DebateHistoryItem[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const addItem = useCallback((item: DebateHistoryItem) => {
    setHistory((prev) => {
      // Avoid duplicates (same id)
      if (prev.some((h) => h.id === item.id)) return prev;
      const next = [item, ...prev].slice(0, MAX_ITEMS);
      saveHistory(next);
      return next;
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setHistory((prev) => {
      const next = prev.filter((h) => h.id !== id);
      saveHistory(next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setHistory([]);
  }, []);

  return { history, addItem, removeItem, clearHistory };
}
