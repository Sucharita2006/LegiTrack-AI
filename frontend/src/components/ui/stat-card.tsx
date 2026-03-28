import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: string;
  variant?: "default" | "pro" | "anti" | "neutral" | "accent";
  className?: string;
}

const variantStyles = {
  default: "border-border",
  pro: "border-pro/20 glow-pro",
  anti: "border-anti/20 glow-anti",
  neutral: "border-neutral/20",
  accent: "border-accent/20 glow-accent",
};

const valueStyles = {
  default: "text-text",
  pro: "text-pro",
  anti: "text-anti",
  neutral: "text-neutral",
  accent: "text-accent",
};

export function StatCard({ label, value, icon, trend, variant = "default", className }: StatCardProps) {
  return (
    <div
      className={cn(
        "glass rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] glass-hover",
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-text-muted mb-2">{label}</p>
          <p className={cn("text-3xl font-bold tabular-nums", valueStyles[variant])}>{value}</p>
          {trend && (
            <p className="mt-1 text-xs text-text-muted">{trend}</p>
          )}
        </div>
        {icon && (
          <div className={cn("rounded-xl p-2.5", variant === "pro" ? "bg-pro-dim" : variant === "anti" ? "bg-anti-dim" : variant === "accent" ? "bg-accent-dim" : "bg-surface-2")}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
