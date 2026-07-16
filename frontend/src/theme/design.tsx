import React, { createContext, useContext, useEffect, useState } from "react";

import { storage } from "@/src/utils/storage";

// Global design mode. Two options:
//  - "minimal": existing automatic light/dark theme (default)
//  - "darkbg":  fixed dark background images, independent of the OS theme
export type DesignMode = "minimal" | "darkbg";

const STORAGE_KEY = "funk_design_mode_v1";

type DesignContextValue = {
  mode: DesignMode;
  setMode: (m: DesignMode) => void;
  ready: boolean;
};

export const DesignContext = createContext<DesignContextValue>({
  mode: "minimal",
  setMode: () => {},
  ready: false,
});

export function DesignProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<DesignMode>("minimal");
  const [ready, setReady] = useState(false);

  // Read the saved choice BEFORE the UI renders (RootLayout gates on `ready`).
  useEffect(() => {
    (async () => {
      const saved = await storage.getItem<DesignMode>(STORAGE_KEY, "minimal");
      if (saved === "darkbg" || saved === "minimal") setModeState(saved);
      setReady(true);
    })();
  }, []);

  const setMode = (m: DesignMode) => {
    setModeState(m);
    storage.setItem(STORAGE_KEY, m);
  };

  return <DesignContext.Provider value={{ mode, setMode, ready }}>{children}</DesignContext.Provider>;
}

export function useDesign() {
  return useContext(DesignContext);
}
