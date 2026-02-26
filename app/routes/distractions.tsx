import { useState } from 'react';
import { Layout } from '@/components/app-layout';
import { useTimerContext } from '@/lib/timer-context';
import {
  toggleDistraction,
  deleteDistraction,
  clearResolvedDistractions,
  addDistraction,
} from '@/lib/storage';
import type { Distraction } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, X, ListChecksIcon, CheckCircle2, Circle, Eraser } from 'lucide-react';
import { cn } from '@/lib/utils';

export function meta() {
  return [
    { title: 'Parking Lot — Personal Pomodoro' },
    {
      name: 'description',
      content: 'Manage distraction thoughts captured during focus sessions.',
    },
  ];
}

type Filter = 'all' | 'pending' | 'resolved';

export default function DistractionsPage() {
  const { state, setState } = useTimerContext();
  const [newText, setNewText] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [confirmClear, setConfirmClear] = useState(false);

  const persist = (updater: (prev: typeof state) => typeof state) => {
    setState(updater);
  };

  const handleAdd = () => {
    const text = newText.trim();
    if (!text) return;
    const d: Distraction = {
      id: crypto.randomUUID(),
      text,
      createdAt: new Date().toISOString(),
      resolved: false,
    };
    persist((prev) => addDistraction(prev, d));
    setNewText('');
  };

  const displayed = state.distractions.filter((d) => {
    if (filter === 'pending') return !d.resolved;
    if (filter === 'resolved') return d.resolved;
    return true;
  });

  const pendingCount = state.distractions.filter((d) => !d.resolved).length;
  const resolvedCount = state.distractions.filter((d) => d.resolved).length;

  const filterButtons: { id: Filter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: state.distractions.length },
    { id: 'pending', label: 'Pending', count: pendingCount },
    { id: 'resolved', label: 'Resolved', count: resolvedCount },
  ];

  return (
    <Layout>
      <div className="animate-slide-up flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Parking Lot</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Thoughts that popped up during focus — handle them later.
            </p>
          </div>
          {state.distractions.length > 0 && (
            <div className="flex items-center gap-2">
              {resolvedCount > 0 && !confirmClear && (
                <Button
                  id="btn-clear-resolved"
                  variant="ghost"
                  size="sm"
                  onClick={() => persist((prev) => clearResolvedDistractions(prev))}
                  className="text-muted-foreground hover:text-destructive gap-1.5 text-xs"
                >
                  <Eraser className="size-3.5" />
                  Clear resolved
                </Button>
              )}
              {confirmClear ? (
                <div className="animate-fade-in flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">Clear everything?</span>
                  <Button
                    id="btn-confirm-clear-all"
                    size="sm"
                    variant="destructive"
                    className="h-7 gap-1.5 text-xs"
                    onClick={() => {
                      persist((prev) => ({ ...prev, distractions: [] }));
                      setConfirmClear(false);
                    }}
                  >
                    <Eraser className="size-3" />
                    Yes, clear
                  </Button>
                  <Button
                    id="btn-cancel-clear-all"
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
                  id="btn-clear-all-distractions"
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground hover:text-destructive gap-1.5 text-xs"
                  onClick={() => setConfirmClear(true)}
                >
                  <Eraser className="size-3.5" />
                  Clear all
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <MiniStat
            icon={<ListChecksIcon className="size-4 text-amber-400" />}
            value={state.distractions.length}
            label="Total"
            accent="amber"
          />
          <MiniStat
            icon={<Circle className="text-primary size-4" />}
            value={pendingCount}
            label="Pending"
            accent="primary"
          />
          <MiniStat
            icon={<CheckCircle2 className="size-4 text-emerald-400" />}
            value={resolvedCount}
            label="Resolved"
            accent="emerald"
          />
        </div>

        {/* Add new */}
        <div className="glass flex gap-2 rounded-2xl p-4">
          <Input
            id="distraction-full-input"
            placeholder="Add a distraction or task to deal with later..."
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="bg-input/50 border-border/50 focus-visible:ring-amber-400/50"
          />
          <Button
            id="btn-add-full"
            onClick={handleAdd}
            disabled={!newText.trim()}
            className="shrink-0 gap-1.5 bg-amber-400/90 font-semibold text-black hover:bg-amber-400"
          >
            <Plus className="size-4" />
            Add
          </Button>
        </div>

        {/* Filter tabs */}
        <div className="glass flex w-fit items-center gap-1 rounded-xl p-1">
          {filterButtons.map(({ id, label, count }) => (
            <button
              key={id}
              id={`filter-${id}`}
              onClick={() => setFilter(id)}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200',
                filter === id
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] tabular-nums',
                  filter === id ? 'bg-primary/20' : 'bg-muted',
                )}
              >
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex flex-col gap-2">
          {displayed.length === 0 ? (
            <div className="glass flex flex-col items-center gap-3 rounded-2xl p-10 text-center">
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-400/10">
                <CheckCircle2 className="size-5 text-amber-400" />
              </div>
              <p className="text-muted-foreground text-sm">
                {filter === 'resolved'
                  ? 'Nothing resolved yet.'
                  : filter === 'pending'
                    ? 'All clear! No pending items.'
                    : 'No distractions captured. Stay focused! 🎯'}
              </p>
            </div>
          ) : (
            displayed.map((d) => (
              <DistractionItem
                key={d.id}
                d={d}
                onToggle={() => persist((prev) => toggleDistraction(prev, d.id))}
                onDelete={() => persist((prev) => deleteDistraction(prev, d.id))}
              />
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}

function DistractionItem({
  d,
  onToggle,
  onDelete,
}: {
  d: Distraction;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={cn(
        'glass group hover:bg-muted/10 animate-slide-up flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200',
        d.resolved && 'opacity-60',
      )}
    >
      <Checkbox
        id={`distraction-full-${d.id}`}
        checked={d.resolved}
        onCheckedChange={onToggle}
        className="border-border/60 size-4 data-[state=checked]:border-emerald-500 data-[state=checked]:bg-emerald-500"
      />

      <div className="min-w-0 flex-1">
        <p className={cn('text-sm', d.resolved && 'text-muted-foreground line-through')}>
          {d.text}
        </p>
        <p className="text-muted-foreground/60 mt-0.5 text-xs">
          {new Date(d.createdAt).toLocaleString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>

      {d.resolved && (
        <Badge
          variant="secondary"
          className="shrink-0 border-emerald-500/20 bg-emerald-500/10 text-xs text-emerald-400"
        >
          Done
        </Badge>
      )}

      <button
        onClick={onDelete}
        className="text-muted-foreground/30 hover:text-destructive shrink-0 opacity-0 transition-colors group-hover:opacity-100"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

function MiniStat({
  icon,
  value,
  label,
  accent,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  accent: 'amber' | 'primary' | 'emerald';
}) {
  const bg = {
    amber: 'border-amber-400/20 bg-amber-400/5',
    primary: 'border-primary/20 bg-primary/5',
    emerald: 'border-emerald-500/20 bg-emerald-500/5',
  }[accent];

  return (
    <div className={cn('glass flex flex-col items-center gap-1.5 rounded-2xl border p-4', bg)}>
      {icon}
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-muted-foreground text-xs">{label}</div>
    </div>
  );
}
