import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LayoutDashboard, ScrollText, FileText, PawPrint, Zap } from "lucide-react";
import { useState } from "react";
import { getPipelineStatus, runPipeline } from "@/services/api";

import { PipelineOverlay } from "../ui/pipeline-overlay";
import { RunPipelineModal } from "../ui/run-pipeline-modal";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/bills", label: "Bills", icon: ScrollText },
  { to: "/digest", label: "Digest", icon: FileText },
];

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [pipelineState, setPipelineState] = useState<"idle" | "running" | "complete" | "error">("idle");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleRunPipeline = async (states: string[], timeframe: string) => {
    if (pipelineState !== "idle") return;
    setPipelineState("running");
    try {
      const result = await runPipeline(states.join(","), timeframe);
      
      // Since it runs in the background, we poll until done.
      const pollInterval = window.setInterval(async () => {
        try {
          const statusRes = await getPipelineStatus();
          // The pipeline script resets is_running to false and progress to 100 when gracefully done
          if (!statusRes.is_running && statusRes.progress === 100) {
            window.clearInterval(pollInterval);
            setPipelineState("complete");
            setTimeout(() => {
              setPipelineState("idle");
              // Re-fetch bills by reloading the Dashboard / Bills page
              window.location.reload();
            }, 2000);
          } else if (!statusRes.is_running && statusRes.progress === 0 && statusRes.message.toLowerCase().includes("fail")) {
            window.clearInterval(pollInterval);
            setPipelineState("error");
            setTimeout(() => setPipelineState("idle"), 3000);
          }
        } catch (e) {
          console.error("Error polling pipeline status", e);
        }
      }, 2000);
    } catch (err) {
      console.error("Pipeline failed:", err);
      setPipelineState("error");
      setTimeout(() => setPipelineState("idle"), 3000);
    }
  };

  const pipelineRunning = pipelineState === "running";

  return (
    <>
      <PipelineOverlay isVisible={pipelineState !== "idle"} status={pipelineState} />
      <RunPipelineModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRun={(states, timeframe) => {
          setIsModalOpen(false);
          handleRunPipeline(states, timeframe);
        }}
      />
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-2 transition-transform group-hover:scale-110">
              <PawPrint className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight">
              <span className="gradient-text">LegiTrack</span>
              <span className="text-text-muted font-medium ml-1">AI</span>
            </span>
          </NavLink>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all",
                    isActive
                      ? "bg-accent-dim text-accent"
                      : "text-text-muted hover:text-text hover:bg-surface-2"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              disabled={pipelineRunning}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all",
                pipelineRunning
                  ? "bg-surface-2 text-text-muted cursor-wait"
                  : "bg-gradient-to-r from-accent to-accent-2 text-white hover:shadow-lg hover:shadow-accent/25 hover:scale-[1.02] active:scale-[0.98]"
              )}
            >
              <Zap className={cn("h-4 w-4", pipelineRunning && "animate-spin")} />
              {pipelineRunning ? "Running..." : "Run Pipeline"}
            </button>
          </div>

          {/* Mobile Nav */}
          <nav className="md:hidden fixed bottom-0 left-0 right-0 glass border-t border-border flex items-center justify-around py-2 px-4 z-50">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg px-3 py-1.5 text-[10px] font-medium transition-all",
                    isActive ? "text-accent" : "text-text-muted"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </header>
    </>
  );
}
