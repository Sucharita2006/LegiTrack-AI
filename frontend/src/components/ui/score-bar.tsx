import { cn } from "@/lib/utils";

interface ScoreBarProps {
  score: number | null;
  max?: number;
  showLabel?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function ScoreBar({ score, max = 100, showLabel = true, size = "md", className }: ScoreBarProps) {
  const pct = Math.min(((score || 0) / max) * 100, 100);
  const h = size === "sm" ? "h-1.5" : "h-2.5";

  return (
    <div className={cn("w-full", className)}>
      <div className={cn("w-full rounded-full bg-border overflow-hidden", h)}>
        <div
          className={cn("rounded-full transition-all duration-700 ease-out", h)}
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, var(--color-accent), var(--color-accent-2))`,
          }}
        />
      </div>
      {showLabel && (
        <div className="mt-1 flex justify-between text-[11px] text-text-muted">
          <span>AI Impact Score</span>
          <span className="font-medium text-text">{(score || 0).toFixed(1)}/{max}</span>
        </div>
      )}
    </div>
  );
}
