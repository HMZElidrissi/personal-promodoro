import { useState } from "react";
import { Layout } from "@/components/app-layout";
import { loadState } from "@/lib/storage";
import type { Session } from "@/lib/types";
import { CheckCircle2, XCircle, Clock, Flame, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export function meta() {
  return [
    { title: "History — Focus Flow" },
    { name: "description", content: "Your Pomodoro session history — see what you've accomplished." },
  ];
}

function formatDuration(startTime: string, endTime: string | null): string {
  if (!endTime) return "ongoing";
  const ms = new Date(endTime).getTime() - new Date(startTime).getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "<1 min";
  return `${minutes} min`;
}

function formatDateHeading(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.getTime() === today.getTime()) return "Today";
  if (date.getTime() === yesterday.getTime()) return "Yesterday";
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
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
  const [state] = useState(() => loadState());

  const sessions = state.sessions.filter((s) => s.mode === "focus");
  const grouped = groupByDate(sessions);
  const sortedDates = Array.from(grouped.keys()).sort((a, b) => b.localeCompare(a));

  const totalCompleted = sessions.filter((s) => s.completed).length;
  const today = new Date().toISOString().slice(0, 10);
  const todayCompleted = (grouped.get(today) ?? []).filter((s) => s.completed).length;
  const streak = computeStreak(grouped);

  return (
    <Layout>
      <div className="flex flex-col gap-6 animate-slide-up">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Session History</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Your completed Pomodoro sessions over time.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            icon={<Flame className="size-4 text-primary" />}
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
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold text-sm text-foreground/80">
                      {formatDateHeading(dateStr)}
                    </h2>
                    <Badge
                      variant="secondary"
                      className="text-xs bg-muted/60"
                    >
                      {dayCompleted}/{daySessions.length} completed
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-2">
                    {daySessions.map((session) => (
                      <SessionCard key={session.id} session={session} />
                    ))}
                  </div>
                  <Separator className="mt-6 bg-border/30" />
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
  accent: "primary" | "emerald" | "blue";
}) {
  const bg = {
    primary: "border-primary/20 bg-primary/5",
    emerald: "border-emerald-500/20 bg-emerald-500/5",
    blue: "border-blue-400/20 bg-blue-400/5",
  }[accent];

  return (
    <div
      className={cn(
        "glass rounded-2xl p-4 flex flex-col items-center gap-2 border",
        bg
      )}
    >
      {icon}
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function SessionCard({ session }: { session: Session }) {
  return (
    <div
      className={cn(
        "glass rounded-xl px-4 py-3 flex items-center gap-3 transition-all duration-200 hover:bg-muted/20",
        !session.completed && "opacity-60"
      )}
    >
      {session.completed ? (
        <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
      ) : (
        <XCircle className="size-4 text-destructive/60 shrink-0" />
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{session.focusTopic}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Clock className="size-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {new Date(session.startTime).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
            {session.endTime &&
              ` · ${formatDuration(session.startTime, session.endTime)}`}
          </span>
        </div>
      </div>

      <Badge
        variant="secondary"
        className={cn(
          "text-xs shrink-0",
          session.completed
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            : "bg-destructive/10 text-destructive border-destructive/20"
        )}
      >
        {session.completed ? "Done" : "Abandoned"}
      </Badge>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="glass rounded-2xl p-12 flex flex-col items-center gap-3 text-center">
      <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Clock className="size-6 text-primary" />
      </div>
      <h3 className="font-semibold">No sessions yet</h3>
      <p className="text-sm text-muted-foreground max-w-xs">
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
