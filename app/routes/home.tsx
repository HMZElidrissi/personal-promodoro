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
  Volume2,
  VolumeX,
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
    startBtnClass: string;
  }
> = {
  focus: {
    trackClass: 'text-foreground/8',
    rangeClass: 'text-foreground',
    glowClass: 'glow-primary',
    bgAccent: 'bg-foreground/6 border-foreground/12',
    icon: <Zap className="size-3.5" strokeWidth={1.75} />,
    label: 'Focus',
    startBtnClass: 'bg-foreground text-background hover:bg-foreground/90 shadow-sm',
  },
  'short-break': {
    trackClass: 'text-teal-500/10',
    rangeClass: 'text-teal-500',
    glowClass: 'glow-break',
    bgAccent: 'bg-teal-500/6 border-teal-500/15',
    icon: <Coffee className="size-3.5" strokeWidth={1.75} />,
    label: 'Short Break',
    startBtnClass: 'bg-teal-600 text-white hover:bg-teal-600/90 shadow-sm dark:bg-teal-500 dark:hover:bg-teal-500/90',
  },
  'long-break': {
    trackClass: 'text-indigo-400/10',
    rangeClass: 'text-indigo-400',
    glowClass: 'glow-long-break',
    bgAccent: 'bg-indigo-400/6 border-indigo-400/15',
    icon: <Moon className="size-3.5" strokeWidth={1.75} />,
    label: 'Long Break',
    startBtnClass: 'bg-indigo-500 text-white hover:bg-indigo-500/90 shadow-sm',
  },
};

export function meta() {
  return [
    { title: '~ your personal promodoro' },
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
    updateSettings,
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
        <div className="border-border/60 bg-card flex w-fit items-center self-center rounded-lg border p-1">
          {(['focus', 'short-break', 'long-break'] as TimerMode[]).map((m) => {
            const cfg = MODE_CONFIG[m];
            const isActiveRunning = m === mode && isRunning;
            return (
              <button
                key={m}
                id={`mode-${m}`}
                onClick={() => setDisplayMode(m)}
                className={cn(
                  'relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200',
                  displayMode === m
                    ? `${cfg.bgAccent} text-foreground border`
                    : 'text-muted-foreground hover:text-foreground border border-transparent hover:bg-foreground/4',
                )}
              >
                {cfg.icon}
                {cfg.label}
                {/* Pulsing dot to indicate this mode is actively running */}
                {isActiveRunning && displayMode !== m && (
                  <span className="bg-foreground absolute -top-0.5 -right-0.5 size-1.5 animate-pulse rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Main timer card ── */}
        <div
          className={cn(
            'glass geist-panel flex flex-col items-center gap-8 rounded-2xl border p-8 transition-all duration-400',
            displayConfig.glowClass,
          )}
        >
          {/* Round indicator */}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Round</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className={cn(
                    'h-1 w-5 rounded-full transition-all duration-300',
                    n <= pomodoroRound && mode === 'focus' && isRunning
                      ? 'bg-foreground'
                      : n < pomodoroRound
                        ? 'bg-foreground/50'
                        : 'bg-foreground/12',
                  )}
                />
              ))}
            </div>
            <span className="text-muted-foreground text-xs">{completedToday} done today</span>
          </div>

          {/* Running-in-background notice */}
          {!isViewingRunningMode && isRunning && (
            <div className="text-muted-foreground bg-muted/40 border-border/50 animate-fade-in flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium">
              <span className="bg-foreground/70 size-1.5 animate-pulse rounded-full" />
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
              size={232}
              thickness={6}
              className="select-none"
            >
              <CircularProgressIndicator>
                <CircularProgressTrack className={displayConfig.trackClass} />
                <CircularProgressRange
                  className={cn(displayConfig.rangeClass, 'transition-all duration-1000')}
                />
              </CircularProgressIndicator>

              {/* Center content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
                <div className="timer-digits text-5xl leading-none">
                  {formatTime(displaySeconds)}
                </div>
                <div className="text-muted-foreground/70 flex items-center gap-1 text-[11px] font-medium tracking-wider uppercase">
                  <Clock className="size-3" strokeWidth={1.5} />
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
              className="border-border/50 text-muted-foreground hover:border-border hover:text-foreground size-9 rounded-lg border transition-all duration-150"
            >
              <RotateCcw className="size-3.5" strokeWidth={1.75} />
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
                'rounded-lg px-9 text-sm font-semibold transition-all duration-200',
                displayConfig.startBtnClass,
              )}
            >
              {isViewingRunningMode && isRunning ? (
                <>
                  <Pause className="mr-2 size-4" strokeWidth={1.75} /> Pause
                </>
              ) : isViewingRunningMode && secondsLeft < TIMER_DURATIONS[mode] ? (
                <>
                  <Play className="mr-2 size-4" strokeWidth={1.75} /> Resume
                </>
              ) : (
                <>
                  <Play className="mr-2 size-4" strokeWidth={1.75} /> Start
                </>
              )}
            </Button>
            <Button
              id="btn-toggle-sound"
              variant="ghost"
              size="icon"
              onClick={() =>
                updateSettings({
                  soundEnabled: !state.settings.soundEnabled,
                })
              }
              title={state.settings.soundEnabled ? 'Mute sounds' : 'Unmute sounds'}
              className="border-border/50 text-muted-foreground hover:border-border hover:text-foreground size-9 rounded-lg border transition-all duration-150"
            >
              {state.settings.soundEnabled ? (
                <Volume2 className="size-3.5" strokeWidth={1.75} />
              ) : (
                <VolumeX className="size-3.5" strokeWidth={1.75} />
              )}
            </Button>
          </div>

          {/* Completion message */}
          {justCompleted && (
            <div className="animate-slide-up text-muted-foreground bg-foreground/5 border-border/50 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium">
              <CheckCircle2 className="size-3.5 text-teal-500" strokeWidth={1.75} />
              {mode === 'focus' ? 'Session complete — enjoy your break.' : "Break over — back to focus."}
            </div>
          )}
        </div>

        {/* ── Focus topic + Today's history ── */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Focus topic → Todo list */}
          <div className="glass border-border/60 flex flex-col gap-4 rounded-xl border p-5">
            <div className="flex items-center gap-2">
              <Zap className="text-foreground/70 size-3.5" strokeWidth={1.75} />
              <h2 className="text-sm font-semibold tracking-tight">Focus tasks</h2>
              {state.todos.filter((t) => !t.completed).length > 0 && (
                <Badge
                  variant="secondary"
                  className="border-border/60 bg-foreground/6 text-muted-foreground ml-auto text-xs"
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
                className="border-border/60 bg-transparent text-sm focus-visible:ring-foreground/20"
              />
              <Button
                id="btn-add-todo"
                size="icon"
                variant="outline"
                onClick={handleAddTodo}
                disabled={!todoInput.trim()}
                className="border-border/60 hover:bg-foreground/6 hover:border-border shrink-0 transition-colors"
              >
                <Plus className="size-3.5" strokeWidth={1.75} />
              </Button>
            </div>

            {/* Todo list */}
            <div className="flex max-h-48 flex-col gap-1 overflow-y-auto pr-1">
              {state.todos.length === 0 && (
                <p className="text-muted-foreground py-4 text-center text-xs">
                  Add a task to get started
                </p>
              )}
              {state.todos.map((t, idx) => (
                <div
                  key={t.id}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-2.5 py-2 text-xs transition-all duration-200',
                    t.completed
                      ? 'todo-completed opacity-50'
                      : idx === 0
                        ? 'bg-foreground/5 border-border/60 border'
                        : 'hover:bg-foreground/4',
                  )}
                >
                  <Checkbox
                    id={`todo-${t.id}`}
                    checked={t.completed}
                    onCheckedChange={() => setState((prev) => toggleTodo(prev, t.id))}
                    className="border-border/80 size-3.5 transition-all duration-200 data-[state=checked]:border-foreground data-[state=checked]:bg-foreground"
                  />
                  <span
                    className={cn(
                      'flex-1 truncate transition-colors',
                      t.completed ? 'todo-strike text-muted-foreground/60' : 'text-foreground/85',
                    )}
                  >
                    {t.text}
                  </span>
                  <button
                    onClick={() => setState((prev) => deleteTodo(prev, t.id))}
                    className="text-muted-foreground/30 hover:text-foreground/60 shrink-0 transition-colors"
                  >
                    <X className="size-3.5" strokeWidth={1.5} />
                  </button>
                </div>
              ))}
            </div>

            {/* Today's completed sessions */}
            {completedToday > 0 && (
              <>
                <div className="geist-separator" />
                <div className="flex max-h-32 flex-col gap-1 overflow-y-auto pr-1">
                  <p className="text-muted-foreground mb-1 text-[11px] font-medium tracking-wide uppercase">Today</p>
                  {todaySessions
                    .filter((s) => s.completed)
                    .map((s, idx, arr) => (
                      <div
                        key={s.id}
                        className="animate-fade-in border-border/40 flex items-center gap-2 rounded-md border px-2.5 py-2 text-xs"
                      >
                        <CheckCircle2 className="size-3 shrink-0 text-teal-500" strokeWidth={1.75} />
                        <span className="text-foreground/75 flex-1 truncate">
                          Session {arr.length - idx}
                        </span>
                        <span className="text-muted-foreground/50 font-mono shrink-0 text-[10px]">
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
          <div className="glass border-border/60 flex flex-col gap-4 rounded-xl border p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListChecks className="text-foreground/70 size-3.5" strokeWidth={1.75} />
                <h2 className="text-sm font-semibold tracking-tight">Parking Lot</h2>
              </div>
              {pendingDistractions.length > 0 && (
                <Badge
                  variant="secondary"
                  className="border-border/60 bg-foreground/6 text-muted-foreground text-xs"
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
                className="border-border/60 bg-transparent text-sm focus-visible:ring-foreground/20"
              />
              <Button
                id="btn-add-distraction"
                size="icon"
                variant="outline"
                onClick={handleAddDistraction}
                disabled={!distractionInput.trim()}
                className="border-border/60 hover:bg-foreground/6 hover:border-border shrink-0 transition-colors"
              >
                <Plus className="size-3.5" strokeWidth={1.75} />
              </Button>
            </div>

            {/* List (show latest 5 on home) */}
            <div className="flex max-h-44 flex-col gap-1 overflow-y-auto pr-1">
              {state.distractions.length === 0 && (
                <p className="text-muted-foreground py-4 text-center text-xs">
                  Nothing here yet — stay focused!
                </p>
              )}
              {state.distractions.slice(0, 5).map((d) => (
                <div
                  key={d.id}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-2.5 py-2 text-xs transition-all duration-200',
                    d.resolved ? 'opacity-45' : 'hover:bg-foreground/4',
                  )}
                >
                  <Checkbox
                    id={`distraction-${d.id}`}
                    checked={d.resolved}
                    onCheckedChange={() => setState((prev) => toggleDistraction(prev, d.id))}
                    className="border-border/80 size-3.5 data-[state=checked]:border-foreground data-[state=checked]:bg-foreground"
                  />
                  <span
                    className={cn(
                      'flex-1 truncate',
                      d.resolved && 'text-muted-foreground/60 line-through',
                    )}
                  >
                    {d.text}
                  </span>
                  <button
                    onClick={() => setState((prev) => deleteDistraction(prev, d.id))}
                    className="text-muted-foreground/30 hover:text-foreground/60 shrink-0 transition-colors"
                  >
                    <X className="size-3.5" strokeWidth={1.5} />
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
