"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Contagem regressiva em segundos, um tique por segundo, que para em zero.
 * Usada no limite de tentativas (`Retry-After`) e no "reenviar link" (spec 013).
 *
 * @returns `remaining` (0 quando parado), `isRunning` e `start(seconds)` para (re)começar.
 * @example const { remaining, isRunning, start } = useCountdown(); start(error.retryAfterSeconds ?? 30);
 */
export function useCountdown() {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = setTimeout(() => setRemaining((current) => Math.max(0, current - 1)), 1000);
    return () => clearTimeout(timer);
  }, [remaining]);

  const start = useCallback((seconds: number) => setRemaining(Math.max(0, Math.ceil(seconds))), []);

  return { remaining, isRunning: remaining > 0, start };
}
