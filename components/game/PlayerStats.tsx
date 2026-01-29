import { CharacterView } from "@/lib/types";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Heart, Sword, Zap, Skull } from "lucide-react";

interface PlayerStatsProps {
  character: CharacterView;
  className?: string;
}

const statusVariants: Record<CharacterView["status"], "default" | "success" | "warning" | "destructive"> = {
  Healthy: "success",
  Wounded: "warning",
  Critical: "destructive",
  Dead: "destructive",
};

export function PlayerStats({ character, className }: PlayerStatsProps) {
  const hpPercentage = (character.hp / character.maxHp) * 100;

  const hpColor = hpPercentage > 50
    ? "bg-green-500"
    : hpPercentage > 25
    ? "bg-yellow-500"
    : "bg-red-500";

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
