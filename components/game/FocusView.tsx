import { GameStateSnapshot } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, User, Package, Map } from "lucide-react";
import { RoomDescription } from "./RoomDescription";
import { PlayerStats } from "./PlayerStats";
import { InventoryPanel } from "./InventoryPanel";
import { DungeonMap } from "./DungeonMap";
import { EquipmentPanel } from "./EquipmentPanel";

export type FocusType = "look" | "stats" | "inventory" | "map";

interface FocusViewProps {
  focusType: FocusType;
  gameState: GameStateSnapshot;
  onBack: () => void;
}

const focusConfig: Record<FocusType, { icon: typeof Eye; title: string; description: string }> = {
  look: {
    icon: Eye,
    title: "Current Location",
    description: "Take in your surroundings...",
  },
  stats: {
    icon: User,
    title: "Character Status",
    description: "Review your abilities and condition...",
  },
  inventory: {
    icon: Package,
    title: "Inventory",
    description: "Examine your belongings...",
  },
  map: {
    icon: Map,
    title: "Dungeon Map",
    description: "Study your path through the dungeon...",
  },
};

export function FocusView({ focusType, gameState, onBack }: FocusViewProps) {
  const config = focusConfig[focusType];
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center gap-6 max-w-2xl mx-auto">
      {/* Header with back button */}
      <div className="w-full flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to game
        </Button>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon className="h-4 w-4" />
          <span className="text-sm">{config.title}</span>
        </div>
      </div>

      {/* Atmospheric description */}
      <p className="text-sm text-muted-foreground italic text-center">
        {config.description}
      </p>

      {/* Focused content */}
      <div className="w-full rounded-lg border bg-card p-6">
        {focusType === "look" && gameState.currentRoom && (
          <RoomDescription room={gameState.currentRoom} variant="atmospheric" />
        )}

        {focusType === "stats" && gameState.character && (
          <div className="space-y-6">
            <PlayerStats character={gameState.character} variant="dramatic" />
            {gameState.equipment && (
              <div className="pt-4 border-t">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                  Equipment
                </h4>
                <EquipmentPanel equipment={gameState.equipment} />
              </div>
            )}
          </div>
        )}

        {focusType === "inventory" && (
          <div className="space-y-4">
            {gameState.inventory && gameState.inventory.length > 0 ? (
              <InventoryPanel items={gameState.inventory} />
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Your pack is empty.
              </p>
            )}
          </div>
        )}

        {focusType === "map" && gameState.mapGrid && (
          <div className="flex justify-center">
            <DungeonMap mapGrid={gameState.mapGrid} />
          </div>
        )}
      </div>

      {/* Bottom back button for convenience */}
      <Button
        variant="outline"
        onClick={onBack}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Return to adventure
      </Button>
    </div>
  );
}
