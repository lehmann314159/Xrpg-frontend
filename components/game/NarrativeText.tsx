import { NarrativeMood } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Scroll, AlertTriangle, Trophy, Sparkles, Flame } from "lucide-react";

interface NarrativeTextProps {
  text: string;
  mood?: NarrativeMood;
  className?: string;
}

const moodConfig: Record<
  NarrativeMood,
  {
    icon: typeof Scroll;
    bgColor: string;
    borderColor: string;
    iconColor: string;
    textColor: string;
  }
> = {
  neutral: {
    icon: Scroll,
    bgColor: "bg-muted/30",
    borderColor: "border-muted",
    iconColor: "text-muted-foreground",
    textColor: "text-foreground",
  },
  tense: {
    icon: AlertTriangle,
    bgColor: "bg-yellow-950/30",
    borderColor: "border-yellow-600/50",
    iconColor: "text-yellow-400",
    textColor: "text-yellow-50",
  },
  triumphant: {
    icon: Trophy,
    bgColor: "bg-green-950/30",
    borderColor: "border-green-600/50",
    iconColor: "text-green-400",
    textColor: "text-green-50",
  },
  mysterious: {
    icon: Sparkles,
    bgColor: "bg-purple-950/30",
    borderColor: "border-purple-600/50",
    iconColor: "text-purple-400",
    textColor: "text-purple-50",
  },
  dangerous: {
    icon: Flame,
    bgColor: "bg-red-950/30",
    borderColor: "border-red-600/50",
    iconColor: "text-red-400",
    textColor: "text-red-50",
  },
};

export function NarrativeText({ text, mood = "neutral", className }: NarrativeTextProps) {
  const config = moodConfig[mood];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "relative flex items-start gap-3 rounded-lg border p-4",
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", config.iconColor)} />
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm leading-relaxed italic", config.textColor)}>
          {text}
        </p>
      </div>
    </div>
  );
}
