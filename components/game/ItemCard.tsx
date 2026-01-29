import { ItemView } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Sword,
  Shield,
  FlaskConical,
  Key,
  Gem,
  Package,
  Hand,
  CheckCircle,
} from "lucide-react";

interface ItemCardProps {
  item: ItemView;
  location: "room" | "inventory";
  onTake?: (itemId: string) => void;
  onUse?: (itemId: string) => void;
  onEquip?: (itemId: string) => void;
  className?: string;
}

const typeIcons: Record<ItemView["type"], typeof Sword> = {
  weapon: Sword,
  armor: Shield,
  consumable: FlaskConical,
  key: Key,
  treasure: Gem,
};

const typeColors: Record<ItemView["type"], string> = {
  weapon: "text-orange-400",
  armor: "text-blue-400",
  consumable: "text-green-400",
  key: "text-yellow-400",
  treasure: "text-purple-400",
};

export function ItemCard({
  item,
  location,
  onTake,
  onUse,
  onEquip,
  className,
}: ItemCardProps) {
  const Icon = typeIcons[item.type] || Package;
  const iconColor = typeColors[item.type] || "text-muted-foreground";

  const canEquip = item.type === "weapon" || item.type === "armor";
  const canUse = item.type === "consumable";

  return (
    <div className={cn("space-y-2", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn("h-5 w-5", iconColor)} />
          <h3 className="font-bold">{item.name}</h3>
        </div>
        <div className="flex items-center gap-1">
          {item.isEquipped && (
            <Badge variant="success" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              Equipped
            </Badge>
          )}
          <Badge variant="secondary" className="capitalize">
            {item.type}
          </Badge>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground">{item.description}</p>

      {/* Stats */}
      <div className="flex flex-wrap gap-2 text-sm">
        {item.damage && item.damage > 0 && (
          <div className="flex items-center gap-1 rounded bg-orange-900/30 px-2 py-0.5">
            <Sword className="h-3 w-3 text-orange-400" />
            <span>+{item.damage} Damage</span>
          </div>
        )}
        {item.armor && item.armor > 0 && (
          <div className="flex items-center gap-1 rounded bg-blue-900/30 px-2 py-0.5">
            <Shield className="h-3 w-3 text-blue-400" />
            <span>+{item.armor} Armor</span>
          </div>
        )}
        {item.healing && item.healing > 0 && (
          <div className="flex items-center gap-1 rounded bg-green-900/30 px-2 py-0.5">
            <FlaskConical className="h-3 w-3 text-green-400" />
            <span>+{item.healing} HP</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {location === "room" && onTake && (
          <Button variant="secondary" size="sm" onClick={() => onTake(item.id)}>
            <Hand className="h-4 w-4 mr-1" />
            Take
          </Button>
        )}
        {location === "inventory" && canUse && onUse && (
          <Button variant="default" size="sm" onClick={() => onUse(item.id)}>
            <FlaskConical className="h-4 w-4 mr-1" />
            Use
          </Button>
        )}
        {location === "inventory" && canEquip && !item.isEquipped && onEquip && (
          <Button variant="secondary" size="sm" onClick={() => onEquip(item.id)}>
            <CheckCircle className="h-4 w-4 mr-1" />
            Equip
          </Button>
        )}
      </div>

      {/* Item ID for reference */}
      <div className="text-xs text-muted-foreground font-mono">
        ID: {item.id}
      </div>
    </div>
  );
}
