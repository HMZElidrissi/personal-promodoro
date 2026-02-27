import type { AppState, Session, Distraction, TodoItem } from './types';
import { DEFAULT_SETTINGS } from './types';

const STORAGE_KEY = 'pomodoro-app-state';

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function loadState(): AppState {
  if (typeof window === 'undefined') {
    return getDefaultState();
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultState();
    const parsed = JSON.parse(raw) as AppState;
    // Migrate: add todos array if missing (backwards compat)
    if (!parsed.todos) parsed.todos = [];
    // Migrate: add settings if missing (backwards compat)
    if (!parsed.settings) {
      parsed.settings = { ...DEFAULT_SETTINGS };
    } else {
      // Ensure any new settings keys get defaults
      parsed.settings = { ...DEFAULT_SETTINGS, ...parsed.settings };
    }
    // Reset daily pomodoroCount if the date changed
    if (parsed.lastResetDate !== todayString()) {
      parsed.pomodoroCount = 0;
      parsed.lastResetDate = todayString();
    }
    return parsed;
  } catch {
    return getDefaultState();
  }
}

export function saveState(state: AppState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage quota exceeded — ignore silently
  }
}

function getDefaultState(): AppState {
  return {
    sessions: [],
    distractions: [],
    todos: [],
    pomodoroCount: 0,
    lastResetDate: todayString(),
    settings: { ...DEFAULT_SETTINGS },
  };
}

// ── Sessions ──────────────────────────────────────────────

export function addSession(state: AppState, session: Session): AppState {
  return { ...state, sessions: [session, ...state.sessions] };
}

export function completeSession(state: AppState, id: string): AppState {
  return {
    ...state,
    sessions: state.sessions.map((s) =>
      s.id === id ? { ...s, completed: true, endTime: new Date().toISOString() } : s,
    ),
    pomodoroCount: state.pomodoroCount + 1,
  };
}

export function abandonSession(state: AppState, id: string): AppState {
  return {
    ...state,
    sessions: state.sessions.map((s) =>
      s.id === id ? { ...s, endTime: new Date().toISOString() } : s,
    ),
  };
}

export function clearSessions(state: AppState): AppState {
  return { ...state, sessions: [], pomodoroCount: 0 };
}

export function getTodaySessions(state: AppState): Session[] {
  const today = todayString();
  return state.sessions.filter((s) => s.startTime.slice(0, 10) === today);
}

// ── Distractions ──────────────────────────────────────────

export function addDistraction(state: AppState, distraction: Distraction): AppState {
  return { ...state, distractions: [distraction, ...state.distractions] };
}

export function toggleDistraction(state: AppState, id: string): AppState {
  return {
    ...state,
    distractions: state.distractions.map((d) =>
      d.id === id ? { ...d, resolved: !d.resolved } : d,
    ),
  };
}

export function deleteDistraction(state: AppState, id: string): AppState {
  return {
    ...state,
    distractions: state.distractions.filter((d) => d.id !== id),
  };
}

export function clearResolvedDistractions(state: AppState): AppState {
  return {
    ...state,
    distractions: state.distractions.filter((d) => !d.resolved),
  };
}

// ── Todos ──────────────────────────────────────────────────

export function addTodo(state: AppState, todo: TodoItem): AppState {
  return { ...state, todos: [...state.todos, todo] };
}

export function toggleTodo(state: AppState, id: string): AppState {
  return {
    ...state,
    todos: state.todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
  };
}

export function deleteTodo(state: AppState, id: string): AppState {
  return { ...state, todos: state.todos.filter((t) => t.id !== id) };
}
