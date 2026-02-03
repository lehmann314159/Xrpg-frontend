import { EnhancedCombatResult } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Swords, Shield, Skull, Star, Heart } from "lucide-react";

interface CombatResultProps {
  result: EnhancedCombatResult;
  variant?: "standard" | "dramatic" | "compact";
  className?: string;
}

export function CombatResult({ result, variant = "standard", className }: CombatResultProps) {
  const isCompact = variant === "compact";
  const isDramatic = variant === "dramatic";

  return (
    <div
      className={cn(
        "space-y-3",
        isDramatic && "animate-pulse-subtle",
        className
      )}
    >
      {/* Player's Attack */}
      {result.playerAttack && (
        <div
          className={cn(
            "flex items-start gap-3 p-3 rounded-lg",
            result.playerAttack.wasCritical
              ? "bg-yellow-950/40 border border-yellow-600/50"
              : result.playerAttack.wasHit
              ? "bg-green-950/30 border border-green-600/30"
              : "bg-muted/30 border border-muted"
          )}
        >
          <div className="flex-shrink-0 mt-0.5">
            {result.playerAttack.wasCritical ? (
              <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
            ) : (
              <Swords className="h-5 w-5 text-green-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">
                {result.playerAttack.attackerName}
              </span>
              <span className="text-muted-foreground">→</span>
              <span className="text-red-400">{result.playerAttack.targetName}</span>
            </div>
            {result.playerAttack.wasHit ? (
              <p className={cn("text-sm", isCompact ? "text-xs" : "")}>
                {result.playerAttack.wasCritical && (
                  <span className="text-yellow-400 font-bold">CRITICAL HIT! </span>
                )}
                <span className="text-red-400 font-semibold">
                  {result.playerAttack.damage} damage
                </span>
                {!isCompact && (
                  <span className="text-muted-foreground">
                    {" "}• Enemy HP: {result.playerAttack.remainingHp}
                  </span>
                )}
              </p>
            ) : (
              <p className={cn("text-muted-foreground", isCompact ? "text-xs" : "text-sm")}>
                Attack missed!
              </p>
            )}
          </div>
        </div>
      )}

      {/* Enemy Defeated */}
      {result.enemyDefeated && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-green-950/40 border border-green-600/50">
          <Skull className="h-5 w-5 text-green-400" />
          <div>
            <p className="font-medium text-green-400">Enemy Defeated!</p>
            {!isCompact && (
              <p className="text-sm text-muted-foreground">
                The path ahead is clear.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Enemy's Attack (if enemy not defeated and attacked) */}
      {result.enemyAttack && !result.enemyDefeated && (
        <div
          className={cn(
            "flex items-start gap-3 p-3 rounded-lg",
            result.enemyAttack.wasCritical
              ? "bg-red-950/50 border border-red-500/60"
              : result.enemyAttack.wasHit
              ? "bg-red-950/30 border border-red-600/30"
              : "bg-muted/30 border border-muted"
          )}
        >
          <div className="flex-shrink-0 mt-0.5">
            {result.enemyAttack.wasHit ? (
              <Shield className="h-5 w-5 text-red-400" />
            ) : (
              <Shield className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-red-400">{result.enemyAttack.attackerName}</span>
              <span className="text-muted-foreground">→</span>
              <span className="font-medium text-foreground">
                {result.enemyAttack.targetName}
              </span>
            </div>
            {result.enemyAttack.wasHit ? (
              <p className={cn("text-sm", isCompact ? "text-xs" : "")}>
                {result.enemyAttack.wasCritical && (
                  <span className="text-red-400 font-bold">CRITICAL HIT! </span>
                )}
                <span className="text-red-400 font-semibold">
                  {result.enemyAttack.damage} damage
                </span>
                {!isCompact && (
                  <span className="text-muted-foreground">
                    {" "}• Your HP: {result.enemyAttack.remainingHp}
                  </span>
                )}
              </p>
            ) : (
              <p className={cn("text-muted-foreground", isCompact ? "text-xs" : "text-sm")}>
                Attack dodged!
              </p>
            )}
          </div>
        </div>
      )}

      {/* Player Died */}
      {result.playerDied && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-red-950/50 border border-red-500/60">
          <Heart className="h-5 w-5 text-red-500" />
          <div>
            <p className="font-medium text-red-400">You have fallen!</p>
            {!isCompact && (
              <p className="text-sm text-muted-foreground">
                Your adventure ends here...
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
