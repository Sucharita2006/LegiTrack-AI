import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchBills, deleteBills, type Bill } from "@/services/api";
import { BillCard } from "@/components/ui/bill-card";
import { FilterPanel } from "@/components/ui/filter-panel";
import { Loader2, ScrollText, Check, Trash2 } from "lucide-react";

const STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

export function BillsPage() {
  const [searchParams] = useSearchParams();
  const [bills, setBills] = useState<Bill[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 24;

  const [state, setState] = useState("");
  const [classification, setClassification] = useState("");
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [isRecentOnly, setIsRecentOnly] = useState(searchParams.get("recent") === "true");
  const [selectedBills, setSelectedBills] = useState<Set<number>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  // Debounce keyword search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedKeyword(keyword), 400);
    return () => clearTimeout(t);
  }, [keyword]);

  const loadBills = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number | boolean> = { limit, offset };
      if (state) params.state = state;
      if (classification) params.classification = classification;
      if (debouncedKeyword) params.keyword = debouncedKeyword;
      if (isRecentOnly) params.recent_only = true;

      const data = await fetchBills(params);
      setBills(data.bills);
      setTotal(data.total);
    } catch (err) {
      console.error("Failed to fetch bills:", err);
    } finally {
      setLoading(false);
    }
  }, [state, classification, debouncedKeyword, isRecentOnly, offset, limit]);

  useEffect(() => {
    setOffset(0);
  }, [state, classification, debouncedKeyword, isRecentOnly]);

  useEffect(() => {
    loadBills();
  }, [loadBills]);
  
  const handleSelectAll = () => {
    if (selectedBills.size === bills.length) {
      setSelectedBills(new Set());
    } else {
      setSelectedBills(new Set(bills.map(b => b.bill_id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedBills.size) return;
    
    setIsDeleting(true);
    try {
      await deleteBills(Array.from(selectedBills).map(String));
      setSelectedBills(new Set());
      await loadBills();
    } catch (err) {
      console.error("Failed to delete bills:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    
    setIsDeleting(true);
    try {
      await deleteBills([], true);
      setSelectedBills(new Set());
      await loadBills();
    } catch (err) {
      console.error("Failed to delete all bills:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <ScrollText className="h-6 w-6 text-accent" />
          <span className="gradient-text">Tracked Bills</span>
        </h1>
        <p className="text-sm text-text-muted mt-1">
          {total} bills found across {STATES.length} states
        </p>
      </div>

      {/* Filters */}
      <FilterPanel
        states={STATES}
        selectedState={state}
        selectedClassification={classification}
        searchKeyword={keyword}
        isRecentOnly={isRecentOnly}
        onStateChange={setState}
        onClassificationChange={setClassification}
        onSearchChange={setKeyword}
        onRecentOnlyChange={setIsRecentOnly}
      />

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      )}

      {/* Bills Grid */}
      {!loading && bills.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handleSelectAll}
              className="text-sm font-medium text-text-muted hover:text-accent flex items-center gap-2 group transition-colors"
            >
              <div className="flex h-5 w-5 items-center justify-center rounded border border-border-light group-hover:border-accent group-hover:bg-accent/10 transition-colors">
                {selectedBills.size > 0 && selectedBills.size === bills.length && <Check className="h-3 w-3 text-accent" />}
                {selectedBills.size > 0 && selectedBills.size < bills.length && <div className="h-2 w-2 rounded-sm bg-accent" />}
              </div>
              Select All on Page
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bills.map(bill => (
              <BillCard 
                key={bill.bill_id} 
                bill={bill}
                isSelected={selectedBills.has(bill.bill_id)}
                onSelect={(id, selected) => {
                  const next = new Set(selectedBills);
                  if (selected) next.add(id);
                  else next.delete(id);
                  setSelectedBills(next);
                }}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                disabled={currentPage <= 1}
                onClick={() => setOffset(Math.max(0, offset - limit))}
                className="rounded-lg border border-border bg-surface px-4 py-2 text-sm text-text-muted hover:text-text hover:border-border-light disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Previous
              </button>
              <span className="text-sm text-text-muted px-4">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setOffset(offset + limit)}
                className="rounded-lg border border-border bg-surface px-4 py-2 text-sm text-text-muted hover:text-text hover:border-border-light disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Empty */}
      {!loading && bills.length === 0 && (
        <div className="glass rounded-2xl p-12 text-center">
          <ScrollText className="h-12 w-12 text-text-muted mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No bills found</h2>
          <p className="text-text-muted">
            {state || classification || debouncedKeyword
              ? "Try adjusting your filters."
              : "Run the pipeline to start tracking bills."}
          </p>
        </div>
      )}

      {/* Floating Action Bar */}
      {selectedBills.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 rounded-2xl glass border border-accent/20 bg-background/90 px-6 py-4 shadow-[0_8px_32px_-8px_rgba(236,72,153,0.3)] animate-in slide-in-from-bottom-8">
          <span className="text-sm font-bold text-text whitespace-nowrap">
            {selectedBills.size} bill{selectedBills.size > 1 ? 's' : ''} selected
          </span>
          <div className="h-6 w-px bg-border mx-1" />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedBills(new Set())}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-semibold text-text-muted hover:text-text transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 rounded-xl transition-all shadow-lg shadow-red-500/20 active:scale-95 disabled:opacity-50"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete Selected
            </button>
            <button
              onClick={handleDeleteAll}
              disabled={isDeleting}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-500/10 border border-red-500/20 rounded-xl transition-all active:scale-95 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Clear Entire Database
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
