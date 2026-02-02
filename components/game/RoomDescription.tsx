import { RoomView, ComponentVariant } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  DoorOpen,
  Home,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Compass,
  Sparkles,
} from "lucide-react";

interface RoomDescriptionProps {
  room: RoomView;
  variant?: ComponentVariant;
  className?: string;
}

const directionIcons: Record<string, typeof ArrowUp> = {
  north: ArrowUp,
  south: ArrowDown,
  east: ArrowRight,
  west: ArrowLeft,
};

export function RoomDescription({ room, variant = "standard", className }: RoomDescriptionProps) {
  // Compact variant - minimal display
  if (variant === "compact") {
    return (
      <div className={cn("space-y-1", className)}>
        <div className="flex items-center justify-between">
          <span className="font-medium">{room.name}</span>
          <div className="flex gap-1">
            {room.isEntrance && <Home className="h-3 w-3 text-muted-foreground" />}
            {room.isExit && <DoorOpen className="h-3 w-3 text-green-400" />}
          </div>
        </div>
        <div className="flex gap-1 text-xs">
          {room.exits?.map((exit) => (
            <Badge key={exit} variant="outline" className="text-xs px-1.5 py-0 capitalize">
              {exit[0].toUpperCase()}
            </Badge>
          ))}
        </div>
      </div>
    );
  }

  // Atmospheric variant - enhanced for mystery/exploration
  if (variant === "atmospheric") {
    return (
      <div className={cn("space-y-4", className)}>
        {/* Room name with atmospheric styling */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-400" />
            <h3 className="font-bold text-xl">{room.name}</h3>
          </div>
          <div className="flex gap-1">
            {room.isEntrance && (
              <Badge variant="secondary" className="gap-1">
                <Home className="h-3 w-3" />
                Entrance
              </Badge>
            )}
            {room.isExit && (
              <Badge variant="success" className="gap-1 animate-pulse">
                <DoorOpen className="h-3 w-3" />
                Exit!
              </Badge>
            )}
          </div>
        </div>

        {/* Description - more prominent with atmospheric border */}
        <div className="border-l-2 border-purple-600/50 pl-4 py-2 bg-purple-950/20 rounded-r-lg">
          <p className="text-sm leading-relaxed italic">
            {room.description}
          </p>
        </div>

        {/* Exits - larger and more interactive looking */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
            <Compass className="h-4 w-4" />
            <span>Passages Lead...</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {room.exits && room.exits.length > 0 ? (
              room.exits.map((exit) => {
                const Icon = directionIcons[exit] || ArrowUp;
                return (
                  <Badge
                    key={exit}
                    variant="outline"
                    className="gap-2 capitalize cursor-pointer hover:bg-accent text-sm px-3 py-1.5 border-purple-600/50"
                  >
                    <Icon className="h-4 w-4" />
                    {exit}
                  </Badge>
                );
              })
            ) : (
              <span className="text-sm text-muted-foreground italic">The way seems blocked...</span>
            )}
          </div>
        </div>

        {/* Coordinates */}
        <div className="text-xs text-muted-foreground font-mono">
          Position: ({room.x}, {room.y})
        </div>
      </div>
    );
  }

  // Standard variant (default)
  return (
    <div className={cn("space-y-3", className)}>
      {/* Room name and markers */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">{room.name}</h3>
        <div className="flex gap-1">
          {room.isEntrance && (
            <Badge variant="secondary" className="gap-1">
              <Home className="h-3 w-3" />
              Entrance
            </Badge>
          )}
          {room.isExit && (
            <Badge variant="success" className="gap-1">
              <DoorOpen className="h-3 w-3" />
              Exit
            </Badge>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground leading-relaxed">
        {room.description}
      </p>

      {/* Exits */}
      <div className="space-y-2">
        <div className="flex items-center gap-1 text-xs text-muted-foreground uppercase tracking-wide">
          <Compass className="h-3 w-3" />
          <span>Exits</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {room.exits && room.exits.length > 0 ? (
            room.exits.map((exit) => {
              const Icon = directionIcons[exit] || ArrowUp;
              return (
                <Badge
                  key={exit}
                  variant="outline"
                  className="gap-1 capitalize cursor-pointer hover:bg-accent"
                >
                  <Icon className="h-3 w-3" />
                  {exit}
                </Badge>
              );
            })
          ) : (
            <span className="text-sm text-muted-foreground">No exits visible</span>
          )}
        </div>
      </div>

      {/* Coordinates */}
      <div className="text-xs text-muted-foreground font-mono">
        Position: ({room.x}, {room.y})
      </div>
    </div>
  );
}
