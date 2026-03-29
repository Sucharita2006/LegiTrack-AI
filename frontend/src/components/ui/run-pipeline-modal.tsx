import { useState, useMemo } from "react";
import { Search, X, Check, Globe, LayoutList } from "lucide-react";
import { cn } from "@/lib/utils";

const US_STATES = [
  { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" }, { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" }, { code: "CA", name: "California" }, { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" }, { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" }, { code: "HI", name: "Hawaii" }, { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" }, { code: "IN", name: "Indiana" }, { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" }, { code: "KY", name: "Kentucky" }, { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" }, { code: "MD", name: "Maryland" }, { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" }, { code: "MN", name: "Minnesota" }, { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" }, { code: "MT", name: "Montana" }, { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" }, { code: "NH", name: "New Hampshire" }, { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" }, { code: "NY", name: "New York" }, { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" }, { code: "OH", name: "Ohio" }, { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" }, { code: "PA", name: "Pennsylvania" }, { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" }, { code: "SD", name: "South Dakota" }, { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" }, { code: "UT", name: "Utah" }, { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" }, { code: "WA", name: "Washington" }, { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" }, { code: "WY", name: "Wyoming" },
];

interface RunPipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRun: (states: string[], timeframe: string) => void;
}

export function RunPipelineModal({ isOpen, onClose, onRun }: RunPipelineModalProps) {
  const [search, setSearch] = useState("");
  const [selectedStates, setSelectedStates] = useState<Set<string>>(new Set());
  const [timeframe, setTimeframe] = useState("24h");

  // Derive filtered states from search
  const filteredStates = useMemo(() => {
    if (!search.trim()) return US_STATES;
    const q = search.trim().toLowerCase();
    return US_STATES.filter(
      (state) => state.name.toLowerCase().includes(q) || state.code.toLowerCase().includes(q)
    );
  }, [search]);

  if (!isOpen) return null;

  const handleSelectAll = () => {
    setSelectedStates(new Set(US_STATES.map((s) => s.code)));
  };

  const handleClear = () => {
    setSelectedStates(new Set());
  };

  const handleToggleState = (code: string) => {
    const next = new Set(selectedStates);
    if (next.has(code)) {
      next.delete(code);
    } else {
      next.add(code);
    }
    setSelectedStates(next);
  };

  const handleRun = () => {
    onRun(Array.from(selectedStates), timeframe);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-surface border border-border rounded-2xl shadow-[0_16px_64px_-12px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[85vh] m-4 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/50 bg-surface-2/30">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Globe className="h-6 w-6 text-accent" />
              Configure Pipeline Scope
            </h2>
            <p className="text-sm text-text-muted mt-1">
              Select specific jurisdictions to target and fetch bills exclusively for those states.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-surface-2 text-text-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex flex-col p-6 overflow-hidden min-h-0 bg-background/30">
          
          {/* Timeframe Scope */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-text-muted mb-3 uppercase tracking-wider">Timeframe Scope</h3>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: "24h", label: "Recent (24 Hours)" },
                { id: "30d", label: "This Month (30 Days)" },
                { id: "all", label: "All Time (Session)" },
              ].map((tf) => (
                <button
                  key={tf.id}
                  onClick={() => setTimeframe(tf.id)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-sm font-medium transition-all border",
                    timeframe === tf.id
                      ? "bg-accent/15 border-accent text-accent shadow-[0_0_12px_rgba(168,85,247,0.2)]"
                      : "bg-surface-2 border-border text-text hover:border-border-light hover:bg-surface"
                  )}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-border/50 w-full mb-6" />

          {/* Controls Bar */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search state by name or code (e.g., California, NY)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                className="w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-4 text-sm tracking-wide text-text placeholder:text-text-muted/50 outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
              />
            </div>
            
            <button
              onClick={handleSelectAll}
              className="text-sm font-semibold text-text hover:text-accent transition-colors shrink-0"
            >
              Select All
            </button>
            <span className="text-border shrink-0">|</span>
            <button
              onClick={handleClear}
              className="text-sm font-semibold text-text-muted hover:text-text transition-colors shrink-0"
            >
              Clear
            </button>
          </div>

          {/* Scrolling Grid */}
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {filteredStates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <LayoutList className="h-10 w-10 text-border mb-3" />
                <p className="text-text-muted text-sm tracking-wide">No jurisdictions matched your query.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {filteredStates.map((state) => {
                  const isSelected = selectedStates.has(state.code);
                  return (
                    <div
                      key={state.code}
                      onClick={() => handleToggleState(state.code)}
                      className={cn(
                        "group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border",
                        isSelected
                          ? "bg-accent/10 border-accent/50 text-white"
                          : "bg-surface border-border hover:border-border-light text-text-muted hover:text-text"
                      )}
                    >
                      <div className={cn(
                        "flex shrink-0 h-5 w-5 items-center justify-center rounded border transition-colors",
                        isSelected
                          ? "bg-accent border-accent text-white"
                          : "bg-surface-2 border-border-light group-hover:border-accent/50"
                      )}>
                        {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="shrink-0 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-surface-2 text-text-muted">
                          {state.code}
                        </span>
                        <span className="text-sm font-medium truncate">
                          {state.name}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-border/50 bg-surface-2 flex items-center justify-between">
          <div className="text-sm text-text-muted font-medium">
            <span className="text-white font-bold">{selectedStates.size}</span> states selected
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-semibold text-text-muted hover:text-text hover:bg-surface transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleRun}
              disabled={selectedStates.size === 0}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold tracking-wide text-white bg-gradient-to-r from-accent to-accent-2 hover:shadow-lg hover:shadow-accent/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all"
            >
              ▶ Run Selected
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
