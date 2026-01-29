import { ItemView } from "@/lib/types";
import { ItemCard } from "./ItemCard";
import { cn } from "@/lib/utils";
import { Package } from "lucide-react";

interface InventoryPanelProps {
  items: ItemView[];
  onUse?: (itemId: string) => void;
  onEquip?: (itemId: string) => void;
  className?: string;
}

export function InventoryPanel({
  items,
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
