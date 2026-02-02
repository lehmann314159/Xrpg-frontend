import { MonsterView, ComponentVariant } from "@/lib/types";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Skull, Swords, Heart, AlertTriangle } from "lucide-react";

interface MonsterCardProps {
  monster: MonsterView;
  variant?: ComponentVariant;
  onAttack?: (monsterId: string) => void;
  className?: string;
}

export function MonsterCard({ monster, variant = "standard", onAttack, className }: MonsterCardProps) {
  const hpPercentage = (monster.hp / monster.maxHp) * 100;
  const isWeak = hpPercentage <= 25;
  const isDead = monster.hp <= 0;

  // Compact variant - minimal display for lists
  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-3", isDead && "opacity-50", className)}>
        <Skull className={cn("h-4 w-4 flex-shrink-0", isWeak ? "text-yellow-400" : "text-red-400")} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="font-medium truncate">{monster.name}</span>
            <span className="text-xs font-mono text-muted-foreground ml-2">
              {monster.hp}/{monster.maxHp}
            </span>
          </div>
          <Progress
            value={monster.hp}
            max={monster.maxHp}
            className="h-1 mt-1"
            indicatorClassName={isWeak ? "bg-yellow-500" : "bg-red-500"}
          />
        </div>
      </div>
    );
  }

  // Dramatic variant - emphasized display for bosses
  if (variant === "dramatic") {
    return (
      <div
        className={cn(
          "space-y-4",
          isDead && "opacity-50",
          className
        )}
      >
        {/* Dramatic Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Skull className={cn("h-8 w-8", isWeak ? "text-yellow-400" : "text-red-400")} />
              {!isDead && (
                <AlertTriangle className="absolute -top-1 -right-1 h-4 w-4 text-orange-400 animate-pulse" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-lg">{monster.name}</h3>
              <span className="text-xs text-red-400 uppercase tracking-wide">Dangerous Enemy</span>
            </div>
          </div>
          <Badge variant={isDead ? "secondary" : "destructive"} className="text-sm px-3 py-1">
            {isDead ? "Defeated" : "HOSTILE"}
          </Badge>
        </div>

        {/* Description - more prominent */}
        <p className="text-sm text-muted-foreground leading-relaxed border-l-2 border-red-600/50 pl-3">
          {monster.description}
        </p>

        {/* Large HP Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-400" />
              <span className="font-medium">Health</span>
            </div>
            <span className="font-mono text-lg font-bold">
              {monster.hp} / {monster.maxHp}
            </span>
          </div>
          <Progress
            value={monster.hp}
            max={monster.maxHp}
            className="h-4"
            indicatorClassName={cn(
              isWeak ? "bg-yellow-500" : "bg-red-500",
              !isDead && "animate-pulse"
            )}
          />
        </div>

        {/* Stats - larger */}
        <div className="flex items-center gap-3 bg-red-950/30 rounded-lg p-3">
          <Swords className="h-6 w-6 text-orange-400" />
          <div>
            <span className="text-xs text-muted-foreground uppercase">Attack Power</span>
            <div className="font-bold text-xl">{monster.damage}</div>
          </div>
        </div>

        {/* Attack button - larger */}
        {!isDead && onAttack && (
          <Button
            variant="destructive"
            size="lg"
            className="w-full text-lg"
            onClick={() => onAttack(monster.id)}
          >
            <Swords className="h-5 w-5 mr-2" />
            Attack {monster.name}
          </Button>
        )}

        {/* Monster ID */}
        <div className="text-xs text-muted-foreground font-mono">
          ID: {monster.id}
        </div>
      </div>
    );
  }

  // Standard variant (default)
  return (
    <div
      className={cn(
        "space-y-3",
        isDead && "opacity-50",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skull className={cn("h-5 w-5", isWeak ? "text-yellow-400" : "text-red-400")} />
          <h3 className="font-bold">{monster.name}</h3>
        </div>
        <Badge variant={isDead ? "secondary" : "destructive"}>
          {isDead ? "Defeated" : "Hostile"}
        </Badge>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground">{monster.description}</p>

      {/* HP Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1">
            <Heart className="h-4 w-4 text-red-400" />
            <span>HP</span>
          </div>
          <span className="font-mono">
            {monster.hp} / {monster.maxHp}
          </span>
        </div>
        <Progress
          value={monster.hp}
          max={monster.maxHp}
          className="h-2"
          indicatorClassName={isWeak ? "bg-yellow-500" : "bg-red-500"}
        />
      </div>

      {/* Stats */}
      <div className="flex items-center gap-2 text-sm">
        <Swords className="h-4 w-4 text-orange-400" />
        <span className="text-muted-foreground">Damage:</span>
        <span className="font-bold">{monster.damage}</span>
      </div>

      {/* Attack button */}
      {!isDead && onAttack && (
        <Button
          variant="destructive"
          size="sm"
          className="w-full"
          onClick={() => onAttack(monster.id)}
        >
          <Swords className="h-4 w-4 mr-2" />
          Attack
        </Button>
      )}

      {/* Monster ID for reference */}
      <div className="text-xs text-muted-foreground font-mono">
        ID: {monster.id}
      </div>
    </div>
  );
}
