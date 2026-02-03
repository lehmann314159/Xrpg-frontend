"use client";

import { useState, useEffect, useCallback, ReactNode } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { readStreamableValue } from "ai/rsc";
import { submitCommand, executeAction } from "./actions";
import { ActionButtons, GameAction } from "@/components/game/ActionButtons";
import { FocusView, FocusType } from "@/components/game/FocusView";
import { useGridStore } from "@/lib/grid-store";
import { healthCheck } from "@/lib/mcp-client";
import { CommandInput } from "@/components/game/CommandInput";
import { ConnectionError } from "@/components/game/ConnectionError";
import { ThinkingIndicator } from "@/components/game/ThinkingIndicator";
import { NotificationList } from "@/components/game/Notification";
import { SettingsPanel, getStoredApiKey } from "@/components/game/SettingsPanel";
import { Swords, Pin, Trash2, LogIn, LogOut, Settings, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function DungeonCrawlerPage() {
  const { data: session, status } = useSession();
  const [isConnected, setIsConnected] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [streamedUI, setStreamedUI] = useState<ReactNode>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [focusMode, setFocusMode] = useState<FocusType | null>(null);

  const {
    gameState,
    setGameState,
    notifications,
    removeNotification,
    clearNotifications,
    getPinnedTypes,
    pinnedTypes,
  } = useGridStore();

  // Check for stored API key when session changes
  useEffect(() => {
    if (session?.user?.id) {
      const key = getStoredApiKey(session.user.id);
      setHasApiKey(!!key);
    }
  }, [session?.user?.id]);

  // Check backend connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      const connected = await healthCheck();
      setIsConnected(connected);
    };
    checkConnection();

    // Periodically check connection
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRetryConnection = useCallback(async () => {
    setIsLoading(true);
    const connected = await healthCheck();
    setIsConnected(connected);
    setIsLoading(false);
  }, []);

  // Handle focus mode
  const handleFocus = useCallback((focusType: FocusType) => {
    setFocusMode(focusType);
  }, []);

  const handleBackFromFocus = useCallback(() => {
    setFocusMode(null);
  }, []);

  // Handle button actions (no Phase 1 AI needed)
  const handleAction = useCallback(async (action: GameAction) => {
    // Clear focus mode when taking a game action
    setFocusMode(null);

    // Get API key from localStorage
    const apiKey = session?.user?.id ? getStoredApiKey(session.user.id) : null;
    if (!apiKey) {
      setStreamedUI(
        <div className="rounded-lg border border-yellow-600 bg-yellow-950/30 p-4">
          <p className="text-yellow-400">
            Please add your Anthropic API key in Settings to play.
          </p>
        </div>
      );
      setShowSettings(true);
      return;
    }

    setIsLoading(true);
    setStreamedUI(<ThinkingIndicator message={`${action.label}...`} />);

    try {
      const pinnedTypesArray = getPinnedTypes();
      const { uiNode, gameStateStream } = await executeAction(
        action.tool,
        action.args,
        action.label,
        pinnedTypesArray,
        apiKey
      );

      // Set the streamable UI node directly
      setStreamedUI(uiNode);

      // Stream the game state updates
      for await (const state of readStreamableValue(gameStateStream)) {
        if (state) {
          setGameState(state);
        }
      }

    } catch (error) {
      console.error("Action error:", error);

      // Check if it's a connection error
      const connected = await healthCheck();
      setIsConnected(connected);

      if (!connected) {
        setStreamedUI(<ConnectionError onRetry={handleRetryConnection} />);
      } else {
        setStreamedUI(
          <div className="rounded-lg border border-red-600 bg-red-950/30 p-4">
            <p className="text-red-400">
              Error: {error instanceof Error ? error.message : "An unexpected error occurred"}
            </p>
          </div>
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [getPinnedTypes, setGameState, handleRetryConnection, session?.user?.id]);

  // Legacy text command handler (kept for compatibility)
  const handleCommand = useCallback(async (command: string) => {
    if (!command.trim()) return;

    // Get API key from localStorage
    const apiKey = session?.user?.id ? getStoredApiKey(session.user.id) : null;
    if (!apiKey) {
      setStreamedUI(
        <div className="rounded-lg border border-yellow-600 bg-yellow-950/30 p-4">
          <p className="text-yellow-400">
            Please add your Anthropic API key in Settings to play.
          </p>
        </div>
      );
      setShowSettings(true);
      return;
    }

    setIsLoading(true);
    setStreamedUI(<ThinkingIndicator message="Processing..." />);

    try {
      const pinnedTypesArray = getPinnedTypes();
      const { uiNode, gameStateStream } = await submitCommand(
        command,
        [],
        pinnedTypesArray,
        apiKey
      );

      // Set the streamable UI node directly
      setStreamedUI(uiNode);

      // Stream the game state updates
      for await (const state of readStreamableValue(gameStateStream)) {
        if (state) {
          setGameState(state);
        }
      }

    } catch (error) {
      console.error("Command error:", error);

      // Check if it's a connection error
      const connected = await healthCheck();
      setIsConnected(connected);

      if (!connected) {
        setStreamedUI(<ConnectionError onRetry={handleRetryConnection} />);
      } else {
        setStreamedUI(
          <div className="rounded-lg border border-red-600 bg-red-950/30 p-4">
            <p className="text-red-400">
              Error: {error instanceof Error ? error.message : "An unexpected error occurred"}
            </p>
          </div>
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [getPinnedTypes, setGameState, handleRetryConnection, session?.user?.id]);

  // Pinned types as array for display
  const pinnedTypesArray = Array.from(pinnedTypes);

  // Loading state
  if (status === "loading") {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </main>
    );
  }

  // Not authenticated
  if (!session) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-screen">
          <div className="text-center space-y-8 max-w-md">
            <Swords className="h-20 w-20 mx-auto text-primary" />
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">Dungeon Crawler</h1>
              <p className="text-muted-foreground">
                An AI-powered text adventure game. Sign in with GitHub to start your adventure.
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => signIn("github")}
              className="gap-2"
            >
              <Github className="h-5 w-5" />
              Sign in with GitHub
            </Button>
            <p className="text-xs text-muted-foreground">
              We only use GitHub for authentication. Your game data and API key
              are stored locally in your browser.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Swords className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Dungeon Crawler</h1>
              {gameState?.character && (
                <Badge variant="secondary" className="gap-1">
                  {gameState.character.name} - HP: {gameState.character.hp}/{gameState.character.maxHp}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Connection indicator */}
              <div className="flex items-center gap-2 text-sm">
                <div
                  className={`h-2 w-2 rounded-full ${
                    isConnected ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <span className="text-muted-foreground">
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
              </div>

              {/* Pinned indicators */}
              {pinnedTypesArray.length > 0 && (
                <div className="flex items-center gap-1 ml-4">
                  <Pin className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {pinnedTypesArray.length} pinned
                  </span>
                </div>
              )}

              {/* Settings button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className={`ml-4 gap-1 ${!hasApiKey ? "text-yellow-500" : ""}`}
              >
                <Settings className="h-4 w-4" />
                {!hasApiKey && <span className="text-xs">Setup required</span>}
              </Button>

              {/* User info and sign out */}
              <div className="flex items-center gap-2 ml-2 border-l pl-4">
                <span className="text-sm text-muted-foreground">
                  {session.user?.name}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut()}
                  className="gap-1"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Settings Panel */}
        {showSettings && session.user?.id && (
          <SettingsPanel
            userId={session.user.id}
            onApiKeyChange={(hasKey) => setHasApiKey(hasKey)}
          />
        )}

        {/* Connection Error */}
        {!isConnected && (
          <ConnectionError onRetry={handleRetryConnection} />
        )}

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                Notifications
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearNotifications}
                className="h-6 text-xs"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
            <NotificationList
              notifications={notifications}
              onDismiss={removeNotification}
            />
          </div>
        )}

        {/* Game Content Area */}
        <div className="min-h-[400px]">
          {!hasApiKey ? (
            <div className="flex flex-col items-center justify-center h-[400px] text-center space-y-4">
              <Settings className="h-16 w-16 text-muted-foreground/30" />
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Setup Required</h2>
                <p className="text-muted-foreground max-w-md">
                  Add your Anthropic API key in Settings to start playing.
                  <br />
                  Your key is stored locally and never sent to our servers.
                </p>
              </div>
              <Button onClick={() => setShowSettings(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Open Settings
              </Button>
            </div>
          ) : focusMode && gameState ? (
            <FocusView
              focusType={focusMode}
              gameState={gameState}
              onBack={handleBackFromFocus}
            />
          ) : streamedUI ? (
            streamedUI
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px] text-center space-y-4">
              <Swords className="h-16 w-16 text-muted-foreground/30" />
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Welcome, Adventurer!</h2>
                <p className="text-muted-foreground max-w-md">
                  Click &quot;New Game&quot; below to begin your dungeon adventure.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm py-4 -mx-4 px-4 border-t">
          <ActionButtons
            gameState={gameState}
            onAction={handleAction}
            onFocus={handleFocus}
            disabled={isLoading || !isConnected || !hasApiKey}
          />
          {isLoading && (
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <span>The dungeon master is thinking...</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-4 mt-8">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
          <p>
            AI-powered Dungeon Crawler - Built with Next.js, Claude, and Go
          </p>
        </div>
      </footer>
    </main>
  );
}
