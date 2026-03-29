import { useEffect, useState } from "react";
import { Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { getPipelineStatus } from "@/services/api";
import { cn } from "@/lib/utils";

interface PipelineOverlayProps {
  isVisible: boolean;
  status: "idle" | "running" | "complete" | "error";
}

export function PipelineOverlay({ isVisible, status }: PipelineOverlayProps) {
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("Initializing...");

  useEffect(() => {
    if (!isVisible) {
      const t = setTimeout(() => setProgress(0), 0);
      return () => clearTimeout(t);
    }

    if (status === "running") {
      setTimeout(() => {
        setProgress(0);
        setMessage("Initializing connection...");
      }, 0);
      
      const interval = setInterval(async () => {
        try {
          const res = await getPipelineStatus();
          if (res) {
            setProgress(res.progress);
            setMessage(res.message);
          }
        } catch (e) {
          console.error("Failed to fetch pipeline status", e);
        }
      }, 1000);

      return () => clearInterval(interval);
    }

    if (status === "complete") {
      setTimeout(() => {
        setProgress(100);
        setMessage("Dashboard is now populated with AI-graded bills. Reloading...");
      }, 0);
    }
  }, [isVisible, status]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md transition-all duration-500">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl glass border border-white/10 p-8 text-center shadow-2xl">
        {/* Glowing Background Blob */}
        <div className="absolute -left-20 -top-20 h-40 w-40 rounded-full bg-accent/20 blur-3xl opacity-50 pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-accent-2/20 blur-3xl opacity-50 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          {status === "running" ? (
            <div className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-2 shadow-inner">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
              <Sparkles className="absolute -right-2 -top-2 h-5 w-5 animate-pulse text-accent-2" />
            </div>
          ) : status === "complete" ? (
            <div className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 shadow-inner">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
          ) : (
            <div className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 shadow-inner">
              <span className="text-2xl font-bold text-red-500">!</span>
            </div>
          )}

          <h3 className="mb-2 text-xl font-semibold text-text">
            {status === "running" ? "Running Intelligence Pipeline" : status === "complete" ? "Extraction Complete" : "Pipeline Failed"}
          </h3>
          <p className="mb-6 text-sm text-text-muted h-10 flex items-center justify-center">
            {status === "error"
              ? "An error occurred while connecting to the integration servers."
              : message}
          </p>

          {/* Progress Bar Container */}
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2 shadow-inner relative">
            <div
              className={cn(
                "h-full w-full rounded-full transition-all duration-1000 ease-out absolute top-0 left-0",
                status === "error" ? "bg-red-500" : "bg-gradient-to-r from-accent to-accent-2"
              )}
              style={{ transform: `translateX(-${100 - progress}%)` }}
            />
          </div>
          
          <div className="mt-3 flex w-full justify-between text-xs font-medium text-text-muted">
            <span>{progress}%</span>
            {status === "running" && <span className="animate-pulse text-accent">Calling LLM Services...</span>}
            {status === "complete" && <span className="text-emerald-500">Success</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
