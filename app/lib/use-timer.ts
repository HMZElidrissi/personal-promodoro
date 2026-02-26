import { useState, useEffect, useRef, useCallback } from "react";
import type { TimerMode } from "./types";

export const TIMER_DURATIONS: Record<TimerMode, number> = {
  focus: 25 * 60,
  "short-break": 5 * 60,
  "long-break": 15 * 60,
};

export const MODE_LABELS: Record<TimerMode, string> = {
  focus: "Focus",
  "short-break": "Short Break",
  "long-break": "Long Break",
};

interface UseTimerOptions {
  onComplete?: (mode: TimerMode) => void;
}

export function useTimer({ onComplete }: UseTimerOptions = {}) {
  const [mode, setMode] = useState<TimerMode>("focus");
  const [secondsLeft, setSecondsLeft] = useState(TIMER_DURATIONS["focus"]);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Store onComplete in a ref so the interval effect doesn't need it as a
  // dependency — prevents the interval from being torn down every time
  // the parent re-creates the callback (e.g. when currentSessionId changes).
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  const totalSeconds = TIMER_DURATIONS[mode];
  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isRunning) {
      clearTimer();
      return;
    }

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearTimer();
          setIsRunning(false);
          onCompleteRef.current?.(mode);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return clearTimer;
  }, [isRunning, mode, clearTimer]);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setSecondsLeft(TIMER_DURATIONS[mode]);
  }, [mode]);

  const switchMode = useCallback((newMode: TimerMode) => {
    clearTimer();
    setIsRunning(false);
    setMode(newMode);
    setSecondsLeft(TIMER_DURATIONS[newMode]);
  }, [clearTimer]);

  const formatTime = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, []);

  return {
    mode,
    secondsLeft,
    isRunning,
    progress,
    totalSeconds,
    start,
    pause,
    reset,
    switchMode,
    formatTime,
  };
}
