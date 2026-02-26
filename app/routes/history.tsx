import { useState } from 'react';
import { Layout } from '@/components/app-layout';
import { useTimerContext } from '@/lib/timer-context';
import { clearSessions } from '@/lib/storage';
import type { Session } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Clock, Eraser } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ContributionGraph,
  ContributionGraphBlock,
  ContributionGraphCalendar,
  ContributionGraphFooter,
  ContributionGraphLegend,
  ContributionGraphTotalCount,
  type Activity,
} from '@/components/contribution-graph';

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

/** Build Activity[] for the contribution graph from a per-day grouped map */
function buildActivityData(grouped: Map<string, Session[]>): Activity[] {
  if (grouped.size === 0) return [];

  // Anchor the graph: start from 1 year ago, end today
  const today = new Date();
  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const startKey = oneYearAgo.toISOString().slice(0, 10);
  const endKey = today.toISOString().slice(0, 10);

  // Add anchor entries (empty) so the graph always spans a full year
  const activities: Activity[] = [
    { date: startKey, count: 0, level: 0 },
    { date: endKey, count: 0, level: 0 },
  ];

  for (const [dateStr, daySessions] of grouped.entries()) {
    const count = daySessions.filter((s) => s.completed).length;
    if (count === 0) continue;
    // Map count → level (1-4)
    const level = count >= 6 ? 4 : count >= 4 ? 3 : count >= 2 ? 2 : 1;
    activities.push({ date: dateStr, count, level });
  }

  return activities;
}

export default function HistoryPage() {
  const { state, setState } = useTimerContext();
  const [confirmClear, setConfirmClear] = useState(false);

  // Exclude sessions still in progress (endTime === null) — they show as
  // "Abandoned" even while the timer is actively running on another page.
  const sessions = state.sessions.filter((s) => s.mode === 'focus' && s.endTime !== null);
  const grouped = groupByDate(sessions);
  const sortedDates = Array.from(grouped.keys()).sort((a, b) => b.localeCompare(a));

  const contributionData = buildActivityData(grouped);

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

        {/* Contribution graph */}
        {contributionData.length > 0 && (
          <div className="glass rounded-2xl border border-border/40 p-4">
            <ContributionGraph
              data={contributionData}
              className="w-full"
              blockSize={12}
              blockRadius={3}
              blockMargin={3}
            >
              <ContributionGraphCalendar className="w-full">
                {({ activity, dayIndex, weekIndex }) => (
                  <ContributionGraphBlock
                    key={`${weekIndex}-${dayIndex}`}
                    activity={activity}
                    dayIndex={dayIndex}
                    weekIndex={weekIndex}
                    className={cn(
                      'cursor-default transition-opacity hover:opacity-80',
                      'data-[level="0"]:fill-muted',
                      'data-[level="1"]:fill-emerald-200 dark:data-[level="1"]:fill-emerald-900',
                      'data-[level="2"]:fill-emerald-400 dark:data-[level="2"]:fill-emerald-700',
                      'data-[level="3"]:fill-emerald-500 dark:data-[level="3"]:fill-emerald-500',
                      'data-[level="4"]:fill-emerald-600 dark:data-[level="4"]:fill-emerald-400',
                    )}
                  />
                )}
              </ContributionGraphCalendar>
              <ContributionGraphFooter className="mt-2">
                <ContributionGraphTotalCount className="text-muted-foreground text-xs">
                  {({ totalCount, year }) => (
                    <span className="text-muted-foreground text-xs">
                      {totalCount} sessions completed in {year}
                    </span>
                  )}
                </ContributionGraphTotalCount>
                <ContributionGraphLegend className="ml-auto">
                  {({ level }) => (
                    <svg height={12} width={12}>
                      <rect
                        className={cn(
                          'stroke-[1px] stroke-border',
                          level === 0 && 'fill-muted',
                          level === 1 &&
                            'fill-emerald-200 dark:fill-emerald-900',
                          level === 2 &&
                            'fill-emerald-400 dark:fill-emerald-700',
                          level === 3 && 'fill-emerald-500',
                          level === 4 &&
                            'fill-emerald-600 dark:fill-emerald-400',
                        )}
                        height={12}
                        rx={2}
                        ry={2}
                        width={12}
                      />
                    </svg>
                  )}
                </ContributionGraphLegend>
              </ContributionGraphFooter>
            </ContributionGraph>
          </div>
        )}

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
                    {daySessions.map((session, idx) => (
                      <SessionCard
                        key={session.id}
                        session={session}
                        index={daySessions.length - idx}
                      />
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

function SessionCard({ session, index }: { session: Session; index: number }) {
  // Use todo topic when available, otherwise fall back to a numbered label
  const title =
    session.focusTopic && session.focusTopic !== 'Untitled session'
      ? session.focusTopic
      : `Session ${index}`;

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
        <p className="truncate text-sm font-medium">{title}</p>
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
