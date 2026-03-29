import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchBill, type BillDetail } from "@/services/api";
import { ClassificationBadge } from "@/components/ui/classification-badge";
import { ScoreBar } from "@/components/ui/score-bar";
import {
  ArrowLeft, ExternalLink, MapPin, Users, Building2,
  Calendar, FileText, Activity, Loader2
} from "lucide-react";
import { cn, formatState } from "@/lib/utils";

export function BillDetailPage() {
  const { billId } = useParams<{ billId: string }>();
  const navigate = useNavigate();
  const [bill, setBill] = useState<BillDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!billId) return;
    fetchBill(parseInt(billId))
      .then(setBill)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [billId]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="glass rounded-2xl p-12 text-center">
        <h2 className="text-xl font-semibold mb-2">Bill not found</h2>
        <button onClick={() => navigate("/bills")} className="text-accent hover:underline mt-4">
          ← Back to Bills
        </button>
      </div>
    );
  }

  const sponsors = Array.isArray(bill.sponsors) ? bill.sponsors : [];


  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate("/bills")}
        className="flex items-center gap-2 text-sm text-text-muted hover:text-text transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Bills
      </button>

      {/* Header */}
      <div className="glass rounded-2xl p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <span className="rounded-lg bg-accent-dim px-3 py-1 text-sm font-mono font-semibold text-accent">
                {bill.bill_number}
              </span>
              <span className="flex items-center gap-1 text-sm text-text-muted">
                <MapPin className="h-3.5 w-3.5" /> {formatState(bill.state)}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold leading-snug">{bill.title}</h1>
          </div>
          <ClassificationBadge classification={bill.classification} size="lg" />
        </div>

        {bill.description && (
          <p className="text-sm text-text-muted leading-relaxed">{bill.description}</p>
        )}

        {bill.url && (
          <a
            href={bill.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-4 text-xs text-accent hover:underline"
          >
            View on LegiScan <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {/* Score Breakdown & Reasoning */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Total Score */}
        <div className="glass rounded-2xl p-6 text-center flex flex-col items-center justify-center">
          <p className="text-xs uppercase tracking-widest text-text-muted mb-3 font-semibold">AI Impact Score</p>
          <p className="text-4xl font-bold gradient-text">{(bill.score || 0).toFixed(1)}</p>
          <ScoreBar score={bill.score} className="mt-4 w-full max-w-[200px]" />
          <p className="text-[11px] text-text-muted mt-3">Confidence: <span className="font-medium text-text">{((bill.confidence || 0) * 100).toFixed(0)}%</span></p>
        </div>

        {/* LLM Reasoning */}
        <div className="md:col-span-2 glass rounded-2xl p-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-text-muted mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-accent" />
            AI Classification Reasoning
          </h2>
          <div className="rounded-xl border border-white/5 bg-surface-2/50 p-5">
            <p className="text-sm text-text leading-relaxed font-medium">
              {bill.llm_reasoning || "No reasoning provided by the AI."}
            </p>
          </div>
        </div>
      </div>

      {/* Old Section Removed */}

      {/* Metadata */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Sponsors */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-text-muted mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-accent" />
            Sponsors ({sponsors.length})
          </h2>
          {sponsors.length > 0 ? (
            <div className="space-y-2">
              {sponsors.map((s, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg bg-surface-2/50 px-3 py-2">
                  <div
                    className={cn(
                      "h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold",
                      s.party === "D" ? "bg-blue-500/20 text-blue-400" :
                      s.party === "R" ? "bg-red-500/20 text-red-400" :
                      "bg-neutral-dim text-neutral"
                    )}
                  >
                    {(s.party || "?").charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.name || "Unknown"}</p>
                    <p className="text-[10px] text-text-muted">{s.role || "Sponsor"}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted">No sponsors listed</p>
          )}
        </div>

        {/* Info */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-text-muted mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4 text-accent" />
            Bill Information
          </h2>
          <div className="space-y-3">
            {[
              { icon: Building2, label: "Committee", value: bill.committee },
              { icon: Activity, label: "Status", value: bill.status },
              { icon: Calendar, label: "Last Action", value: bill.last_action },
              { icon: Calendar, label: "Last Action Date", value: bill.last_action_date },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3">
                <Icon className="h-4 w-4 text-text-muted mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-text-muted">{label}</p>
                  <p className="text-sm">{value || "N/A"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Keywords */}
      {bill.relevance_keywords && bill.relevance_keywords.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-text-muted mb-4">Matched Keywords</h2>
          <div className="flex flex-wrap gap-2">
            {bill.relevance_keywords.map(kw => (
              <span key={kw} className="rounded-full bg-accent-dim px-3 py-1 text-xs text-accent font-medium ring-1 ring-accent/20">
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Full Text Preview */}
      {bill.full_text && (
        <div className="glass rounded-2xl p-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-text-muted mb-4">Bill Text Preview</h2>
          <div className="max-h-96 overflow-y-auto rounded-lg bg-surface-2 p-4 text-xs text-text-muted leading-relaxed font-mono whitespace-pre-wrap">
            {bill.full_text.slice(0, 5000)}
            {bill.full_text.length > 5000 && "\n\n... [truncated]"}
          </div>
        </div>
      )}
    </div>
  );
}
