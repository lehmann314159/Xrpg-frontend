"use server";

import { createStreamableUI, createStreamableValue, StreamableValue } from "ai/rsc";
import { generateText, streamText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { allTools, extractGameState } from "@/lib/tools";
import { uiTools, UI_SYSTEM_PROMPT } from "@/lib/ui-tools";
import {
  GameStateSnapshot,
  ComponentType,
  UIComponent,
  UIContext,
  LayoutStyle,
  ComponentVariant,
  NarrativeMood,
  ThreatLevel,
  ItemRarity
} from "@/lib/types";
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
import { GameLayout } from "@/components/game/GameLayout";
import { NarrativeText } from "@/components/game/NarrativeText";

// Phase 1: Command interpretation system prompt
const COMMAND_SYSTEM_PROMPT = `You are a command interpreter for a dungeon crawler game. Parse user commands and call the appropriate tool. Do NOT add any narrative or description - just call tools silently.

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

// Summarize game state for Phase 2 UI generation (token optimization)
function summarizeForUI(
  gameState: GameStateSnapshot,
  command: string,
  pinnedTypes: ComponentType[]
): UIContext {
  const hp = gameState.character?.hp ?? 0;
  const maxHp = gameState.character?.maxHp ?? 1;
  const hpPercentage = (hp / maxHp) * 100;

  // Get max threat level from monsters
  const threatOrder: ThreatLevel[] = ["trivial", "normal", "dangerous", "deadly"];
  const maxThreat = gameState.monsters?.reduce<ThreatLevel | undefined>((max, m) => {
    if (!m.threat) return max;
    if (!max) return m.threat;
    return threatOrder.indexOf(m.threat) > threatOrder.indexOf(max) ? m.threat : max;
  }, undefined);

  // Get highest rarity from items in room
  const rarityOrder: ItemRarity[] = ["common", "uncommon", "rare", "legendary"];
  const allItems = [...(gameState.roomItems ?? []), ...(gameState.inventory ?? [])];
  const highestRarity = allItems.reduce<ItemRarity | undefined>((max, item) => {
    if (!item.rarity) return max;
    if (!max) return item.rarity;
    return rarityOrder.indexOf(item.rarity) > rarityOrder.indexOf(max) ? item.rarity : max;
  }, undefined);

  // Check for new items this turn
  const newItemsThisTurn = gameState.roomItems?.some(i => i.isNew) ||
    (gameState.inventoryDelta?.added?.length ?? 0) > 0;

  // Check if any monsters were defeated this turn
  const monstersDefeatedThisTurn = gameState.combatResult?.enemyDefeated ?? false;

  return {
    // Player state
    hp,
    maxHp,
    isInDanger: hpPercentage <= 30,
    playerStatus: gameState.character?.status ?? "Healthy",

    // Room state
    roomName: gameState.currentRoom?.name ?? "Unknown",
    roomIsExit: gameState.currentRoom?.isExit ?? false,
    roomAtmosphere: gameState.currentRoom?.atmosphere,
    isFirstVisit: gameState.currentRoom?.isFirstVisit,

    // Monsters
    monsterCount: gameState.monsters?.length ?? 0,
    maxThreat,
    monstersDefeatedThisTurn,

    // Items
    roomItemCount: gameState.roomItems?.length ?? 0,
    inventoryCount: gameState.inventory?.length ?? 0,
    newItemsThisTurn: newItemsThisTurn ?? false,
    highestRarity,

    // Action context
    lastAction: command,
    event: gameState.event,
    combatResult: gameState.combatResult,

    // Game context
    gamePhase: gameState.context?.phase,
    consecutiveCombat: gameState.context?.consecutiveCombat ?? 0,
    explorationPct: gameState.context?.explorationPct ?? 0,

    // Status
    message: gameState.message ?? "",
    isVictory: gameState.victory,
    isGameOver: gameState.gameOver,
    pinnedTypes,
  };
}

// Extract UI components from Phase 2 tool results
function extractUIComponents(toolResults: unknown[]): UIComponent[] {
  const components: UIComponent[] = [];

  for (const result of toolResults) {
    if (result && typeof result === "object" && "component" in result) {
      components.push((result as { component: UIComponent }).component);
    }
  }

  return components;
}

// Render UI from AI-selected components
function renderUIFromComponents(
  components: UIComponent[],
  gameState: GameStateSnapshot
): React.ReactNode {
  // Find layout style (default to standard)
  const layoutComponent = components.find(c => c.type === "layout");
  const layoutStyle: LayoutStyle = layoutComponent?.style ?? "standard";

  // Filter out layout and render other components
  const renderableComponents = components.filter(c => c.type !== "layout");
  const renderedNodes: React.ReactNode[] = [];

  for (const comp of renderableComponents) {
    const key = `${comp.type}-${renderedNodes.length}`;
    const variant = comp.variant as ComponentVariant | undefined;

    switch (comp.type) {
      case "notification": {
        const data = comp.data as { notificationType: string; title: string; message: string } | undefined;
        if (data) {
          renderedNodes.push(
            <Notification
              key={key}
              variant={variant}
              notification={{
                id: key,
                type: data.notificationType as "info" | "success" | "warning" | "error" | "combat",
                title: data.title,
                message: data.message,
                timestamp: Date.now(),
              }}
            />
          );
        }
        break;
      }

      case "room": {
        if (gameState.currentRoom) {
          renderedNodes.push(
            <div key={key} className="rounded-lg border bg-card p-4">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Current Location
              </h3>
              <RoomDescription room={gameState.currentRoom} variant={variant} />
            </div>
          );
        }
        break;
      }

      case "player": {
        if (gameState.character) {
          renderedNodes.push(
            <div key={key} className="rounded-lg border bg-card p-4">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Character
              </h3>
              <PlayerStats character={gameState.character} variant={variant} />
            </div>
          );
        }
        break;
      }

      case "monster": {
        const data = comp.data as { monsterId: string } | undefined;
        const monster = gameState.monsters?.find(m => m.id === data?.monsterId);
        if (monster) {
          renderedNodes.push(
            <div key={key} className="rounded-lg border border-red-600/30 bg-card p-4">
              <h3 className="text-xs font-medium text-red-400 uppercase tracking-wide mb-3">
                Enemy
              </h3>
              <MonsterCard monster={monster} variant={variant} />
            </div>
          );
        }
        break;
      }

      case "item": {
        const data = comp.data as { itemId: string; location: "room" | "inventory" } | undefined;
        let item = gameState.roomItems?.find(i => i.id === data?.itemId);
        if (!item) {
          item = gameState.inventory?.find(i => i.id === data?.itemId);
        }
        if (item && data) {
          renderedNodes.push(
            <div key={key} className="rounded-lg border border-yellow-600/30 bg-card p-4">
              <h3 className="text-xs font-medium text-yellow-400 uppercase tracking-wide mb-3">
                Item
              </h3>
              <ItemCard item={item} location={data.location} variant={variant} />
            </div>
          );
        }
        break;
      }

      case "map": {
        if (gameState.mapGrid) {
          renderedNodes.push(
            <div key={key} className="rounded-lg border bg-card p-4">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Dungeon Map
              </h3>
              <DungeonMap mapGrid={gameState.mapGrid} variant={variant} />
            </div>
          );
        }
        break;
      }

      case "equipment": {
        if (gameState.equipment) {
          renderedNodes.push(
            <div key={key} className="rounded-lg border bg-card p-4">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Equipment
              </h3>
              <EquipmentPanel equipment={gameState.equipment} variant={variant} />
            </div>
          );
        }
        break;
      }

      case "inventory": {
        if (gameState.inventory && gameState.inventory.length > 0) {
          renderedNodes.push(
            <div key={key} className="rounded-lg border bg-card p-4">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Inventory
              </h3>
              <InventoryPanel items={gameState.inventory} variant={variant} />
            </div>
          );
        }
        break;
      }

      case "narrative": {
        if (comp.text) {
          renderedNodes.push(
            <NarrativeText
              key={key}
              text={comp.text}
              mood={comp.mood as NarrativeMood | undefined}
            />
          );
        }
        break;
      }
    }
  }

  return (
    <GameLayout style={layoutStyle}>
      {renderedNodes}
    </GameLayout>
  );
}

// Fallback UI rendering when Phase 2 fails or returns no components
function renderFallbackUI(
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

  // Player stats
  if (gameState.character) {
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

  // Inventory
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
      // ============================================
      // PHASE 1: Execute game command via MCP tools
      // ============================================
      const messages = [
        {
          role: "user" as const,
          content: command,
        },
      ];

      const phase1Result = streamText({
        model: anthropic("claude-sonnet-4-20250514"),
        system: COMMAND_SYSTEM_PROMPT,
        messages,
        tools: allTools,
        maxSteps: 3,
        maxTokens: 200,
        onStepFinish: async (step) => {
          // Process tool results to get game state
          if (step.toolResults) {
            for (const toolResult of step.toolResults) {
              const gameState = extractGameState(toolResult.result);
              if (gameState) {
                currentGameState = gameState;
                gameStateStream.update(gameState);
                // Show intermediate fallback UI during Phase 1
                ui.update(renderFallbackUI(gameState, pinnedTypes));
              }
            }
          }
        },
      });

      // Consume Phase 1 stream
      for await (const _ of phase1Result.textStream) {
        // Discard text output
      }

      // If no game state from Phase 1, show error
      if (!currentGameState) {
        ui.done(
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Command not understood. Try: look, go north, attack, take, inventory, stats, map</p>
          </div>
        );
        textStream.done();
        gameStateStream.done();
        return;
      }

      // Store game state in a const for Phase 2 (helps TypeScript narrowing)
      const gameStateForPhase2: GameStateSnapshot = currentGameState;

      // ============================================
      // PHASE 2: AI-driven UI generation
      // ============================================
      try {
        // Create summarized context for UI generation
        const uiContext = summarizeForUI(gameStateForPhase2, command, pinnedTypes);

        // Build context message for Phase 2
        const contextMessage = `Game Context:
${JSON.stringify(uiContext, null, 2)}

Available Data:
- Room: ${gameStateForPhase2.currentRoom?.name ?? "none"}
- Monsters: ${gameStateForPhase2.monsters?.map(m => `${m.name} (id: ${m.id})`).join(", ") || "none"}
- Room Items: ${gameStateForPhase2.roomItems?.map(i => `${i.name} (id: ${i.id})`).join(", ") || "none"}
- Inventory: ${gameStateForPhase2.inventory?.map(i => `${i.name} (id: ${i.id})`).join(", ") || "none"}
- Has Map: ${!!gameStateForPhase2.mapGrid}
- Has Equipment: ${!!(gameStateForPhase2.equipment?.weapon || gameStateForPhase2.equipment?.armor)}

Decide how to present this game state to the player. Choose appropriate layout, variants, and which components to show.`;

        // Collect UI tool results
        const uiToolResults: unknown[] = [];

        const phase2Result = streamText({
          model: anthropic("claude-sonnet-4-20250514"),
          system: UI_SYSTEM_PROMPT,
          messages: [{ role: "user" as const, content: contextMessage }],
          tools: uiTools,
          maxSteps: 8, // Allow multiple tool calls
          maxTokens: 500,
          onStepFinish: async (step) => {
            if (step.toolResults) {
              for (const toolResult of step.toolResults) {
                uiToolResults.push(toolResult.result);
              }
            }
          },
        });

        // Consume Phase 2 stream
        for await (const _ of phase2Result.textStream) {
          // Discard text output
        }

        // Extract UI components and render
        const uiComponents = extractUIComponents(uiToolResults);

        if (uiComponents.length > 0) {
          ui.done(renderUIFromComponents(uiComponents, gameStateForPhase2));
        } else {
          // Fallback if no UI components generated
          ui.done(renderFallbackUI(gameStateForPhase2, pinnedTypes));
        }
      } catch (phase2Error) {
        // If Phase 2 fails, use fallback UI
        console.error("Phase 2 UI generation failed:", phase2Error);
        ui.done(renderFallbackUI(gameStateForPhase2, pinnedTypes));
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
