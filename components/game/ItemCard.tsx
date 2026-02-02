import { ItemView, ComponentVariant } from "@/lib/types";
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
  Sparkles,
} from "lucide-react";

interface ItemCardProps {
  item: ItemView;
  location: "room" | "inventory";
  variant?: ComponentVariant;
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
  variant = "standard",
  onTake,
  onUse,
  onEquip,
  className,
}: ItemCardProps) {
  const Icon = typeIcons[item.type] || Package;
  const iconColor = typeColors[item.type] || "text-muted-foreground";

  const canEquip = item.type === "weapon" || item.type === "armor";
  const canUse = item.type === "consumable";

  // Compact variant - minimal inline display
  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Icon className={cn("h-4 w-4 flex-shrink-0", iconColor)} />
        <span className="font-medium truncate">{item.name}</span>
        {item.isEquipped && <CheckCircle className="h-3 w-3 text-green-400 flex-shrink-0" />}
        <div className="flex gap-1 ml-auto text-xs">
          {item.damage && item.damage > 0 && <span className="text-orange-400">+{item.damage}</span>}
          {item.armor && item.armor > 0 && <span className="text-blue-400">+{item.armor}</span>}
          {item.healing && item.healing > 0 && <span className="text-green-400">+{item.healing}</span>}
        </div>
      </div>
    );
  }

  // Dramatic variant - emphasized for rare/important items
  if (variant === "dramatic") {
    return (
      <div className={cn("space-y-3", className)}>
        {/* Header with sparkle effect */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Icon className={cn("h-7 w-7", iconColor)} />
              <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-yellow-400 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-lg">{item.name}</h3>
              <span className="text-xs text-yellow-400 uppercase tracking-wide">Notable Item</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {item.isEquipped && (
              <Badge variant="success" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                Equipped
              </Badge>
            )}
            <Badge variant="secondary" className="capitalize text-sm">
              {item.type}
            </Badge>
          </div>
        </div>

        {/* Description - more prominent */}
        <p className="text-sm leading-relaxed border-l-2 border-yellow-600/50 pl-3">
          {item.description}
        </p>

        {/* Stats - larger display */}
        <div className="flex flex-wrap gap-3">
          {item.damage && item.damage > 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-orange-900/30 px-3 py-2 border border-orange-600/30">
              <Sword className="h-5 w-5 text-orange-400" />
              <div>
                <div className="text-xs text-muted-foreground">Damage</div>
                <div className="font-bold text-lg">+{item.damage}</div>
              </div>
            </div>
          )}
          {item.armor && item.armor > 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-blue-900/30 px-3 py-2 border border-blue-600/30">
              <Shield className="h-5 w-5 text-blue-400" />
              <div>
                <div className="text-xs text-muted-foreground">Defense</div>
                <div className="font-bold text-lg">+{item.armor}</div>
              </div>
            </div>
          )}
          {item.healing && item.healing > 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-green-900/30 px-3 py-2 border border-green-600/30">
              <FlaskConical className="h-5 w-5 text-green-400" />
              <div>
                <div className="text-xs text-muted-foreground">Healing</div>
                <div className="font-bold text-lg">+{item.healing}</div>
              </div>
            </div>
          )}
        </div>

        {/* Actions - larger buttons */}
        <div className="flex gap-2">
          {location === "room" && onTake && (
            <Button variant="secondary" size="lg" className="flex-1" onClick={() => onTake(item.id)}>
              <Hand className="h-5 w-5 mr-2" />
              Take {item.name}
            </Button>
          )}
          {location === "inventory" && canUse && onUse && (
            <Button variant="default" size="lg" className="flex-1" onClick={() => onUse(item.id)}>
              <FlaskConical className="h-5 w-5 mr-2" />
              Use
            </Button>
          )}
          {location === "inventory" && canEquip && !item.isEquipped && onEquip && (
            <Button variant="secondary" size="lg" className="flex-1" onClick={() => onEquip(item.id)}>
              <CheckCircle className="h-5 w-5 mr-2" />
              Equip
            </Button>
          )}
        </div>

        {/* Item ID */}
        <div className="text-xs text-muted-foreground font-mono">
          ID: {item.id}
        </div>
      </div>
    );
  }

  // Standard variant (default)
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
