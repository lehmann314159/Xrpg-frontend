import { EquipmentView, ComponentVariant } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Sword, Shield, CircleDashed } from "lucide-react";

interface EquipmentPanelProps {
  equipment: EquipmentView;
  variant?: ComponentVariant;
  className?: string;
}

export function EquipmentPanel({ equipment, variant = "standard", className }: EquipmentPanelProps) {
  // Compact variant - inline, minimal display
  if (variant === "compact") {
    return (
      <div className={cn("flex gap-3", className)}>
        <div className="flex items-center gap-1.5">
          <Sword className="h-4 w-4 text-orange-400" />
          <span className="text-sm">
            {equipment.weapon ? (
              <span className="font-medium">{equipment.weapon.name}</span>
            ) : (
              <span className="text-muted-foreground">None</span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Shield className="h-4 w-4 text-blue-400" />
          <span className="text-sm">
            {equipment.armor ? (
              <span className="font-medium">{equipment.armor.name}</span>
            ) : (
              <span className="text-muted-foreground">None</span>
            )}
          </span>
        </div>
      </div>
    );
  }

  // Minimal variant - just icons with indicators
  if (variant === "minimal") {
    return (
      <div className={cn("flex gap-2", className)}>
        <div className={cn(
          "flex items-center justify-center w-8 h-8 rounded border",
          equipment.weapon ? "bg-orange-900/30 border-orange-600/30" : "bg-muted/30 border-muted"
        )}>
          <Sword className={cn("h-4 w-4", equipment.weapon ? "text-orange-400" : "text-muted-foreground")} />
        </div>
        <div className={cn(
          "flex items-center justify-center w-8 h-8 rounded border",
          equipment.armor ? "bg-blue-900/30 border-blue-600/30" : "bg-muted/30 border-muted"
        )}>
          <Shield className={cn("h-4 w-4", equipment.armor ? "text-blue-400" : "text-muted-foreground")} />
        </div>
      </div>
    );
  }

  // Standard variant (default)
  return (
    <div className={cn("space-y-3", className)}>
      {/* Weapon slot */}
      <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-orange-900/30 border border-orange-600/50">
          <Sword className="h-5 w-5 text-orange-400" />
        </div>
        <div className="flex-1">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">
            Weapon
          </div>
          {equipment.weapon ? (
            <div>
              <div className="font-medium">{equipment.weapon.name}</div>
              <div className="text-sm text-orange-400">
                +{equipment.weapon.damage} Damage
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-muted-foreground">
              <CircleDashed className="h-4 w-4" />
              <span>Empty (bare hands)</span>
            </div>
          )}
        </div>
      </div>

      {/* Armor slot */}
      <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-900/30 border border-blue-600/50">
          <Shield className="h-5 w-5 text-blue-400" />
        </div>
        <div className="flex-1">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">
            Armor
          </div>
          {equipment.armor ? (
            <div>
              <div className="font-medium">{equipment.armor.name}</div>
              <div className="text-sm text-blue-400">
                +{equipment.armor.armor} Defense
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-muted-foreground">
              <CircleDashed className="h-4 w-4" />
              <span>Empty (unarmored)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
