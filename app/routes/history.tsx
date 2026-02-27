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
    { title: '~ my pomodoro sessions' },
    {
      name: 'description',
      content: "My Pomodoro session history — see what I've accomplished.",
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
            <h1 className="text-xl font-semibold tracking-tight">Session History Graph</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              My completed Pomodoro sessions over time.
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
                  <Eraser className="size-3" strokeWidth={1.75} />
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
                <Eraser className="size-3.5" strokeWidth={1.75} />
                Clear all
              </Button>
            ))}
        </div>

        {/* Contribution graph — original emerald style preserved */}
        {contributionData.length > 0 && (
          <div className="contribution-graph-panel glass rounded-2xl border border-border/40 p-5">
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
              <ContributionGraphFooter className="mt-3">
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
                    <h2 className="text-foreground/75 text-xs font-semibold tracking-wide uppercase">
                      {formatDateHeading(dateStr)}
                    </h2>
                    <Badge variant="secondary" className="border-border/50 bg-foreground/5 text-muted-foreground text-xs">
                      {dayCompleted}/{daySessions.length} done
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {daySessions.map((session, idx) => (
                      <SessionCard
                        key={session.id}
                        session={session}
                        index={daySessions.length - idx}
                      />
                    ))}
                  </div>
                  <div className="geist-separator mt-6" />
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
        'border-border/50 hover:border-border hover:bg-foreground/2 flex items-center gap-3 rounded-lg border px-4 py-3 transition-all duration-150',
        !session.completed && 'opacity-55',
      )}
    >
      {session.completed ? (
        <CheckCircle2 className="size-3.5 shrink-0 text-teal-500" strokeWidth={1.75} />
      ) : (
        <XCircle className="text-destructive/50 size-3.5 shrink-0" strokeWidth={1.75} />
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        <div className="mt-0.5 flex items-center gap-1.5">
          <Clock className="text-muted-foreground/60 size-3" strokeWidth={1.5} />
          <span className="text-muted-foreground font-mono text-[11px]">
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
            ? 'border-teal-500/20 bg-teal-500/8 text-teal-600 dark:text-teal-400'
            : 'bg-foreground/5 text-muted-foreground border-border/50',
        )}
      >
        {session.completed ? 'Done' : 'Abandoned'}
      </Badge>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="border-border/50 flex flex-col items-center gap-3 rounded-xl border p-12 text-center">
      <div className="bg-foreground/5 border-border/60 flex size-10 items-center justify-center rounded-lg border">
        <Clock className="text-foreground/60 size-5" strokeWidth={1.5} />
      </div>
      <h3 className="text-sm font-semibold">No sessions yet</h3>
      <p className="text-muted-foreground max-w-xs text-sm">
        Start your first Pomodoro session on the timer page. Your history will appear here.
      </p>
    </div>
  );
}
