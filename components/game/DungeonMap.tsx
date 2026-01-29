import { MapCell } from "@/lib/types";
import { cn } from "@/lib/utils";
import { User, DoorOpen, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";

interface DungeonMapProps {
  mapGrid: MapCell[][];
  className?: string;
}

const statusColors: Record<MapCell["status"], string> = {
  unknown: "bg-muted/20 border-muted/30",
  visited: "bg-secondary border-secondary",
  current: "bg-primary/30 border-primary animate-pulse-glow",
  adjacent: "bg-muted/50 border-muted",
  exit: "bg-green-900/50 border-green-600",
};

const exitArrows: Record<string, typeof ArrowUp> = {
  north: ArrowUp,
  south: ArrowDown,
  east: ArrowRight,
  west: ArrowLeft,
};

export function DungeonMap({ mapGrid, className }: DungeonMapProps) {
  if (!mapGrid || mapGrid.length === 0) {
    return (
      <div className={cn("flex items-center justify-center text-muted-foreground", className)}>
        No map data available
      </div>
    );
  }

  // Reverse rows so north (higher Y) is at the top
  const flippedGrid = [...mapGrid].reverse();

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {flippedGrid.map((row, idx) => (
        <div key={idx} className="flex gap-1 justify-center">
          {row.map((cell) => (
            <div
              key={`${cell.x}-${cell.y}`}
              className={cn(
                "relative w-10 h-10 rounded border flex items-center justify-center transition-all",
                statusColors[cell.status]
              )}
              title={
                cell.roomId
                  ? `Room at (${cell.x}, ${cell.y}) - ${cell.status}`
                  : "Unexplored"
              }
            >
              {/* Player marker */}
              {cell.hasPlayer && (
                <User className="h-5 w-5 text-primary" />
              )}

              {/* Exit marker */}
              {cell.status === "exit" && !cell.hasPlayer && (
                <DoorOpen className="h-4 w-4 text-green-400" />
              )}

              {/* Exit direction indicators for visited rooms */}
              {cell.status === "visited" && cell.exits && !cell.hasPlayer && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                </div>
              )}

              {/* Show exit arrows on current cell */}
              {cell.hasPlayer && cell.exits && (
                <>
                  {cell.exits.includes("north") && (
                    <ArrowUp className="absolute -top-0.5 h-2 w-2 text-primary/70" />
                  )}
                  {cell.exits.includes("south") && (
                    <ArrowDown className="absolute -bottom-0.5 h-2 w-2 text-primary/70" />
                  )}
                  {cell.exits.includes("east") && (
                    <ArrowRight className="absolute -right-0.5 h-2 w-2 text-primary/70" />
                  )}
                  {cell.exits.includes("west") && (
                    <ArrowLeft className="absolute -left-0.5 h-2 w-2 text-primary/70" />
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      ))}

      {/* Legend */}
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground justify-center">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-primary/30 border border-primary" />
          <span>Current</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-secondary border border-secondary" />
          <span>Visited</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-900/50 border border-green-600" />
          <span>Exit</span>
        </div>
      </div>
    </div>
  );
}
