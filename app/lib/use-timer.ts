import { useState, useEffect, useRef, useCallback } from 'react';
import type { TimerMode } from './types';

export const TIMER_DURATIONS: Record<TimerMode, number> = {
  focus: 25 * 60,
  'short-break': 5 * 60,
  'long-break': 15 * 60,
};

export const MODE_LABELS: Record<TimerMode, string> = {
  focus: 'Focus',
  'short-break': 'Short Break',
  'long-break': 'Long Break',
};

interface UseTimerOptions {
  onComplete?: (mode: TimerMode) => void;
  /** Custom durations in seconds per mode. Falls back to TIMER_DURATIONS. */
  durations?: Record<TimerMode, number>;
}

export function useTimer({ onComplete, durations }: UseTimerOptions = {}) {
  const [mode, setMode] = useState<TimerMode>('focus');
  const [isRunning, setIsRunning] = useState(false);

  const getDuration = useCallback(
    (m: TimerMode) => durations?.[m] ?? TIMER_DURATIONS[m],
    [durations],
  );

  const [secondsLeft, setSecondsLeft] = useState(() => getDuration('focus'));

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endsAtMsRef = useRef<number | null>(null);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  // When durations change and the timer is idle (not running and at full time),
  // snap the display to the new duration so the user sees the updated value.
  const durationsRef = useRef(durations);
  useEffect(() => {
    if (isRunning) return; // don't interrupt a running timer
    const prev = durationsRef.current;
    durationsRef.current = durations;
    const prevDur = prev?.[mode] ?? TIMER_DURATIONS[mode];
    const newDur = durations?.[mode] ?? TIMER_DURATIONS[mode];
    // Only snap when we're truly idle at the full duration for this mode.
    if (prevDur !== newDur && secondsLeft === prevDur) {
      setSecondsLeft(newDur);
    }
  }, [durations, mode, isRunning, secondsLeft]);

  const totalSeconds = getDuration(mode);
  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const computeSecondsLeft = useCallback((endsAtMs: number) => {
    const diffMs = endsAtMs - Date.now();
    return Math.max(0, Math.ceil(diffMs / 1000));
  }, []);

  const completeNow = useCallback(
    (completedMode: TimerMode) => {
      clearTimer();
      endsAtMsRef.current = null;
      setIsRunning(false);
      setSecondsLeft(0);
      onCompleteRef.current?.(completedMode);
    },
    [clearTimer],
  );

  const syncFromClock = useCallback(
    (runningMode: TimerMode) => {
      const endsAtMs = endsAtMsRef.current;
      if (endsAtMs == null) return;
      const next = computeSecondsLeft(endsAtMs);
      if (next <= 0) {
        completeNow(runningMode);
        return;
      }
      setSecondsLeft(next);
    },
    [computeSecondsLeft, completeNow],
  );

  useEffect(() => {
    if (!isRunning) {
      clearTimer();
      return;
    }

    if (endsAtMsRef.current == null) {
      endsAtMsRef.current = Date.now() + secondsLeft * 1000;
    }

    // Run an immediate sync so the UI doesn't wait for the first tick.
    // If we already hit zero, complete immediately and don't schedule an interval.
    const endsAtMs = endsAtMsRef.current;
    if (endsAtMs != null) {
      const next = computeSecondsLeft(endsAtMs);
      if (next <= 0) {
        completeNow(mode);
        return;
      }
      setSecondsLeft(next);
    }

    intervalRef.current = setInterval(() => {
      syncFromClock(mode);
    }, 250);

    return clearTimer;
  }, [isRunning, mode, clearTimer, secondsLeft, syncFromClock, computeSecondsLeft, completeNow]);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => {
    const endsAtMs = endsAtMsRef.current;
    if (endsAtMs != null) {
      setSecondsLeft(computeSecondsLeft(endsAtMs));
    }
    endsAtMsRef.current = null;
    setIsRunning(false);
  }, [computeSecondsLeft]);

  const reset = useCallback(() => {
    setIsRunning(false);
    endsAtMsRef.current = null;
    setSecondsLeft(getDuration(mode));
  }, [mode, getDuration]);

  const switchMode = useCallback(
    (newMode: TimerMode) => {
      clearTimer();
      setIsRunning(false);
      endsAtMsRef.current = null;
      setMode(newMode);
      setSecondsLeft(getDuration(newMode));
    },
    [clearTimer, getDuration],
  );

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && isRunning) {
        syncFromClock(mode);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [isRunning, mode, syncFromClock]);

  const formatTime = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
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
