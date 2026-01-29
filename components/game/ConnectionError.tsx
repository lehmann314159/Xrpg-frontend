"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { WifiOff, RefreshCw } from "lucide-react";

interface ConnectionErrorProps {
  onRetry?: () => void;
  className?: string;
}

export function ConnectionError({ onRetry, className }: ConnectionErrorProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-lg border border-red-600/50 bg-red-950/30 p-6 text-center",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-900/50">
        <WifiOff className="h-6 w-6 text-red-400" />
      </div>
      <div className="space-y-1">
        <h3 className="font-bold text-lg">Connection Lost</h3>
        <p className="text-sm text-muted-foreground">
          Unable to connect to the game server.
          <br />
          Make sure the backend is running on port 8080.
        </p>
      </div>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Retry Connection
        </Button>
      )}
      <div className="text-xs text-muted-foreground font-mono">
        Expected: http://localhost:8080
      </div>
    </div>
  );
}
