"use client";

import { useCallback, useState } from "react";

export function useTurnstileChallenge() {
  const [token, setToken] = useState("");
  const [generation, setGeneration] = useState(0);
  const reset = useCallback(() => {
    setToken("");
    setGeneration((value) => value + 1);
  }, []);

  return { token, setToken, generation, reset };
}
