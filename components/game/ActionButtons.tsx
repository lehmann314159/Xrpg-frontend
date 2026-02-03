import { GameStateSnapshot } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Swords,
  Eye,
  Map,
  User,
  Package,
  Hand,
  FlaskConical,
  CheckCircle,
  PlayCircle,
} from "lucide-react";

// Structured action that can be executed directly
export interface GameAction {
  tool: string;
  args: Record<string, string>;
  label: string;
}

interface ActionButtonsProps {
  gameState: GameStateSnapshot | null;
  onAction: (action: GameAction) => void;
  disabled?: boolean;
  className?: string;
}

const directionIcons: Record<string, typeof ArrowUp> = {
  north: ArrowUp,
  south: ArrowDown,
  east: ArrowRight,
  west: ArrowLeft,
};

// Subtle divider between button groups
function Divider() {
  return <div className="w-px h-6 bg-border mx-1" />;
}

export function ActionButtons({
  gameState,
  onAction,
  disabled,
  className,
}: ActionButtonsProps) {
  const hasGame = !!gameState?.character;
  const isAlive = gameState?.character?.isAlive ?? false;
  const isGameOver = gameState?.gameOver ?? false;
  const isVictory = gameState?.victory ?? false;

  // Get available exits
  const exits = gameState?.currentRoom?.exits ?? [];

  // Get monsters in room
  const monsters = gameState?.monsters ?? [];

  // Get items in room
  const roomItems = gameState?.roomItems ?? [];

  // Get inventory items
  const inventory = gameState?.inventory ?? [];

  // Consumables in inventory
  const consumables = inventory.filter((i) => i.type === "consumable");

  // Equippable items in inventory (not already equipped)
  const equippables = inventory.filter(
    (i) => (i.type === "weapon" || i.type === "armor") && !i.isEquipped
  );

  // Check which groups have content
  const hasMovement = exits.length > 0 && monsters.length === 0;
  const hasCombat = monsters.length > 0;
  const hasRoomItems = roomItems.length > 0;
  const hasConsumables = consumables.length > 0;
  const hasEquippables = equippables.length > 0;

  // New Game - show when no game or game over
  if (!hasGame || isGameOver || isVictory) {
    return (
      <div className={cn("flex flex-wrap items-center gap-2", className)}>
        <Button
          onClick={() =>
            onAction({ tool: "new_game", args: { character_name: "Hero" }, label: "New Game" })
          }
          disabled={disabled}
          className="gap-2"
        >
          <PlayCircle className="h-4 w-4" />
          New Game
        </Button>
      </div>
    );
  }

  // Game is active
  if (!isAlive) return null;

  return (
    <div className={cn("space-y-2", className)}>
      {/* Single row of all buttons with dividers */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Actions group */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAction({ tool: "look", args: {}, label: "Look" })}
          disabled={disabled}
          className="gap-1"
        >
          <Eye className="h-4 w-4" />
          Look
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAction({ tool: "stats", args: {}, label: "Stats" })}
          disabled={disabled}
          className="gap-1"
        >
          <User className="h-4 w-4" />
          Stats
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAction({ tool: "inventory", args: {}, label: "Inventory" })}
          disabled={disabled}
          className="gap-1"
        >
          <Package className="h-4 w-4" />
          Inventory
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAction({ tool: "map", args: {}, label: "Map" })}
          disabled={disabled}
          className="gap-1"
        >
          <Map className="h-4 w-4" />
          Map
        </Button>

        {/* Movement group */}
        {hasMovement && (
          <>
            <Divider />
            {["west", "north", "south", "east"]
              .filter((dir) => exits.includes(dir))
              .map((direction) => {
                const Icon = directionIcons[direction] || ArrowUp;
                return (
                  <Button
                    key={direction}
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      onAction({
                        tool: "move",
                        args: { direction },
                        label: `Go ${direction}`,
                      })
                    }
                    disabled={disabled}
                    className="gap-1 capitalize"
                  >
                    <Icon className="h-4 w-4" />
                    {direction}
                  </Button>
                );
              })}
          </>
        )}

        {/* Combat group */}
        {hasCombat && (
          <>
            <Divider />
            {monsters.map((monster) => (
              <Button
                key={monster.id}
                variant="destructive"
                size="sm"
                onClick={() =>
                  onAction({
                    tool: "attack",
                    args: { target_id: monster.id },
                    label: `Attack ${monster.name}`,
                  })
                }
                disabled={disabled}
                className="gap-1"
              >
                <Swords className="h-4 w-4" />
                Attack {monster.name}
              </Button>
            ))}
          </>
        )}

        {/* Room items group */}
        {hasRoomItems && (
          <>
            <Divider />
            {roomItems.map((item) => (
              <Button
                key={item.id}
                variant="outline"
                size="sm"
                onClick={() =>
                  onAction({
                    tool: "take",
                    args: { item_id: item.id },
                    label: `Take ${item.name}`,
                  })
                }
                disabled={disabled}
                className="gap-1 border-yellow-600/50 text-yellow-400 hover:bg-yellow-950/30"
              >
                <Hand className="h-4 w-4" />
                Take {item.name}
              </Button>
            ))}
          </>
        )}

        {/* Consumables group */}
        {hasConsumables && (
          <>
            <Divider />
            {consumables.map((item) => (
              <Button
                key={item.id}
                variant="outline"
                size="sm"
                onClick={() =>
                  onAction({
                    tool: "use",
                    args: { item_id: item.id },
                    label: `Use ${item.name}`,
                  })
                }
                disabled={disabled}
                className="gap-1 border-green-600/50 text-green-400 hover:bg-green-950/30"
              >
                <FlaskConical className="h-4 w-4" />
                Use {item.name}
              </Button>
            ))}
          </>
        )}

        {/* Equippables group */}
        {hasEquippables && (
          <>
            <Divider />
            {equippables.map((item) => (
              <Button
                key={item.id}
                variant="outline"
                size="sm"
                onClick={() =>
                  onAction({
                    tool: "equip",
                    args: { item_id: item.id },
                    label: `Equip ${item.name}`,
                  })
                }
                disabled={disabled}
                className="gap-1 border-blue-600/50 text-blue-400 hover:bg-blue-950/30"
              >
                <CheckCircle className="h-4 w-4" />
                Equip {item.name}
              </Button>
            ))}
          </>
        )}
      </div>

      {/* Monsters blocking message */}
      {exits.length > 0 && monsters.length > 0 && (
        <div className="text-xs text-yellow-500 flex items-center gap-1">
          <Swords className="h-3 w-3" />
          Defeat enemies to move
        </div>
      )}
    </div>
  );
}
