import { MonsterView } from "@/lib/types";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Skull, Swords, Heart } from "lucide-react";

interface MonsterCardProps {
  monster: MonsterView;
  onAttack?: (monsterId: string) => void;
  className?: string;
}

export function MonsterCard({ monster, onAttack, className }: MonsterCardProps) {
  const hpPercentage = (monster.hp / monster.maxHp) * 100;
  const isWeak = hpPercentage <= 25;
  const isDead = monster.hp <= 0;

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
