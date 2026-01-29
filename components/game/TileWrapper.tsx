"use client";

import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Pin,
  PinOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TileWrapperProps {
  children: ReactNode;
  title?: string;
  isPinned?: boolean;
  position?: number;
  totalTiles?: number;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onTogglePin?: () => void;
  className?: string;
}

export function TileWrapper({
  children,
  title,
  isPinned = false,
  position = 0,
  totalTiles = 1,
  onMoveLeft,
  onMoveRight,
  onMoveUp,
  onMoveDown,
  onTogglePin,
  className,
}: TileWrapperProps) {
  const canMoveLeft = position > 0;
  const canMoveRight = position < totalTiles - 1;
  // For grid movement - these would need grid width calculation
  const canMoveUp = position >= 3; // Assuming 3-column grid
  const canMoveDown = position < totalTiles - 3;

  return (
    <Card
      className={cn(
        "relative flex flex-col overflow-hidden transition-all",
        isPinned && "ring-2 ring-primary/50",
        className
      )}
    >
      {/* Title bar */}
      {title && (
        <div className="flex items-center justify-between border-b bg-muted/50 px-3 py-1.5">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {title}
          </span>
          {isPinned && (
            <Pin className="h-3 w-3 text-primary" />
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto p-3">{children}</div>

      {/* Control bar */}
      <div className="flex items-center justify-center gap-1 border-t bg-muted/30 p-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onMoveLeft}
          disabled={!canMoveLeft}
          title="Move left"
        >
          <ChevronLeft className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onMoveUp}
          disabled={!canMoveUp}
          title="Move up"
        >
          <ChevronUp className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onMoveDown}
          disabled={!canMoveDown}
          title="Move down"
        >
          <ChevronDown className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onMoveRight}
          disabled={!canMoveRight}
          title="Move right"
        >
          <ChevronRight className="h-3 w-3" />
        </Button>
        <div className="mx-1 h-4 w-px bg-border" />
        <Button
          variant={isPinned ? "default" : "ghost"}
          size="icon"
          className="h-6 w-6"
          onClick={onTogglePin}
          title={isPinned ? "Unpin" : "Pin"}
        >
          {isPinned ? (
            <PinOff className="h-3 w-3" />
          ) : (
            <Pin className="h-3 w-3" />
          )}
        </Button>
      </div>
    </Card>
  );
}
