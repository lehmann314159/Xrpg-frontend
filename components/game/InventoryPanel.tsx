import { ItemView, ComponentVariant } from "@/lib/types";
import { ItemCard } from "./ItemCard";
import { cn } from "@/lib/utils";
import { Package, Sword, Shield, FlaskConical, Key, Gem } from "lucide-react";

interface InventoryPanelProps {
  items: ItemView[];
  variant?: ComponentVariant;
  onUse?: (itemId: string) => void;
  onEquip?: (itemId: string) => void;
  className?: string;
}

const typeIcons: Record<ItemView["type"], typeof Package> = {
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

export function InventoryPanel({
  items,
  variant = "standard",
  onUse,
  onEquip,
  className,
}: InventoryPanelProps) {
  if (!items || items.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-2 text-muted-foreground py-4",
          className
        )}
      >
        <Package className="h-8 w-8 opacity-50" />
        <p className="text-sm">Your inventory is empty</p>
      </div>
    );
  }

  // Compact variant - list view with minimal details
  if (variant === "compact") {
    return (
      <div className={cn("space-y-1", className)}>
        <div className="text-xs text-muted-foreground mb-2">
          {items.length} item{items.length !== 1 ? "s" : ""}
        </div>
        {items.map((item) => {
          const Icon = typeIcons[item.type] || Package;
          const iconColor = typeColors[item.type] || "text-muted-foreground";
          return (
            <div
              key={item.id}
              className="flex items-center gap-2 rounded border bg-muted/30 px-2 py-1"
            >
              <Icon className={cn("h-3 w-3 flex-shrink-0", iconColor)} />
              <span className="text-sm truncate flex-1">{item.name}</span>
              {item.isEquipped && (
                <span className="text-xs text-green-400">E</span>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Minimal variant - just count and icons
  if (variant === "minimal") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Package className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          {items.length} item{items.length !== 1 ? "s" : ""}
        </span>
      </div>
    );
  }

  // Standard variant (default)
  return (
    <div className={cn("space-y-3", className)}>
      <div className="text-xs text-muted-foreground">
        {items.length} item{items.length !== 1 ? "s" : ""} in inventory
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border bg-muted/30 p-2"
          >
            <ItemCard
              item={item}
              location="inventory"
              onUse={onUse}
              onEquip={onEquip}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
