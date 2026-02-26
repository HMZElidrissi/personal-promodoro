import { useState, useCallback, useEffect, useRef } from "react";
import { Layout } from "@/components/app-layout";
import {
  CircularProgress,
  CircularProgressIndicator,
  CircularProgressTrack,
  CircularProgressRange,
} from "@/components/ui/circular-progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Play,
  Pause,
  RotateCcw,
  Plus,
  Trash2,
  Coffee,
  Zap,
  Moon,
  CheckCircle2,
  Clock,
  ListChecks,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTimer, TIMER_DURATIONS, MODE_LABELS } from "@/lib/use-timer";
import {
  loadState,
  saveState,
  addSession,
  completeSession,
  abandonSession,
  addDistraction,
  toggleDistraction,
  deleteDistraction,
  getTodaySessions,
  addTodo,
  toggleTodo,
  deleteTodo,
} from "@/lib/storage";
import { playCompletionSound } from "@/lib/sounds";
import type { AppState, Session, Distraction, TimerMode, TodoItem } from "@/lib/types";

const MODE_CONFIG: Record<
  TimerMode,
  {
    trackClass: string;
    rangeClass: string;
    glowClass: string;
    bgAccent: string;
    icon: React.ReactNode;
    label: string;
  }
> = {
  focus: {
    trackClass: "text-primary/10",
    rangeClass: "text-primary",
    glowClass: "glow-primary",
    bgAccent: "bg-primary/5 border-primary/20",
    icon: <Zap className="size-4" />,
    label: "Focus",
  },
  "short-break": {
    trackClass: "text-emerald-500/10",
    rangeClass: "text-emerald-500",
    glowClass: "glow-break",
    bgAccent: "bg-emerald-500/5 border-emerald-500/20",
    icon: <Coffee className="size-4" />,
    label: "Short Break",
  },
  "long-break": {
    trackClass: "text-blue-400/10",
    rangeClass: "text-blue-400",
    glowClass: "glow-long-break",
    bgAccent: "bg-blue-400/5 border-blue-400/20",
    icon: <Moon className="size-4" />,
    label: "Long Break",
  },
};

export function meta() {
  return [
    { title: "Focus Flow — Pomodoro Timer" },
    {
      name: "description",
      content:
        "Stay focused with the Pomodoro technique. Track your sessions and capture distractions.",
    },
  ];
}

export default function HomePage() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [todoInput, setTodoInput] = useState("");
  const [distractionInput, setDistractionInput] = useState("");
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [justCompleted, setJustCompleted] = useState(false);
  const distractionInputRef = useRef<HTMLInputElement>(null);
  const todoInputRef = useRef<HTMLInputElement>(null);

  // Derive the focus topic from the first uncompleted todo
  const activeTodo = state.todos.find((t) => !t.completed);
  const focusTopic = activeTodo?.text ?? "";

  // Persist state changes
  useEffect(() => {
    saveState(state);
  }, [state]);

  const handleComplete = useCallback(
    (completedMode: TimerMode) => {
      playCompletionSound();
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 3000);

      if (completedMode === "focus" && currentSessionId) {
        setState((prev) => completeSession(prev, currentSessionId));
        setCurrentSessionId(null);
      }

      // Browser notification
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification("Focus Flow", {
          body:
            completedMode === "focus"
              ? "🍅 Focus session complete! Time for a break."
              : "☕ Break over — back to work!",
          icon: "/favicon.ico",
        });
      }
    },
    [currentSessionId]
  );

  const { mode, secondsLeft, isRunning, progress, start, pause, reset, switchMode, formatTime } =
    useTimer({ onComplete: handleComplete });

  const config = MODE_CONFIG[mode];

  const handleStart = useCallback(() => {
    // Start a new session record when focus starts
    if (mode === "focus" && !currentSessionId) {
      const session: Session = {
        id: crypto.randomUUID(),
        focusTopic: focusTopic.trim() || "Untitled session",
        startTime: new Date().toISOString(),
        endTime: null,
        completed: false,
        mode: "focus",
      };
      setState((prev) => addSession(prev, session));
      setCurrentSessionId(session.id);
    }
    start();
    // Request notification permission
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [mode, currentSessionId, focusTopic, start]);

  const handleReset = useCallback(() => {
    if (currentSessionId) {
      setState((prev) => abandonSession(prev, currentSessionId));
      setCurrentSessionId(null);
    }
    reset();
  }, [currentSessionId, reset]);

  const handleSwitchMode = useCallback(
    (newMode: TimerMode) => {
      if (currentSessionId) {
        setState((prev) => abandonSession(prev, currentSessionId));
        setCurrentSessionId(null);
      }
      switchMode(newMode);
    },
    [currentSessionId, switchMode]
  );

  const handleAddTodo = useCallback(() => {
    const text = todoInput.trim();
    if (!text) return;
    const todo: TodoItem = {
      id: crypto.randomUUID(),
      text,
      createdAt: new Date().toISOString(),
      completed: false,
    };
    setState((prev) => addTodo(prev, todo));
    setTodoInput("");
  }, [todoInput]);

  const handleAddDistraction = useCallback(() => {
    const text = distractionInput.trim();
    if (!text) return;
    const d: Distraction = {
      id: crypto.randomUUID(),
      text,
      createdAt: new Date().toISOString(),
      resolved: false,
    };
    setState((prev) => addDistraction(prev, d));
    setDistractionInput("");
  }, [distractionInput]);

  const todaySessions = getTodaySessions(state);
  const completedToday = todaySessions.filter((s) => s.completed).length;
  const pendingDistractions = state.distractions.filter((d) => !d.resolved);

  const pomodoroRound = (state.pomodoroCount % 4) + 1;

  return (
    <Layout>
      <div className="flex flex-col gap-6 animate-slide-up">
        {/* ── Mode selector ── */}
        <div className="flex items-center justify-center gap-2">
          {(["focus", "short-break", "long-break"] as TimerMode[]).map((m) => {
            const cfg = MODE_CONFIG[m];
            return (
              <button
                key={m}
                id={`mode-${m}`}
                onClick={() => handleSwitchMode(m)}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-300",
                  mode === m
                    ? `${cfg.bgAccent} border text-foreground shadow-sm`
                    : "text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent"
                )}
              >
                {cfg.icon}
                {cfg.label}
              </button>
            );
          })}
        </div>

        {/* ── Main timer card ── */}
        <div
          className={cn(
            "glass rounded-3xl p-8 flex flex-col items-center gap-8 transition-all duration-500",
            config.glowClass
          )}
        >
          {/* Round indicator */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground font-medium">Round</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className={cn(
                    "size-2 rounded-full transition-all duration-300",
                    n <= pomodoroRound && mode === "focus" && isRunning
                      ? "bg-primary"
                      : n < pomodoroRound
                      ? "bg-primary/80"
                      : "bg-muted"
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              {completedToday} completed today
            </span>
          </div>

          {/* Timer ring */}
          <div className={cn("relative", justCompleted && "animate-pulse-ring")}>
            <CircularProgress
              value={progress}
              max={100}
              size={240}
              thickness={8}
              className="select-none"
            >
              <CircularProgressIndicator>
                <CircularProgressTrack className={config.trackClass} />
                <CircularProgressRange
                  className={cn(config.rangeClass, "transition-all duration-1000")}
                />
              </CircularProgressIndicator>

              {/* Center content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                <div className="text-5xl font-bold tabular-nums tracking-tighter leading-none">
                  {formatTime(secondsLeft)}
                </div>
                <div className="flex items-center gap-1 text-muted-foreground text-xs font-medium mt-1">
                  <Clock className="size-3" />
                  {MODE_LABELS[mode]}
                </div>
              </div>
            </CircularProgress>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <Button
              id="btn-reset"
              variant="ghost"
              size="icon"
              onClick={handleReset}
              className="size-10 rounded-full hover:bg-destructive/10 hover:text-destructive"
            >
              <RotateCcw className="size-4" />
            </Button>

            <Button
              id="btn-start-pause"
              onClick={isRunning ? pause : handleStart}
              size="lg"
              className={cn(
                "px-10 rounded-full font-semibold text-base transition-all duration-300",
                mode === "focus"
                  ? "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30"
                  : mode === "short-break"
                  ? "bg-emerald-500 hover:bg-emerald-500/90 shadow-lg shadow-emerald-500/30 text-white"
                  : "bg-blue-400 hover:bg-blue-400/90 shadow-lg shadow-blue-400/30 text-white"
              )}
            >
              {isRunning ? (
                <><Pause className="size-5 mr-2" /> Pause</>
              ) : secondsLeft === TIMER_DURATIONS[mode] ? (
                <><Play className="size-5 mr-2" /> Start</>
              ) : (
                <><Play className="size-5 mr-2" /> Resume</>
              )}
            </Button>

            <div className="size-10" /> {/* spacer */}
          </div>

          {/* Completion message */}
          {justCompleted && (
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-400 animate-slide-up">
              <CheckCircle2 className="size-4" />
              {mode === "focus" ? "Great work! Take a break." : "Break done — let's focus!"}
            </div>
          )}
        </div>

        {/* ── Focus topic + Today's history ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Focus topic → Todo list */}
          <div className="glass rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Zap className="size-4 text-primary" />
              <h2 className="font-semibold text-sm">What are you focusing on?</h2>
              {state.todos.filter((t) => !t.completed).length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-auto text-xs bg-primary/10 text-primary border-primary/20"
                >
                  {state.todos.filter((t) => !t.completed).length} left
                </Badge>
              )}
            </div>

            {/* Add todo input */}
            <div className="flex gap-2">
              <Input
                id="todo-input"
                ref={todoInputRef}
                placeholder="Add a task..."
                value={todoInput}
                onChange={(e) => setTodoInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTodo()}
                className="bg-input/50 border-border/50 focus-visible:ring-primary/50"
              />
              <Button
                id="btn-add-todo"
                size="icon"
                variant="outline"
                onClick={handleAddTodo}
                disabled={!todoInput.trim()}
                className="shrink-0 border-border/50 hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-colors"
              >
                <Plus className="size-4" />
              </Button>
            </div>

            {/* Todo list */}
            <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
              {state.todos.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Add a task to get started 📝
                </p>
              )}
              {state.todos.map((t, idx) => (
                <div
                  key={t.id}
                  className={cn(
                    "flex items-center gap-2 text-xs rounded-lg px-3 py-2 transition-all duration-200",
                    t.completed ? "bg-muted/20 opacity-50" : idx === 0 ? "bg-primary/10 border border-primary/20" : "bg-muted/40"
                  )}
                >
                  {idx === 0 && !t.completed && (
                    <Zap className="size-3 text-primary shrink-0" />
                  )}
                  <Checkbox
                    id={`todo-${t.id}`}
                    checked={t.completed}
                    onCheckedChange={() => setState((prev) => toggleTodo(prev, t.id))}
                    className="size-3.5 border-border/60 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <span
                    className={cn(
                      "flex-1 truncate",
                      t.completed && "line-through text-muted-foreground"
                    )}
                  >
                    {t.text}
                  </span>
                  <button
                    onClick={() => setState((prev) => deleteTodo(prev, t.id))}
                    className="text-muted-foreground/40 hover:text-destructive transition-colors shrink-0"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Today's sessions */}
            {todaySessions.length > 0 && (
              <>
                <Separator className="bg-border/40" />
                <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto pr-1">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Today's sessions
                  </p>
                  {todaySessions.map((s, idx) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-2 text-xs rounded-lg px-3 py-2 bg-muted/40"
                    >
                      {s.completed ? (
                        <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />
                      ) : (
                        <div className="size-3 rounded-full border border-muted-foreground/40 shrink-0" />
                      )}
                      <span className="truncate text-foreground/80 flex-1">
                        Session {todaySessions.length - idx}
                      </span>
                      <span className="text-muted-foreground/60 shrink-0">
                        {new Date(s.startTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Distraction capture */}
          <div className="glass rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListChecks className="size-4 text-amber-400" />
                <h2 className="font-semibold text-sm">Parking Lot</h2>
              </div>
              {pendingDistractions.length > 0 && (
                <Badge
                  variant="secondary"
                  className="text-xs bg-amber-400/10 text-amber-400 border-amber-400/20"
                >
                  {pendingDistractions.length}
                </Badge>
              )}
            </div>

            {/* Quick add */}
            <div className="flex gap-2">
              <Input
                id="distraction-input"
                ref={distractionInputRef}
                placeholder="Dump that thought here..."
                value={distractionInput}
                onChange={(e) => setDistractionInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddDistraction()}
                className="bg-input/50 border-border/50 focus-visible:ring-amber-400/50"
              />
              <Button
                id="btn-add-distraction"
                size="icon"
                variant="outline"
                onClick={handleAddDistraction}
                disabled={!distractionInput.trim()}
                className="shrink-0 border-border/50 hover:bg-amber-400/10 hover:border-amber-400/30 hover:text-amber-400 transition-colors"
              >
                <Plus className="size-4" />
              </Button>
            </div>

            {/* List (show latest 5 on home) */}
            <div className="flex flex-col gap-1.5 max-h-44 overflow-y-auto pr-1">
              {state.distractions.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Nothing here yet — stay focused! 🎯
                </p>
              )}
              {state.distractions.slice(0, 5).map((d) => (
                <div
                  key={d.id}
                  className={cn(
                    "flex items-center gap-2 text-xs rounded-lg px-3 py-2 transition-all duration-200",
                    d.resolved ? "bg-muted/20 opacity-50" : "bg-muted/40"
                  )}
                >
                  <Checkbox
                    id={`distraction-${d.id}`}
                    checked={d.resolved}
                    onCheckedChange={() =>
                      setState((prev) => toggleDistraction(prev, d.id))
                    }
                    className="size-3.5 border-border/60 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                  />
                  <span
                    className={cn(
                      "flex-1 truncate",
                      d.resolved && "line-through text-muted-foreground"
                    )}
                  >
                    {d.text}
                  </span>
                  <button
                    onClick={() => setState((prev) => deleteDistraction(prev, d.id))}
                    className="text-muted-foreground/40 hover:text-destructive transition-colors shrink-0"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              ))}
              {state.distractions.length > 5 && (
                <p className="text-xs text-muted-foreground text-center py-1">
                  +{state.distractions.length - 5} more in Parking Lot
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}


