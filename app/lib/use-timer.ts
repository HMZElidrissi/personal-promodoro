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
    if (prevDur !== newDur) {
      setSecondsLeft(newDur);
    }
  }, [durations, mode, isRunning]);

  const totalSeconds = getDuration(mode);
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
    setSecondsLeft(getDuration(mode));
  }, [mode, getDuration]);

  const switchMode = useCallback(
    (newMode: TimerMode) => {
      clearTimer();
      setIsRunning(false);
      setMode(newMode);
      setSecondsLeft(getDuration(newMode));
    },
    [clearTimer, getDuration],
  );

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
