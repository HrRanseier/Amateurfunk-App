import { useCallback, useEffect, useState } from "react";

import { storage } from "@/src/utils/storage";

const HISTORY_KEY = "funk_morse_history_v1";
const MAX_ITEMS = 12;

// Local persistence of recently converted texts (stored as a JSON string since
// the storage util only round-trips primitive values).
export function useHistory() {
  const [items, setItems] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;
    storage.getItem(HISTORY_KEY, "[]").then((raw) => {
      if (!mounted) return;
      try {
        const parsed = JSON.parse(raw ?? "[]");
        if (Array.isArray(parsed)) setItems(parsed.filter((x) => typeof x === "string"));
      } catch {
        setItems([]);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const add = useCallback((text: string) => {
    const value = text.trim();
    if (!value) return;
    setItems((prev) => {
      const next = [value, ...prev.filter((x) => x !== value)].slice(0, MAX_ITEMS);
      storage.setItem(HISTORY_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    storage.removeItem(HISTORY_KEY);
  }, []);

  return { items, add, clear };
}
