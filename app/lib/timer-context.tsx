import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import { useTimer, TIMER_DURATIONS } from './use-timer';
import { loadState, saveState, addSession, completeSession, abandonSession } from './storage';
import { playCompletionSound } from './sounds';
import type { AppState, Session, TimerMode, TimerSettings } from './types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TimerContextValue {
  // Timer
  mode: TimerMode;
  secondsLeft: number;
  isRunning: boolean;
  progress: number;
  totalSeconds: number;
  formatTime: (s: number) => string;
  start: () => void;
  pause: () => void;
  reset: () => void;
  switchMode: (m: TimerMode) => void;
  // App state
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  // Session
  currentSessionId: string | null;
  focusTopic: string;
  justCompleted: boolean;
  handleStart: () => void;
  handleReset: () => void;
  handleSwitchMode: (m: TimerMode) => void;
  // Settings
  updateSettings: (s: Partial<TimerSettings>) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const TimerContext = createContext<TimerContextValue | null>(null);

export function useTimerContext() {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error('useTimerContext must be used inside <TimerProvider>');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function TimerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState());
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [justCompleted, setJustCompleted] = useState(false);

  // Derive the focus topic from the first uncompleted todo
  const activeTodo = state.todos.find((t) => !t.completed);
  const focusTopic = activeTodo?.text ?? '';

  // Persist whenever state changes
  // Note: we do this inside handlers rather than an effect to avoid extra
  // renders, but a useEffect would also work — keeping parity with home.tsx.
  const persistAndSet: React.Dispatch<React.SetStateAction<AppState>> = useCallback((action) => {
    setState((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      saveState(next);
      return next;
    });
  }, []);

  const handleComplete = useCallback(
    (completedMode: TimerMode) => {
      playCompletionSound();
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 3000);

      if (completedMode === 'focus' && currentSessionId) {
        persistAndSet((prev) => completeSession(prev, currentSessionId));
        setCurrentSessionId(null);
      }

      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('Personal Pomodoro', {
          body:
            completedMode === 'focus'
              ? '🍅 Focus session complete! Time for a break.'
              : '☕ Break over — back to work!',
          icon: '/favicon.ico',
        });
      }
    },
    [currentSessionId, persistAndSet],
  );

  // Derive durations (in seconds) from persisted settings
  const durations = useMemo(
    () => ({
      focus: state.settings.focusDuration * 60,
      'short-break': state.settings.shortBreakDuration * 60,
      'long-break': state.settings.longBreakDuration * 60,
    }),
    [state.settings],
  );

  const {
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
  } = useTimer({ onComplete: handleComplete, durations });

  const updateSettings = useCallback(
    (patch: Partial<TimerSettings>) => {
      persistAndSet((prev) => ({
        ...prev,
        settings: { ...prev.settings, ...patch },
      }));
    },
    [persistAndSet],
  );

  const handleStart = useCallback(() => {
    if (mode === 'focus' && !currentSessionId) {
      const session: Session = {
        id: crypto.randomUUID(),
        focusTopic: focusTopic.trim() || 'Untitled session',
        startTime: new Date().toISOString(),
        endTime: null,
        completed: false,
        mode: 'focus',
      };
      persistAndSet((prev) => addSession(prev, session));
      setCurrentSessionId(session.id);
    }
    start();
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [mode, currentSessionId, focusTopic, start, persistAndSet]);

  const handleReset = useCallback(() => {
    if (currentSessionId) {
      persistAndSet((prev) => abandonSession(prev, currentSessionId));
      setCurrentSessionId(null);
    }
    reset();
  }, [currentSessionId, reset, persistAndSet]);

  const handleSwitchMode = useCallback(
    (newMode: TimerMode) => {
      if (currentSessionId) {
        persistAndSet((prev) => abandonSession(prev, currentSessionId));
        setCurrentSessionId(null);
      }
      switchMode(newMode);
    },
    [currentSessionId, switchMode, persistAndSet],
  );

  return (
    <TimerContext.Provider
      value={{
        mode,
        secondsLeft,
        isRunning,
        progress,
        totalSeconds,
        formatTime,
        start,
        pause,
        reset,
        switchMode,
        state,
        setState: persistAndSet,
        currentSessionId,
        focusTopic,
        justCompleted,
        handleStart,
        handleReset,
        handleSwitchMode,
        updateSettings,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}
