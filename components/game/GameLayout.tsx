import { LayoutStyle } from "@/lib/types";
import { cn } from "@/lib/utils";
import React from "react";

interface GameLayoutProps {
  style: LayoutStyle;
  children: React.ReactNode;
  className?: string;
}

const layoutStyles: Record<LayoutStyle, string> = {
  // Standard: 3-column responsive grid for balanced exploration
  standard: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",

  // Focused: 2-column layout for combat - main content + sidebar
  focused: "grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4",

  // Cinematic: Single column, centered, max-width for dramatic moments
  cinematic: "flex flex-col items-center gap-4 max-w-2xl mx-auto",

  // Dense: 4-column compact grid for inventory management
  dense: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3",
};

export function GameLayout({ style, children, className }: GameLayoutProps) {
  return (
    <div className={cn(layoutStyles[style], className)}>
      {children}
    </div>
  );
}

// Wrapper for emphasized components (larger, more prominent)
interface EmphasisWrapperProps {
  emphasis?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function EmphasisWrapper({ emphasis, children, className }: EmphasisWrapperProps) {
  if (!emphasis) {
    return <>{children}</>;
  }

  return (
    <div className={cn(
      "col-span-full lg:col-span-2 animate-pulse-subtle",
      className
    )}>
      {children}
    </div>
  );
}

// Component card wrapper with variant-based styling
interface ComponentCardProps {
  variant?: "standard" | "dramatic" | "compact" | "atmospheric" | "minimal";
  borderColor?: string;
  children: React.ReactNode;
  className?: string;
}

export function ComponentCard({ variant = "standard", borderColor, children, className }: ComponentCardProps) {
  const variantStyles: Record<string, string> = {
    standard: "rounded-lg border bg-card p-4",
    dramatic: "rounded-lg border-2 bg-card p-5 shadow-lg ring-1 ring-primary/20",
    compact: "rounded-md border bg-card p-2 text-sm",
    atmospheric: "rounded-lg border bg-gradient-to-b from-card to-card/80 p-4 shadow-inner",
    minimal: "rounded border bg-card/50 p-2 opacity-80",
  };

  return (
    <div className={cn(variantStyles[variant], borderColor, className)}>
      {children}
    </div>
  );
}
