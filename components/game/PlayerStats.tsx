import { CharacterView, ComponentVariant } from "@/lib/types";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Heart, Sword, Zap, Skull, AlertTriangle } from "lucide-react";

interface PlayerStatsProps {
  character: CharacterView;
  variant?: ComponentVariant;
  className?: string;
}

const statusVariants: Record<CharacterView["status"], "default" | "success" | "warning" | "destructive"> = {
  Healthy: "success",
  Wounded: "warning",
  Critical: "destructive",
  Dead: "destructive",
};

export function PlayerStats({ character, variant = "standard", className }: PlayerStatsProps) {
  const hpPercentage = (character.hp / character.maxHp) * 100;
  const isInDanger = hpPercentage <= 30;

  const hpColor = hpPercentage > 50
    ? "bg-green-500"
    : hpPercentage > 25
    ? "bg-yellow-500"
    : "bg-red-500";

  // Minimal variant - just HP bar, very compact
  if (variant === "minimal") {
    return (
      <div className={cn("space-y-1", className)}>
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium truncate">{character.name}</span>
          <span className="font-mono text-muted-foreground">
            {character.hp}/{character.maxHp}
          </span>
        </div>
        <Progress
          value={character.hp}
          max={character.maxHp}
          className="h-1.5"
          indicatorClassName={hpColor}
        />
      </div>
    );
  }

  // Compact variant - condensed but readable
  if (variant === "compact") {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium">{character.name}</span>
            <Badge variant={statusVariants[character.status]} className="text-xs px-1.5 py-0">
              {character.status}
            </Badge>
          </div>
          <span className="font-mono text-sm">
            {character.hp}/{character.maxHp}
          </span>
        </div>
        <Progress
          value={character.hp}
          max={character.maxHp}
          className="h-2"
          indicatorClassName={hpColor}
        />
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span>STR: {character.strength}</span>
          <span>DEX: {character.dexterity}</span>
        </div>
      </div>
    );
  }

  // Dramatic variant - emphasized HP, warning state
  if (variant === "dramatic") {
    return (
      <div className={cn("space-y-4", className)}>
        {/* Name and status - larger */}
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xl">{character.name}</h3>
          <Badge variant={statusVariants[character.status]} className="text-sm px-3 py-1">
            {character.status === "Dead" && <Skull className="h-4 w-4 mr-1" />}
            {character.status}
          </Badge>
        </div>

        {/* HP Bar - large and prominent */}
        <div className={cn(
          "space-y-2 p-3 rounded-lg",
          isInDanger ? "bg-red-950/30 border border-red-600/50" : "bg-muted/30"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className={cn("h-6 w-6", isInDanger ? "text-red-400 animate-pulse" : "text-red-400")} />
              <span className="font-medium text-lg">Health</span>
              {isInDanger && (
                <AlertTriangle className="h-5 w-5 text-yellow-400 animate-pulse" />
              )}
            </div>
            <span className={cn(
              "font-mono text-2xl font-bold",
              isInDanger && "text-red-400"
            )}>
              {character.hp} / {character.maxHp}
            </span>
          </div>
          <Progress
            value={character.hp}
            max={character.maxHp}
            className="h-5"
            indicatorClassName={cn(hpColor, isInDanger && "animate-pulse")}
          />
          {isInDanger && (
            <p className="text-sm text-red-400 text-center mt-2">
              Warning: Health critical! Find healing or flee!
            </p>
          )}
        </div>

        {/* Attributes - larger cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 rounded-lg bg-orange-950/30 border border-orange-600/30 p-3">
            <Sword className="h-6 w-6 text-orange-400" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground uppercase">Strength</span>
              <span className="font-bold text-xl">{character.strength}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-yellow-950/30 border border-yellow-600/30 p-3">
            <Zap className="h-6 w-6 text-yellow-400" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground uppercase">Dexterity</span>
              <span className="font-bold text-xl">{character.dexterity}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Standard variant (default)
  return (
    <div className={cn("space-y-3", className)}>
      {/* Name and status */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">{character.name}</h3>
        <Badge variant={statusVariants[character.status]}>
          {character.status === "Dead" && <Skull className="h-3 w-3 mr-1" />}
          {character.status}
        </Badge>
      </div>

      {/* HP Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1">
            <Heart className="h-4 w-4 text-red-400" />
            <span>HP</span>
          </div>
          <span className="font-mono">
            {character.hp} / {character.maxHp}
          </span>
        </div>
        <Progress
          value={character.hp}
          max={character.maxHp}
          className="h-3"
          indicatorClassName={hpColor}
        />
      </div>

      {/* Attributes */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2 rounded-md bg-muted/50 p-2">
          <Sword className="h-4 w-4 text-orange-400" />
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Strength</span>
            <span className="font-bold">{character.strength}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-md bg-muted/50 p-2">
          <Zap className="h-4 w-4 text-yellow-400" />
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Dexterity</span>
            <span className="font-bold">{character.dexterity}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
