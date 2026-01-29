import { RoomView } from "@/lib/types";
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
} from "lucide-react";

interface RoomDescriptionProps {
  room: RoomView;
  className?: string;
}

const directionIcons: Record<string, typeof ArrowUp> = {
  north: ArrowUp,
  south: ArrowDown,
  east: ArrowRight,
  west: ArrowLeft,
};

export function RoomDescription({ room, className }: RoomDescriptionProps) {
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
