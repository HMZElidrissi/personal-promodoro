export type TimerMode = 'focus' | 'short-break' | 'long-break';

export interface TimerSettings {
  focusDuration: number; // minutes
  shortBreakDuration: number; // minutes
  longBreakDuration: number; // minutes
}

export const DEFAULT_SETTINGS: TimerSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
};

export interface Session {
  id: string;
  focusTopic: string;
  startTime: string; // ISO string
  endTime: string | null; // ISO string or null if ongoing
  completed: boolean;
  mode: TimerMode;
}

export interface Distraction {
  id: string;
  text: string;
  createdAt: string; // ISO string
  resolved: boolean;
}

export interface TodoItem {
  id: string;
  text: string;
  createdAt: string; // ISO string
  completed: boolean;
}

export interface AppState {
  sessions: Session[];
  distractions: Distraction[];
  todos: TodoItem[];
  pomodoroCount: number; // how many focus rounds completed today
  lastResetDate: string; // date string "YYYY-MM-DD" for daily reset logic
  settings: TimerSettings;
}
