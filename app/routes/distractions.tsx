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
    { title: 'Parking Lot ~ your personal promodoro' },
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
            <h1 className="text-xl font-semibold tracking-tight">Parking Lot</h1>
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
            icon={<ListChecksIcon className="text-foreground/60 size-4" strokeWidth={1.75} />}
            value={state.distractions.length}
            label="Total"
          />
          <MiniStat
            icon={<Circle className="text-foreground/60 size-4" strokeWidth={1.75} />}
            value={pendingCount}
            label="Pending"
          />
          <MiniStat
            icon={<CheckCircle2 className="size-4 text-teal-500" strokeWidth={1.75} />}
            value={resolvedCount}
            label="Resolved"
          />
        </div>

        {/* Add new */}
        <div className="glass border-border/60 flex gap-2 rounded-xl border p-4">
          <Input
            id="distraction-full-input"
            placeholder="Add a distraction or task to deal with later..."
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="border-border/60 bg-transparent text-sm focus-visible:ring-foreground/20"
          />
          <Button
            id="btn-add-full"
            onClick={handleAdd}
            disabled={!newText.trim()}
            className="bg-foreground text-background hover:bg-foreground/90 shrink-0 gap-1.5 text-sm font-medium shadow-sm"
          >
            <Plus className="size-3.5" strokeWidth={1.75} />
            Add
          </Button>
        </div>

        {/* Filter tabs */}
        <div className="border-border/60 bg-card flex w-fit items-center gap-0.5 rounded-lg border p-1">
          {filterButtons.map(({ id, label, count }) => (
            <button
              key={id}
              id={`filter-${id}`}
              onClick={() => setFilter(id)}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150',
                filter === id
                  ? 'bg-foreground/8 text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-foreground/4',
              )}
            >
              {label}
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] tabular-nums font-mono',
                  filter === id ? 'bg-foreground/10' : 'bg-foreground/5',
                )}
              >
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex flex-col gap-1.5">
          {displayed.length === 0 ? (
            <div className="border-border/50 flex flex-col items-center gap-3 rounded-xl border p-10 text-center">
              <div className="bg-foreground/5 border-border/60 flex size-9 items-center justify-center rounded-lg border">
                <CheckCircle2 className="text-foreground/50 size-4" strokeWidth={1.5} />
              </div>
              <p className="text-muted-foreground text-sm">
                {filter === 'resolved'
                  ? 'Nothing resolved yet.'
                  : filter === 'pending'
                    ? 'All clear! No pending items.'
                    : 'No distractions captured. Stay focused!'}
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
        'border-border/50 group hover:border-border hover:bg-foreground/2 animate-slide-up flex items-center gap-3 rounded-lg border px-4 py-3 transition-all duration-150',
        d.resolved && 'opacity-50',
      )}
    >
      <Checkbox
        id={`distraction-full-${d.id}`}
        checked={d.resolved}
        onCheckedChange={onToggle}
        className="border-border/80 size-4 data-[state=checked]:border-foreground data-[state=checked]:bg-foreground"
      />

      <div className="min-w-0 flex-1">
        <p className={cn('text-sm', d.resolved && 'text-muted-foreground/60 line-through')}>
          {d.text}
        </p>
        <p className="text-muted-foreground/50 font-mono mt-0.5 text-[11px]">
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
          className="border-teal-500/20 bg-teal-500/8 shrink-0 text-xs text-teal-600 dark:text-teal-400"
        >
          Done
        </Badge>
      )}

      <button
        onClick={onDelete}
        className="text-muted-foreground/30 hover:text-foreground/60 shrink-0 opacity-0 transition-colors group-hover:opacity-100"
      >
        <X className="size-3.5" strokeWidth={1.5} />
      </button>
    </div>
  );
}

function MiniStat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="border-border/50 flex flex-col items-center gap-1.5 rounded-xl border p-4">
      {icon}
      <div className="text-2xl font-semibold tabular-nums tracking-tight" style={{ fontFamily: 'var(--font-mono)' }}>{value}</div>
      <div className="text-muted-foreground text-xs">{label}</div>
    </div>
  );
}
