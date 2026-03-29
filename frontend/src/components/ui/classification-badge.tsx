import { cn } from "@/lib/utils";

interface ClassificationBadgeProps {
  classification: "PRO" | "ANTI" | "NEUTRAL" | string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const badgeConfig = {
  PRO: { label: "Pro-Animal", emoji: "🟢", bg: "bg-pro-dim", text: "text-pro", ring: "ring-pro/20" },
  ANTI: { label: "Anti-Animal", emoji: "🔴", bg: "bg-anti-dim", text: "text-anti", ring: "ring-anti/20" },
  NEUTRAL: { label: "Neutral", emoji: "⚪", bg: "bg-neutral-dim", text: "text-neutral", ring: "ring-neutral/20" },
};

const sizeStyles = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-3 py-1 text-xs",
  lg: "px-4 py-1.5 text-sm",
};

export function ClassificationBadge({ classification, size = "md", className }: ClassificationBadgeProps) {
  const key = (classification || "NEUTRAL").toUpperCase() as keyof typeof badgeConfig;
  const config = badgeConfig[key] || badgeConfig.NEUTRAL;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold uppercase tracking-wider ring-1",
        config.bg, config.text, config.ring,
        sizeStyles[size],
        className
      )}
    >
      <span>{config.emoji}</span>
      <span>{config.label}</span>
    </span>
  );
}
