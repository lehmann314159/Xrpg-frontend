"use server";

import { createStreamableUI, createStreamableValue, StreamableValue } from "ai/rsc";
import { streamText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { allTools, extractGameState } from "@/lib/tools";
import { GameStateSnapshot, ComponentType } from "@/lib/types";
import React from "react";

// Import components for server rendering
import { DungeonMap } from "@/components/game/DungeonMap";
import { PlayerStats } from "@/components/game/PlayerStats";
import { MonsterCard } from "@/components/game/MonsterCard";
import { ItemCard } from "@/components/game/ItemCard";
import { EquipmentPanel } from "@/components/game/EquipmentPanel";
import { RoomDescription } from "@/components/game/RoomDescription";
import { Notification } from "@/components/game/Notification";
import { ThinkingIndicator } from "@/components/game/ThinkingIndicator";
import { InventoryPanel } from "@/components/game/InventoryPanel";

const SYSTEM_PROMPT = `You are a command interpreter for a dungeon crawler game. Parse user commands and call the appropriate tool. Do NOT add any narrative or description - just call tools silently.

## Tools
- mcp_new_game: "new game", "start", "begin" (extract character name or use "Hero")
- mcp_look: "look", "examine", "l"
- mcp_move: "go/move north/south/east/west", "n/s/e/w"
- mcp_attack: "attack [monster]" (use monster ID from gameState.monsters)
- mcp_take: "take/pick up [item]" (use item ID from gameState.roomItems)
- mcp_use: "use/drink [item]" (use item ID from gameState.inventory)
- mcp_equip: "equip/wear [item]" (use item ID from gameState.inventory)
- mcp_inventory: "inventory", "i"
- mcp_stats: "stats", "status"
- mcp_map: "map", "m"

## Rules
1. Call the appropriate tool based on the command
2. Use exact IDs from gameState for monsters/items
3. Do NOT output any text - just call tools
4. If command is unclear, call mcp_look`;

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface StreamResult {
  uiNode: React.ReactNode;
  textStream: StreamableValue<string>;
  gameStateStream: StreamableValue<GameStateSnapshot | null>;
}

export async function submitCommand(
  command: string,
  conversationHistory: Message[],
  pinnedTypes: ComponentType[],
  apiKey: string
): Promise<StreamResult> {
  // Validate API key format
  if (!apiKey || !apiKey.startsWith("sk-")) {
    throw new Error("Invalid API key format");
  }

  // Create Anthropic client with user's API key
  const anthropic = createAnthropic({
    apiKey: apiKey,
  });

  const ui = createStreamableUI(<ThinkingIndicator />);
  const textStream = createStreamableValue("");
  const gameStateStream = createStreamableValue<GameStateSnapshot | null>(null);

  // Run the async streaming logic
  (async () => {
    let currentGameState: GameStateSnapshot | null = null;

    try {
      // Minimal message - just the command
      const messages = [
        {
          role: "user" as const,
          content: command,
        },
      ];

      const result = streamText({
        model: anthropic("claude-sonnet-4-20250514"),
        system: SYSTEM_PROMPT,
        messages,
        tools: allTools,
        maxSteps: 3,
        maxTokens: 200,
        onStepFinish: async (step) => {
          // Process tool results
          if (step.toolResults) {
            for (const toolResult of step.toolResults) {
              const gameState = extractGameState(toolResult.result);
              if (gameState) {
                currentGameState = gameState;
                gameStateStream.update(gameState);
                ui.update(renderGameStateUI(gameState, pinnedTypes));
              }
            }
          }
        },
      });

      // Consume the stream (required) but don't use the text
      for await (const _ of result.textStream) {
        // Discard text output
      }

      // Final UI update
      if (currentGameState) {
        ui.done(renderGameStateUI(currentGameState, pinnedTypes));
      } else {
        ui.done(
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Command not understood. Try: look, go north, attack, take, inventory, stats, map</p>
          </div>
        );
      }

      textStream.done();
      gameStateStream.done();
    } catch (error) {
      console.error("Stream error:", error);
      ui.done(
        <div className="rounded-lg border border-red-600 bg-red-950/30 p-4">
          <p className="text-red-400">
            Error: {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </div>
      );
      textStream.done();
      gameStateStream.done();
    }
  })();

  // Return the streamable UI value (React node) and streams
  return {
    uiNode: ui.value,
    textStream: textStream.value,
    gameStateStream: gameStateStream.value
  };
}

// Helper function to render UI components from game state
function renderGameStateUI(
  gameState: GameStateSnapshot,
  pinnedTypes: ComponentType[]
): React.ReactNode {
  const components: React.ReactNode[] = [];

  // Add notification for game messages
  if (gameState.message) {
    components.push(
      <Notification
        key="message"
        notification={{
          id: "game-message",
          type: determineNotificationType(gameState.message),
          title: "Game Event",
          message: gameState.message,
          timestamp: Date.now(),
        }}
      />
    );
  }

  // Victory/Death states
  if (gameState.victory) {
    components.push(
      <Notification
        key="victory"
        notification={{
          id: "victory",
          type: "success",
          title: "Victory!",
          message: "You have escaped the dungeon! Congratulations, brave adventurer!",
          timestamp: Date.now(),
        }}
      />
    );
  } else if (gameState.gameOver) {
    components.push(
      <Notification
        key="game-over"
        notification={{
          id: "game-over",
          type: "error",
          title: "Game Over",
          message: "You have died. Use 'new game' to try again.",
          timestamp: Date.now(),
        }}
      />
    );
  }

  // Map (if pinned or has data)
  if (
    gameState.mapGrid &&
    (pinnedTypes.includes("dungeonMap") || gameState.mapGrid.length > 0)
  ) {
    components.push(
      <div key="map" className="rounded-lg border bg-card p-4">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
          Dungeon Map
        </h3>
        <DungeonMap mapGrid={gameState.mapGrid} />
      </div>
    );
  }

  // Player stats (if pinned or has data)
  if (gameState.character && (pinnedTypes.includes("playerStats") || true)) {
    components.push(
      <div key="stats" className="rounded-lg border bg-card p-4">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
          Character
        </h3>
        <PlayerStats character={gameState.character} />
      </div>
    );
  }

  // Room description
  if (gameState.currentRoom) {
    components.push(
      <div key="room" className="rounded-lg border bg-card p-4">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
          Current Location
        </h3>
        <RoomDescription room={gameState.currentRoom} />
      </div>
    );
  }

  // Equipment (if pinned or has data)
  if (
    gameState.equipment &&
    (pinnedTypes.includes("equipmentPanel") ||
      gameState.equipment.weapon ||
      gameState.equipment.armor)
  ) {
    components.push(
      <div key="equipment" className="rounded-lg border bg-card p-4">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
          Equipment
        </h3>
        <EquipmentPanel equipment={gameState.equipment} />
      </div>
    );
  }

  // Monsters in room
  if (gameState.monsters && gameState.monsters.length > 0) {
    gameState.monsters.forEach((monster) => {
      components.push(
        <div key={`monster-${monster.id}`} className="rounded-lg border border-red-600/30 bg-card p-4">
          <h3 className="text-xs font-medium text-red-400 uppercase tracking-wide mb-3">
            Enemy
          </h3>
          <MonsterCard monster={monster} />
        </div>
      );
    });
  }

  // Items in room
  if (gameState.roomItems && gameState.roomItems.length > 0) {
    gameState.roomItems.forEach((item) => {
      components.push(
        <div key={`item-${item.id}`} className="rounded-lg border border-yellow-600/30 bg-card p-4">
          <h3 className="text-xs font-medium text-yellow-400 uppercase tracking-wide mb-3">
            Item
          </h3>
          <ItemCard item={item} location="room" />
        </div>
      );
    });
  }

  // Inventory (always show if has items, or if pinned)
  if (gameState.inventory && gameState.inventory.length > 0) {
    components.push(
      <div key="inventory" className="rounded-lg border bg-card p-4">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
          Inventory
        </h3>
        <InventoryPanel items={gameState.inventory} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {components}
    </div>
  );
}

function determineNotificationType(message: string): "info" | "success" | "warning" | "error" | "combat" {
  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes("attack") || lowerMessage.includes("damage") || lowerMessage.includes("combat")) {
    return "combat";
  }
  if (lowerMessage.includes("victory") || lowerMessage.includes("escaped") || lowerMessage.includes("defeated")) {
    return "success";
  }
  if (lowerMessage.includes("dead") || lowerMessage.includes("died") || lowerMessage.includes("killed")) {
    return "error";
  }
  if (lowerMessage.includes("danger") || lowerMessage.includes("warning") || lowerMessage.includes("careful")) {
    return "warning";
  }
  return "info";
}
