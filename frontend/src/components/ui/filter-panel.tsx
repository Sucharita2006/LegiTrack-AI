import { cn } from "@/lib/utils";
import { Search, Filter, X } from "lucide-react";
import { useState } from "react";

interface FilterPanelProps {
  states: string[];
  selectedState: string;
  selectedClassification: string;
  searchKeyword: string;
  isRecentOnly: boolean;
  onStateChange: (state: string) => void;
  onClassificationChange: (cls: string) => void;
  onSearchChange: (keyword: string) => void;
  onRecentOnlyChange: (recent: boolean) => void;
  className?: string;
}

export function FilterPanel({
  states,
  selectedState,
  selectedClassification,
  searchKeyword,
  isRecentOnly,
  onStateChange,
  onClassificationChange,
  onSearchChange,
  onRecentOnlyChange,
  className,
}: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const classifications = [
    { value: "", label: "All", color: "text-text" },
    { value: "PRO", label: "🟢 Pro", color: "text-pro" },
    { value: "ANTI", label: "🔴 Anti", color: "text-anti" },
    { value: "NEUTRAL", label: "⚪ Neutral", color: "text-neutral" },
  ];

  const hasFilters = selectedState || selectedClassification || searchKeyword || isRecentOnly;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search bills by title or keywords..."
            value={searchKeyword}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-4 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
          />
          {searchKeyword && (
            <button onClick={() => onSearchChange("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="h-4 w-4 text-text-muted hover:text-text" />
            </button>
          )}
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "rounded-xl border px-4 py-2.5 text-sm font-medium transition-all flex items-center gap-2",
            isExpanded || hasFilters
              ? "border-accent/50 bg-accent-dim text-accent"
              : "border-border bg-surface text-text-muted hover:text-text hover:border-border-light"
          )}
        >
          <Filter className="h-4 w-4" />
          Filters
          {hasFilters && (
            <span className="h-2 w-2 rounded-full bg-accent" />
          )}
        </button>
      </div>

      {/* Filter Options */}
      {isExpanded && (
        <div className="glass rounded-xl p-4 space-y-4 animate-fadeInUp" style={{ animationDuration: '0.3s' }}>
          <div className="flex flex-wrap gap-6">
            {/* State Filter */}
            <div>
              <label className="text-[11px] uppercase tracking-widest text-text-muted mb-2 block">State</label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => onStateChange("")}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                    !selectedState ? "bg-accent text-white" : "bg-surface-2 text-text-muted hover:text-text"
                  )}
                >
                  All
                </button>
                {states.map(st => (
                  <button
                    key={st}
                    onClick={() => onStateChange(st)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                      selectedState === st ? "bg-accent text-white" : "bg-surface-2 text-text-muted hover:text-text"
                    )}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Classification Filter */}
            <div>
              <label className="text-[11px] uppercase tracking-widest text-text-muted mb-2 block">Classification</label>
              <div className="flex gap-1.5">
                {classifications.map(cls => (
                  <button
                    key={cls.value}
                    onClick={() => onClassificationChange(cls.value)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                      selectedClassification === cls.value
                        ? "bg-accent text-white"
                        : "bg-surface-2 text-text-muted hover:text-text"
                    )}
                  >
                    {cls.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Arrival Segregation */}
            <div>
              <label className="text-[11px] uppercase tracking-widest text-text-muted mb-2 block">Arrival</label>
              <div className="flex gap-1.5">
                <button
                  onClick={() => onRecentOnlyChange(!isRecentOnly)}
                  className={cn(
                    "rounded-lg px-4 py-1.5 text-xs font-bold transition-all flex items-center gap-2",
                    isRecentOnly
                      ? "bg-gradient-to-r from-accent to-pink-500 text-white shadow-lg shadow-accent/20"
                      : "bg-surface-2 text-text-muted hover:text-text hover:bg-surface-2/80"
                  )}
                >
                  🚀 Show Only New Arrivals
                </button>
              </div>
            </div>
          </div>

          {/* Clear */}
          {hasFilters && (
            <button
              onClick={() => { onStateChange(""); onClassificationChange(""); onSearchChange(""); onRecentOnlyChange(false); }}
              className="text-xs text-accent hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
