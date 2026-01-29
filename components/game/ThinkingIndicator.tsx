import { cn } from "@/lib/utils";
import { Loader2, Sparkles } from "lucide-react";

interface ThinkingIndicatorProps {
  message?: string;
  className?: string;
}

export function ThinkingIndicator({
  message = "The dungeon master is thinking...",
  className,
}: ThinkingIndicatorProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4",
        className
      )}
    >
      <div className="relative">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <Sparkles className="absolute -right-1 -top-1 h-3 w-3 text-yellow-400 animate-pulse" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{message}</p>
        <div className="mt-1 flex gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}
