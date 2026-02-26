import { useState } from 'react';
import { Layout } from '@/components/app-layout';
import { useTimerContext } from '@/lib/timer-context';
import { clearSessions } from '@/lib/storage';
import type { Session } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Clock, Flame, CalendarDays, Eraser } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export function meta() {
  return [
    { title: 'History — Personal Pomodoro' },
    {
      name: 'description',
      content: "Your Pomodoro session history — see what you've accomplished.",
    },
  ];
}

function formatDuration(startTime: string, endTime: string | null): string {
  if (!endTime) return 'ongoing';
  const ms = new Date(endTime).getTime() - new Date(startTime).getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return '<1 min';
  return `${minutes} min`;
}

function formatDateHeading(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.getTime() === today.getTime()) return 'Today';
  if (date.getTime() === yesterday.getTime()) return 'Yesterday';
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function groupByDate(sessions: Session[]): Map<string, Session[]> {
  const map = new Map<string, Session[]>();
  for (const session of sessions) {
    const dateKey = session.startTime.slice(0, 10);
    if (!map.has(dateKey)) map.set(dateKey, []);
    map.get(dateKey)!.push(session);
  }
  return map;
}

export default function HistoryPage() {
  const { state, setState } = useTimerContext();
  const [confirmClear, setConfirmClear] = useState(false);

  const sessions = state.sessions.filter((s) => s.mode === 'focus');
  const grouped = groupByDate(sessions);
  const sortedDates = Array.from(grouped.keys()).sort((a, b) => b.localeCompare(a));

  const totalCompleted = sessions.filter((s) => s.completed).length;
  const today = new Date().toISOString().slice(0, 10);
  const todayCompleted = (grouped.get(today) ?? []).filter((s) => s.completed).length;
  const streak = computeStreak(grouped);

  return (
    <Layout>
      <div className="animate-slide-up flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Session History</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Your completed Pomodoro sessions over time.
            </p>
          </div>
          {sessions.length > 0 &&
            (confirmClear ? (
              <div className="animate-fade-in flex items-center gap-2">
                <span className="text-muted-foreground text-xs">Clear all sessions?</span>
                <Button
                  id="btn-confirm-clear"
                  size="sm"
                  variant="destructive"
                  className="h-7 gap-1.5 text-xs"
                  onClick={() => {
                    setState((prev) => clearSessions(prev));
                    setConfirmClear(false);
                  }}
                >
                  <Eraser className="size-3" />
                  Yes, clear
                </Button>
                <Button
                  id="btn-cancel-clear"
                  size="sm"
                  variant="outline"
                  className="border-border/60 h-7 text-xs"
                  onClick={() => setConfirmClear(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                id="btn-clear-sessions"
                size="sm"
                variant="ghost"
                className="text-muted-foreground hover:text-destructive gap-1.5 text-xs"
                onClick={() => setConfirmClear(true)}
              >
                <Eraser className="size-3.5" />
                Clear all
              </Button>
            ))}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            icon={<Flame className="text-primary size-4" />}
            value={streak}
            label="Day streak"
            accent="primary"
          />
          <StatCard
            icon={<CheckCircle2 className="size-4 text-emerald-400" />}
            value={totalCompleted}
            label="All time"
            accent="emerald"
          />
          <StatCard
            icon={<CalendarDays className="size-4 text-blue-400" />}
            value={todayCompleted}
            label="Today"
            accent="blue"
          />
        </div>

        {/* Sessions list */}
        {sortedDates.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-6">
            {sortedDates.map((dateStr) => {
              const daySessions = grouped.get(dateStr)!;
              const dayCompleted = daySessions.filter((s) => s.completed).length;

              return (
                <section key={dateStr}>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-foreground/80 text-sm font-semibold">
                      {formatDateHeading(dateStr)}
                    </h2>
                    <Badge variant="secondary" className="bg-muted/60 text-xs">
                      {dayCompleted}/{daySessions.length} completed
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-2">
                    {daySessions.map((session) => (
                      <SessionCard key={session.id} session={session} />
                    ))}
                  </div>
                  <Separator className="bg-border/30 mt-6" />
                </section>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}

function StatCard({
  icon,
  value,
  label,
  accent,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  accent: 'primary' | 'emerald' | 'blue';
}) {
  const bg = {
    primary: 'border-primary/20 bg-primary/5',
    emerald: 'border-emerald-500/20 bg-emerald-500/5',
    blue: 'border-blue-400/20 bg-blue-400/5',
  }[accent];

  return (
    <div className={cn('glass flex flex-col items-center gap-2 rounded-2xl border p-4', bg)}>
      {icon}
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-muted-foreground text-xs">{label}</div>
    </div>
  );
}

function SessionCard({ session }: { session: Session }) {
  return (
    <div
      className={cn(
        'glass hover:bg-muted/20 flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200',
        !session.completed && 'opacity-60',
      )}
    >
      {session.completed ? (
        <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
      ) : (
        <XCircle className="text-destructive/60 size-4 shrink-0" />
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{session.focusTopic}</p>
        <div className="mt-0.5 flex items-center gap-1.5">
          <Clock className="text-muted-foreground size-3" />
          <span className="text-muted-foreground text-xs">
            {new Date(session.startTime).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
            {session.endTime && ` · ${formatDuration(session.startTime, session.endTime)}`}
          </span>
        </div>
      </div>

      <Badge
        variant="secondary"
        className={cn(
          'shrink-0 text-xs',
          session.completed
            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
            : 'bg-destructive/10 text-destructive border-destructive/20',
        )}
      >
        {session.completed ? 'Done' : 'Abandoned'}
      </Badge>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="glass flex flex-col items-center gap-3 rounded-2xl p-12 text-center">
      <div className="bg-primary/10 flex size-12 items-center justify-center rounded-2xl">
        <Clock className="text-primary size-6" />
      </div>
      <h3 className="font-semibold">No sessions yet</h3>
      <p className="text-muted-foreground max-w-xs text-sm">
        Start your first Pomodoro session on the timer page. Your history will appear here.
      </p>
    </div>
  );
}

/** Count the current daily streak (consecutive days with at least one completed session) */
function computeStreak(grouped: Map<string, Session[]>): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let streak = 0;
  let current = new Date(today);

  while (true) {
    const dateStr = current.toISOString().slice(0, 10);
    const daySessions = grouped.get(dateStr);
    if (!daySessions || !daySessions.some((s) => s.completed)) break;
    streak++;
    current.setDate(current.getDate() - 1);
  }

  return streak;
}
