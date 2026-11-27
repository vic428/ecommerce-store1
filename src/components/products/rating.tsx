import { Star } from "lucide-react";

/** Five-star rating with partial fill, plus review count. */
export function Rating({ value, count }: { value: number; count?: number }) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  return (
    <div className="flex items-center gap-1.5">
      <span className="relative inline-flex" role="img" aria-label={`Rated ${value.toFixed(1)} out of 5`}>
        <span className="text-border flex">
          {Array.from({ length: 5 }, (_, i) => (
            <Star key={i} aria-hidden className="h-3.5 w-3.5 fill-current" strokeWidth={0} />
          ))}
        </span>
        <span className="text-primary absolute inset-0 flex overflow-hidden" style={{ width: `${pct}%` }}>
          {Array.from({ length: 5 }, (_, i) => (
            <Star key={i} aria-hidden className="h-3.5 w-3.5 shrink-0 fill-current" strokeWidth={0} />
          ))}
        </span>
      </span>
      {count !== undefined && <span className="text-muted text-xs">({count})</span>}
    </div>
  );
}
