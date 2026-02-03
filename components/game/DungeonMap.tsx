import { MapCell, ComponentVariant } from "@/lib/types";
import { cn } from "@/lib/utils";
import { User, DoorOpen } from "lucide-react";

interface DungeonMapProps {
  mapGrid: MapCell[][];
  variant?: ComponentVariant;
  className?: string;
}

const statusColors: Record<MapCell["status"], string> = {
  unknown: "bg-muted/20 border-muted/30",
  visited: "bg-secondary border-secondary",
  current: "bg-primary/30 border-primary animate-pulse-glow",
  adjacent: "bg-muted/50 border-muted",
  exit: "bg-green-900/50 border-green-600",
};

// Doorway connector component (thin version)
function Doorway({ direction, visible }: { direction: "horizontal" | "vertical"; visible: boolean }) {
  if (!visible) {
    return direction === "horizontal" ? (
      <div className="w-3 h-10" /> // Empty horizontal spacer
    ) : (
      <div className="h-3 w-10" /> // Empty vertical spacer
    );
  }

  return direction === "horizontal" ? (
    <div className="w-3 h-10 flex items-center justify-center">
      <div className="w-0.5 h-2 bg-amber-700" />
    </div>
  ) : (
    <div className="h-3 w-10 flex items-center justify-center">
      <div className="h-0.5 w-2 bg-amber-700" />
    </div>
  );
}

// Check if a cell has been explored (visited or current)
function isExplored(cell: MapCell | undefined): boolean {
  return cell?.status === "visited" || cell?.status === "current";
}

// Check if a cell has a specific exit
function hasExit(cell: MapCell | undefined, direction: string): boolean {
  return cell?.exits?.includes(direction) ?? false;
}

export function DungeonMap({ mapGrid, variant = "standard", className }: DungeonMapProps) {
  if (!mapGrid || mapGrid.length === 0) {
    return (
      <div className={cn("flex items-center justify-center text-muted-foreground", className)}>
        No map data available
      </div>
    );
  }

  // Reverse rows so north (higher Y) is at the top
  const flippedGrid = [...mapGrid].reverse();

  // Get cell at coordinates (accounting for flipped grid)
  const getCell = (x: number, flippedY: number): MapCell | undefined => {
    return flippedGrid[flippedY]?.[x];
  };

  // Minimal variant - smaller cells, simple connectors
  if (variant === "minimal") {
    return (
      <div className={cn("flex flex-col items-center", className)}>
        {flippedGrid.map((row, rowIdx) => (
          <div key={`row-${rowIdx}`}>
            {/* Room row with horizontal connectors */}
            <div className="flex items-center">
              {row.map((cell, colIdx) => (
                <div key={`cell-${colIdx}`} className="flex items-center">
                  {/* Room cell */}
                  <div
                    className={cn(
                      "relative w-6 h-6 rounded-sm border flex items-center justify-center",
                      statusColors[cell.status]
                    )}
                  >
                    {cell.hasPlayer && <User className="h-3 w-3 text-primary" />}
                    {cell.status === "exit" && !cell.hasPlayer && (
                      <DoorOpen className="h-2.5 w-2.5 text-green-400" />
                    )}
                  </div>
                  {/* Horizontal connector (east) - only show if either room is explored */}
                  {colIdx < row.length - 1 && (
                    <div className="w-1.5 h-6 flex items-center justify-center">
                      {hasExit(cell, "east") && (isExplored(cell) || isExplored(row[colIdx + 1])) && (
                        <div className="w-0.5 h-1 bg-amber-700" />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {/* Vertical connectors row - only show if either room is explored */}
            {rowIdx < flippedGrid.length - 1 && (
              <div className="flex">
                {row.map((cell, colIdx) => {
                  const cellBelow = flippedGrid[rowIdx + 1]?.[colIdx];
                  const showDoorway = hasExit(cell, "south") && (isExplored(cell) || isExplored(cellBelow));
                  return (
                    <div key={`vconn-${colIdx}`} className="flex">
                      <div className="w-6 h-1.5 flex items-center justify-center">
                        {showDoorway && (
                          <div className="w-1 h-0.5 bg-amber-700" />
                        )}
                      </div>
                      {colIdx < row.length - 1 && <div className="w-1.5 h-1.5" />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Standard variant (default) with doorway connectors
  return (
    <div className={cn("flex flex-col items-center", className)}>
      {flippedGrid.map((row, rowIdx) => (
        <div key={`row-${rowIdx}`}>
          {/* Room row with horizontal connectors */}
          <div className="flex items-center">
            {row.map((cell, colIdx) => (
              <div key={`cell-${colIdx}`} className="flex items-center">
                {/* Room cell */}
                <div
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

                  {/* Dot for visited rooms */}
                  {cell.status === "visited" && !cell.hasPlayer && (
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                  )}
                </div>

                {/* Horizontal connector (east doorway) - only show if either room is explored */}
                {colIdx < row.length - 1 && (
                  <Doorway
                    direction="horizontal"
                    visible={hasExit(cell, "east") && (isExplored(cell) || isExplored(row[colIdx + 1]))}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Vertical connectors row (south doorways) - only show if either room is explored */}
          {rowIdx < flippedGrid.length - 1 && (
            <div className="flex justify-center">
              {row.map((cell, colIdx) => {
                const cellBelow = flippedGrid[rowIdx + 1]?.[colIdx];
                const showDoorway = hasExit(cell, "south") && (isExplored(cell) || isExplored(cellBelow));
                return (
                  <div key={`vconn-${colIdx}`} className="flex items-center">
                    <div className="w-10 h-3 flex items-center justify-center">
                      {showDoorway && (
                        <div className="h-0.5 w-2 bg-amber-700" />
                      )}
                    </div>
                    {/* Spacer for horizontal connector column */}
                    {colIdx < row.length - 1 && <div className="w-3 h-3" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground justify-center">
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
        <div className="flex items-center gap-1">
          <div className="w-2 h-0.5 bg-amber-700" />
          <span>Doorway</span>
        </div>
      </div>
    </div>
  );
}
