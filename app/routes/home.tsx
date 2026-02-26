import { useState, useCallback, useEffect, useRef } from 'react';
import { Layout } from '@/components/app-layout';
import {
  CircularProgress,
  CircularProgressIndicator,
  CircularProgressTrack,
  CircularProgressRange,
} from '@/components/ui/circular-progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Play,
  Pause,
  RotateCcw,
  Plus,
  X,
  Coffee,
  Zap,
  Moon,
  CheckCircle2,
  Clock,
  ListChecks,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TIMER_DURATIONS, MODE_LABELS } from '@/lib/use-timer';
import { useTimerContext } from '@/lib/timer-context';
import {
  addDistraction,
  toggleDistraction,
  deleteDistraction,
  getTodaySessions,
  addTodo,
  toggleTodo,
  deleteTodo,
} from '@/lib/storage';
import type { Distraction, TimerMode, TodoItem } from '@/lib/types';

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
    trackClass: 'text-primary/10',
    rangeClass: 'text-primary',
    glowClass: 'glow-primary',
    bgAccent: 'bg-primary/5 border-primary/20',
    icon: <Zap className="size-4" />,
    label: 'Focus',
  },
  'short-break': {
    trackClass: 'text-emerald-500/10',
    rangeClass: 'text-emerald-500',
    glowClass: 'glow-break',
    bgAccent: 'bg-emerald-500/5 border-emerald-500/20',
    icon: <Coffee className="size-4" />,
    label: 'Short Break',
  },
  'long-break': {
    trackClass: 'text-blue-400/10',
    rangeClass: 'text-blue-400',
    glowClass: 'glow-long-break',
    bgAccent: 'bg-blue-400/5 border-blue-400/20',
    icon: <Moon className="size-4" />,
    label: 'Long Break',
  },
};

export function meta() {
  return [
    { title: 'Personal Pomodoro' },
    {
      name: 'description',
      content:
        'Stay focused with the Pomodoro technique. Track your sessions and capture distractions.',
    },
  ];
}

export default function HomePage() {
  const {
    mode,
    secondsLeft,
    isRunning,
    progress,
    formatTime,
    pause,
    state,
    setState,
    justCompleted,
    handleStart,
    handleReset,
    handleSwitchMode,
  } = useTimerContext();

  const [todoInput, setTodoInput] = useState('');
  const [distractionInput, setDistractionInput] = useState('');
  const distractionInputRef = useRef<HTMLInputElement>(null);
  const todoInputRef = useRef<HTMLInputElement>(null);

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
    setTodoInput('');
  }, [todoInput, setState]);

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
    setDistractionInput('');
  }, [distractionInput, setState]);

  // displayMode = the tab the user is viewing (may differ from the running mode)
  const [displayMode, setDisplayMode] = useState<TimerMode>(mode);
  // Keep displayMode in sync when the timer itself changes mode (e.g. on completion)
  useEffect(() => {
    setDisplayMode(mode);
  }, [mode]);

  const displayConfig = MODE_CONFIG[displayMode];
  const isViewingRunningMode = displayMode === mode;

  // What the timer ring / countdown should show:
  // - Viewing the active mode → show live countdown & progress
  // - Viewing a different mode → show its full duration (fresh preview)
  const displaySeconds = isViewingRunningMode
    ? secondsLeft
    : state.settings[
        displayMode === 'focus'
          ? 'focusDuration'
          : displayMode === 'short-break'
            ? 'shortBreakDuration'
            : 'longBreakDuration'
      ] * 60;
  const displayProgress = isViewingRunningMode ? progress : 0;

  const todaySessions = getTodaySessions(state);
  const completedToday = todaySessions.filter((s) => s.completed).length;
  const pendingDistractions = state.distractions.filter((d) => !d.resolved);
  const pomodoroRound = (state.pomodoroCount % 4) + 1;

  return (
    <Layout>
      <div className="animate-slide-up flex flex-col gap-6">
        {/* ── Mode selector ── */}
        <div className="flex items-center justify-center gap-2">
          {(['focus', 'short-break', 'long-break'] as TimerMode[]).map((m) => {
            const cfg = MODE_CONFIG[m];
            const isActiveRunning = m === mode && isRunning;
            return (
              <button
                key={m}
                id={`mode-${m}`}
                onClick={() => setDisplayMode(m)}
                className={cn(
                  'relative flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-300',
                  displayMode === m
                    ? `${cfg.bgAccent} text-foreground border shadow-sm`
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent',
                )}
              >
                {cfg.icon}
                {cfg.label}
                {/* Pulsing dot to indicate this mode is actively running */}
                {isActiveRunning && displayMode !== m && (
                  <span className="bg-primary absolute -top-0.5 -right-0.5 size-2 animate-pulse rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Main timer card ── */}
        <div
          className={cn(
            'glass flex flex-col items-center gap-8 rounded-3xl p-8 transition-all duration-500',
            displayConfig.glowClass,
          )}
        >
          {/* Round indicator */}
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground text-xs font-medium">Round</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className={cn(
                    'size-2 rounded-full transition-all duration-300',
                    n <= pomodoroRound && mode === 'focus' && isRunning
                      ? 'bg-primary'
                      : n < pomodoroRound
                        ? 'bg-primary/80'
                        : 'bg-muted',
                  )}
                />
              ))}
            </div>
            <span className="text-muted-foreground text-xs">{completedToday} completed today</span>
          </div>

          {/* Running-in-background notice */}
          {!isViewingRunningMode && isRunning && (
            <div className="text-muted-foreground bg-muted/30 border-border/40 animate-fade-in flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs">
              <span className="bg-primary size-1.5 animate-pulse rounded-full" />
              {MODE_LABELS[mode]} running — {formatTime(secondsLeft)} left
            </div>
          )}

          {/* Timer ring */}
          <div
            className={cn(
              'relative',
              justCompleted && isViewingRunningMode && 'animate-pulse-ring',
            )}
          >
            <CircularProgress
              value={displayProgress}
              max={100}
              size={240}
              thickness={8}
              className="select-none"
            >
              <CircularProgressIndicator>
                <CircularProgressTrack className={displayConfig.trackClass} />
                <CircularProgressRange
                  className={cn(displayConfig.rangeClass, 'transition-all duration-1000')}
                />
              </CircularProgressIndicator>

              {/* Center content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                <div className="text-5xl leading-none font-bold tracking-tighter tabular-nums">
                  {formatTime(displaySeconds)}
                </div>
                <div className="text-muted-foreground mt-1 flex items-center gap-1 text-xs font-medium">
                  <Clock className="size-3" />
                  {MODE_LABELS[displayMode]}
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
              className="hover:bg-destructive/10 hover:text-destructive size-10 rounded-full"
            >
              <RotateCcw className="size-4" />
            </Button>
            <Button
              id="btn-start-pause"
              onClick={() => {
                if (isViewingRunningMode) {
                  // Controlling the running timer directly
                  isRunning ? pause() : handleStart();
                } else {
                  // Switch to the viewed mode and start it
                  handleSwitchMode(displayMode);
                }
              }}
              size="lg"
              className={cn(
                'rounded-full px-10 text-base font-semibold transition-all duration-300',
                displayMode === 'focus'
                  ? 'bg-primary hover:bg-primary/90 shadow-primary/30 shadow-lg'
                  : displayMode === 'short-break'
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-500/90'
                    : 'bg-blue-400 text-white shadow-lg shadow-blue-400/30 hover:bg-blue-400/90',
              )}
            >
              {isViewingRunningMode && isRunning ? (
                <>
                  <Pause className="mr-2 size-5" /> Pause
                </>
              ) : isViewingRunningMode && secondsLeft < TIMER_DURATIONS[mode] ? (
                <>
                  <Play className="mr-2 size-5" /> Resume
                </>
              ) : (
                <>
                  <Play className="mr-2 size-5" /> Start
                </>
              )}
            </Button>
            <div className="size-10" /> {/* spacer */}
          </div>

          {/* Completion message */}
          {justCompleted && (
            <div className="animate-slide-up flex items-center gap-2 text-sm font-medium text-emerald-400">
              <CheckCircle2 className="size-4" />
              {mode === 'focus' ? 'Great work! Take a break.' : "Break done — let's focus!"}
            </div>
          )}
        </div>

        {/* ── Focus topic + Today's history ── */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Focus topic → Todo list */}
          <div className="glass flex flex-col gap-4 rounded-2xl p-5">
            <div className="flex items-center gap-2">
              <Zap className="text-primary size-4" />
              <h2 className="text-sm font-semibold">What are you focusing on?</h2>
              {state.todos.filter((t) => !t.completed).length > 0 && (
                <Badge
                  variant="secondary"
                  className="bg-primary/10 text-primary border-primary/20 ml-auto text-xs"
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
                onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
                className="bg-input/50 border-border/50 focus-visible:ring-primary/50"
              />
              <Button
                id="btn-add-todo"
                size="icon"
                variant="outline"
                onClick={handleAddTodo}
                disabled={!todoInput.trim()}
                className="border-border/50 hover:bg-primary/10 hover:border-primary/30 hover:text-primary shrink-0 transition-colors"
              >
                <Plus className="size-4" />
              </Button>
            </div>

            {/* Todo list */}
            <div className="flex max-h-48 flex-col gap-1.5 overflow-y-auto pr-1">
              {state.todos.length === 0 && (
                <p className="text-muted-foreground py-4 text-center text-xs">
                  Add a task to get started 📝
                </p>
              )}
              {state.todos.map((t, idx) => (
                <div
                  key={t.id}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-all duration-300',
                    t.completed
                      ? 'bg-muted/20 todo-completed opacity-60'
                      : idx === 0
                        ? 'bg-primary/10 border-primary/20 border'
                        : 'bg-muted/40',
                  )}
                >
                  <Checkbox
                    id={`todo-${t.id}`}
                    checked={t.completed}
                    onCheckedChange={() => setState((prev) => toggleTodo(prev, t.id))}
                    className="border-border/60 size-3.5 transition-all duration-200 data-[state=checked]:border-emerald-500 data-[state=checked]:bg-emerald-500"
                  />
                  <span
                    className={cn(
                      'flex-1 truncate transition-colors duration-250',
                      t.completed ? 'todo-strike text-muted-foreground' : 'text-foreground/90',
                    )}
                  >
                    {t.text}
                  </span>
                  <button
                    onClick={() => setState((prev) => deleteTodo(prev, t.id))}
                    className="text-muted-foreground/40 hover:text-destructive shrink-0 transition-colors"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Today's completed sessions */}
            {completedToday > 0 && (
              <>
                <Separator className="bg-border/40" />
                <div className="flex max-h-32 flex-col gap-1.5 overflow-y-auto pr-1">
                  <p className="text-muted-foreground mb-1 text-xs font-medium">Today's sessions</p>
                  {todaySessions
                    .filter((s) => s.completed)
                    .map((s, idx, arr) => (
                      <div
                        key={s.id}
                        className="animate-fade-in flex items-center gap-2 rounded-lg border border-emerald-500/15 bg-emerald-500/5 px-3 py-2 text-xs"
                      >
                        <CheckCircle2 className="size-3 shrink-0 text-emerald-400" />
                        <span className="text-foreground/80 flex-1 truncate">
                          Session {arr.length - idx}
                        </span>
                        <span className="text-muted-foreground/60 shrink-0">
                          {new Date(s.startTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    ))}
                </div>
              </>
            )}
          </div>

          {/* Distraction capture */}
          <div className="glass flex flex-col gap-4 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListChecks className="size-4 text-amber-400" />
                <h2 className="text-sm font-semibold">Parking Lot</h2>
              </div>
              {pendingDistractions.length > 0 && (
                <Badge
                  variant="secondary"
                  className="border-amber-400/20 bg-amber-400/10 text-xs text-amber-400"
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
                onKeyDown={(e) => e.key === 'Enter' && handleAddDistraction()}
                className="bg-input/50 border-border/50 focus-visible:ring-amber-400/50"
              />
              <Button
                id="btn-add-distraction"
                size="icon"
                variant="outline"
                onClick={handleAddDistraction}
                disabled={!distractionInput.trim()}
                className="border-border/50 shrink-0 transition-colors hover:border-amber-400/30 hover:bg-amber-400/10 hover:text-amber-400"
              >
                <Plus className="size-4" />
              </Button>
            </div>

            {/* List (show latest 5 on home) */}
            <div className="flex max-h-44 flex-col gap-1.5 overflow-y-auto pr-1">
              {state.distractions.length === 0 && (
                <p className="text-muted-foreground py-4 text-center text-xs">
                  Nothing here yet — stay focused! 🎯
                </p>
              )}
              {state.distractions.slice(0, 5).map((d) => (
                <div
                  key={d.id}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-all duration-200',
                    d.resolved ? 'bg-muted/20 opacity-50' : 'bg-muted/40',
                  )}
                >
                  <Checkbox
                    id={`distraction-${d.id}`}
                    checked={d.resolved}
                    onCheckedChange={() => setState((prev) => toggleDistraction(prev, d.id))}
                    className="border-border/60 size-3.5 data-[state=checked]:border-emerald-500 data-[state=checked]:bg-emerald-500"
                  />
                  <span
                    className={cn(
                      'flex-1 truncate',
                      d.resolved && 'text-muted-foreground line-through',
                    )}
                  >
                    {d.text}
                  </span>
                  <button
                    onClick={() => setState((prev) => deleteDistraction(prev, d.id))}
                    className="text-muted-foreground/40 hover:text-destructive shrink-0 transition-colors"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
              {state.distractions.length > 5 && (
                <p className="text-muted-foreground py-1 text-center text-xs">
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
