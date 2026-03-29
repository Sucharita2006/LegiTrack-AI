import { ClassificationBadge } from "./classification-badge";
import { RelevanceBar } from "./relevance-bar";
import type { Bill } from "@/services/api";
import { MapPin, Users, Building2, ExternalLink, Check } from "lucide-react";
import { cn, formatState } from "@/lib/utils";

interface BillCardProps {
  bill: Bill;
  className?: string;
  isSelected?: boolean;
  onSelect?: (id: number, selected: boolean) => void;
}

export function BillCard({ bill, className, isSelected, onSelect }: BillCardProps) {

  const sponsorNames = Array.isArray(bill.sponsors)
    ? bill.sponsors.slice(0, 2).map(s => s.name || "Unknown").join(", ")
    : "";

  const isNew = bill.created_at 
    ? new Date().getTime() - new Date(bill.created_at + 'Z').getTime() < 48 * 60 * 60 * 1000 
    : false;

  const handleCardClick = () => {
    if (bill.url) {
      window.open(bill.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(bill.bill_id, !isSelected);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        "glass flex flex-col h-full rounded-2xl p-5 cursor-pointer transition-all duration-300 relative",
        "hover:border-border-light hover:bg-surface-2/80 hover:scale-[1.01]",
        "group",
        isSelected && "ring-2 ring-accent border-accent/50 bg-accent/5",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 rounded-md bg-surface-2 px-2 py-0.5 text-xs font-mono font-medium text-accent">
              {bill.bill_number}
            </span>
            {isNew && (
               <span className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-accent to-pink-500 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-white shadow-lg shadow-accent/20 animate-pulse">
                 NEW
               </span>
            )}
            <span className="inline-flex items-center gap-1 text-xs text-text-muted">
              <MapPin className="h-3 w-3" />
              {formatState(bill.state)}
            </span>
          </div>
          <h3 className="text-sm font-semibold leading-snug line-clamp-2 group-hover:text-white transition-colors">
            {bill.title}
          </h3>
        </div>
        <div className="flex items-start gap-3">
          <ClassificationBadge classification={bill.classification} size="sm" />
          {/* Selection Checkbox */}
          {onSelect && (
            <div 
              onClick={handleCheckboxClick}
              className={cn(
                "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border transition-all mt-0.5",
                isSelected 
                  ? "bg-accent border-accent text-white opacity-100" 
                  : "border-border-light bg-surface-2 opacity-0 group-hover:opacity-100 hover:border-accent"
              )}
            >
              {isSelected && <Check className="h-4 w-4 stroke-[3]" />}
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {bill.description && (
        <p className="text-xs text-text-muted line-clamp-2 mb-3">{bill.description}</p>
      )}

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3 text-[11px] text-text-muted">
        {sponsorNames && (
          <span className="inline-flex items-center gap-1">
            <Users className="h-3 w-3" />
            {sponsorNames}
          </span>
        )}
        {bill.committee && (
          <span className="inline-flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            {bill.committee}
          </span>
        )}
      </div>

      {/* AI Reasoning */}
      {bill.llm_reasoning && (
        <div className="mb-4 rounded-lg bg-surface-2/50 border border-white/5 p-3 text-xs leading-relaxed text-text">
          <div className="flex items-center gap-1.5 mb-1.5 text-accent font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            AI Reasoning
          </div>
          {bill.llm_reasoning}
        </div>
      )}

      {/* Bottom Anchored Section */}
      <div className="mt-auto pt-2">
        {/* Relevance Algorithm Score */}
        <RelevanceBar 
          score={bill.relevance_score ?? bill.score} 
          breakdown={bill.relevance_breakdown} 
          size="sm" 
          label="Relevance Score" 
        />

        {/* Keywords */}
        {bill.relevance_keywords && bill.relevance_keywords.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {bill.relevance_keywords.slice(0, 4).map(kw => (
              <span key={kw} className="rounded-full bg-accent-dim px-2 py-0.5 text-[10px] text-accent font-medium">
                {kw}
              </span>
            ))}
            {bill.relevance_keywords.length > 4 && (
              <span className="text-[10px] text-text-muted self-center">+{bill.relevance_keywords.length - 4}</span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between text-[10px] text-text-muted">
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-text/70">
              {bill.last_action_date ? new Date(bill.last_action_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : "Unknown Date"}
            </span>
            <span className="truncate max-w-[200px]">{bill.last_action || bill.status || "No recent actions recorded"}</span>
          </div>
          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
        </div>
      </div>
    </div>
  );
}
