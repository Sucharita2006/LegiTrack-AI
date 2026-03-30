import { cn } from "@/lib/utils";
import { Info } from "lucide-react";

interface RelevanceBarProps {
  score: number | null;
  breakdown?: {
    keyword_points: number;
    committee_points: number;
    sponsor_points: number;
    total_score: number;
    details: string[];
  } | null;
  max?: number;
  showLabel?: boolean;
  size?: "sm" | "md";
  className?: string;
  label?: string;
}

export function RelevanceBar({ score, breakdown, max = 100, showLabel = true, size = "md", className, label = "Relevance Score" }: RelevanceBarProps) {
  const pct = Math.min(((score || 0) / max) * 100, 100);
  const h = size === "sm" ? "h-1.5" : "h-2.5";

  // Check for stance penalty details
  const penaltyDetail = breakdown?.details?.find(d => d.includes("Penalty"));

  // Calculate widths for segments proportionally to fit perfectly inside the final shrunk 'pct'
  const rawTotal = breakdown ? breakdown.keyword_points + breakdown.committee_points + breakdown.sponsor_points : 0;
  const kwPct = breakdown && rawTotal > 0 ? (breakdown.keyword_points / rawTotal) * pct : 0;
  const comPct = breakdown && rawTotal > 0 ? (breakdown.committee_points / rawTotal) * pct : 0;
  const spPct = breakdown && rawTotal > 0 ? (breakdown.sponsor_points / rawTotal) * pct : 0;

  return (
    <div className={cn("w-full group relative", className)}>
      <div className={cn("w-full rounded-full bg-border overflow-hidden flex", h)}>
        {breakdown ? (
          <>
            <div className="h-full bg-accent transition-all duration-700 ease-out" style={{ width: `${kwPct}%` }} />
            <div className="h-full bg-accent-2 transition-all duration-700 ease-out" style={{ width: `${comPct}%` }} />
            <div className="h-full bg-pink-500 transition-all duration-700 ease-out" style={{ width: `${spPct}%` }} />
          </>
        ) : (
          <div
            className={cn("rounded-full transition-all duration-700 ease-out", h)}
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, var(--color-accent), var(--color-accent-2))`,
            }}
          />
        )}
      </div>
      
      {showLabel && (
        <div className="mt-1 flex justify-between items-center text-[11px] text-text-muted">
          <span className="flex items-center gap-1">
            {label}
            {breakdown && <Info className="h-3 w-3 text-text-muted/50 cursor-help" />}
          </span>
          <span className="font-medium text-text">{(score || 0).toFixed(0)}/{max}</span>
        </div>
      )}

      {/* Hover Tooltip Breakdown */}
      {breakdown && breakdown.details && breakdown.details.length > 0 && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 rounded-xl glass border border-border p-3 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50 shadow-xl scale-95 group-hover:scale-100 origin-bottom">
          <div className="text-xs font-semibold text-text mb-2 pb-2 border-b border-border/50 flex justify-between">
            Relevance Logic Breakdown
            <span className={cn(penaltyDetail ? "text-red-400" : "text-accent")}>{breakdown.total_score} Pts</span>
          </div>
          <ul className="space-y-1.5 flex flex-col">
            <li className="flex gap-2 text-[10px] text-text-muted items-start">
              <span className="font-mono text-accent w-6 shrink-0 text-right">+{breakdown.keyword_points}</span>
              <span>{breakdown.details.find(d => d.includes("density")) || "Keyword Analysis"}</span>
            </li>
            <li className="flex gap-2 text-[10px] text-text-muted items-start">
              <span className="font-mono text-accent-2 w-6 shrink-0 text-right">+{breakdown.committee_points}</span>
              <span>{breakdown.details.find(d => d.includes("Assigned") || d.includes("committee")) || "Committee Impact"}</span>
            </li>
            <li className="flex gap-2 text-[10px] text-text-muted items-start">
              <span className="font-mono text-pink-500 w-6 shrink-0 text-right">+{breakdown.sponsor_points}</span>
              <span>{breakdown.details.find(d => d.includes("Sponsor")) || "Sponsor History Profile"}</span>
            </li>
            
            {penaltyDetail && (
              <li className="flex gap-2 text-[10px] text-red-400/90 items-start pt-1.5 mt-1.5 border-t border-border/50">
                <span className="font-mono font-bold w-6 shrink-0 text-right">x0.3</span>
                <span>{penaltyDetail}</span>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
