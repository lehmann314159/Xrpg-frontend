import { z } from "zod";
import { tool } from "ai";
import * as mcpClient from "./mcp-client";
import {
  GameStateSnapshot,
  MapCell,
  CharacterView,
  MonsterView,
  ItemView,
  EquipmentView,
  RoomView,
  NotificationType,
} from "./types";

// ============== MCP Tools (call Go backend) ==============

export const mcpNewGame = tool({
  description: "Start a new game with a character. Use this when the player wants to begin a new adventure.",
  parameters: z.object({
    character_name: z.string().describe("Name of the character to create"),
  }),
  execute: async ({ character_name }) => {
    const result = await mcpClient.newGame(character_name);
    return {
      text: result.content[0]?.text || "Game started",
      gameState: result.gameState,
      isError: result.isError,
    };
  },
});

export const mcpLook = tool({
  description: "Look around the current room to see exits, monsters, items, and other details. Use this when the player wants to examine their surroundings.",
  parameters: z.object({}),
  execute: async () => {
    const result = await mcpClient.look();
    return {
      text: result.content[0]?.text || "You look around.",
      gameState: result.gameState,
      isError: result.isError,
    };
  },
});

export const mcpMove = tool({
  description: "Move the character in a direction. Valid directions are: north, south, east, west.",
  parameters: z.object({
    direction: z.enum(["north", "south", "east", "west"]).describe("Direction to move"),
  }),
  execute: async ({ direction }) => {
    const result = await mcpClient.move(direction);
    return {
      text: result.content[0]?.text || `You move ${direction}.`,
      gameState: result.gameState,
      isError: result.isError,
    };
  },
});

export const mcpAttack = tool({
  description: "Attack a monster in the current room. Requires the monster's ID from the game state.",
  parameters: z.object({
    target_id: z.string().describe("ID of the monster to attack (from gameState.monsters)"),
  }),
  execute: async ({ target_id }) => {
    const result = await mcpClient.attack(target_id);
    return {
      text: result.content[0]?.text || "You attack!",
      gameState: result.gameState,
      isError: result.isError,
    };
  },
});

export const mcpTake = tool({
  description: "Pick up an item from the current room. Requires the item's ID from the game state.",
  parameters: z.object({
    item_id: z.string().describe("ID of the item to pick up (from gameState.roomItems)"),
  }),
  execute: async ({ item_id }) => {
    const result = await mcpClient.take(item_id);
    return {
      text: result.content[0]?.text || "You pick up the item.",
      gameState: result.gameState,
      isError: result.isError,
    };
  },
});

export const mcpUse = tool({
  description: "Use a consumable item from inventory. Requires the item's ID.",
  parameters: z.object({
    item_id: z.string().describe("ID of the item to use (from gameState.inventory)"),
  }),
  execute: async ({ item_id }) => {
    const result = await mcpClient.use(item_id);
    return {
      text: result.content[0]?.text || "You use the item.",
      gameState: result.gameState,
      isError: result.isError,
    };
  },
});

export const mcpEquip = tool({
  description: "Equip a weapon or armor from inventory. Requires the item's ID.",
  parameters: z.object({
    item_id: z.string().describe("ID of the weapon or armor to equip (from gameState.inventory)"),
  }),
  execute: async ({ item_id }) => {
    const result = await mcpClient.equip(item_id);
    return {
      text: result.content[0]?.text || "You equip the item.",
      gameState: result.gameState,
      isError: result.isError,
    };
  },
});

export const mcpInventory = tool({
  description: "View the character's current inventory.",
  parameters: z.object({}),
  execute: async () => {
    const result = await mcpClient.inventory();
    return {
      text: result.content[0]?.text || "Checking inventory...",
      gameState: result.gameState,
      isError: result.isError,
    };
  },
});

export const mcpStats = tool({
  description: "View the character's stats including HP, strength, and dexterity.",
  parameters: z.object({}),
  execute: async () => {
    const result = await mcpClient.stats();
    return {
      text: result.content[0]?.text || "Checking stats...",
      gameState: result.gameState,
      isError: result.isError,
    };
  },
});

export const mcpMap = tool({
  description: "View the dungeon map showing explored areas.",
  parameters: z.object({}),
  execute: async () => {
    const result = await mcpClient.map();
    return {
      text: result.content[0]?.text || "Viewing map...",
      gameState: result.gameState,
      isError: result.isError,
    };
  },
});

// ============== UI Render Tools (for streamUI) ==============

// Schema definitions for UI tools
const mapCellSchema = z.object({
  x: z.number(),
  y: z.number(),
  roomId: z.string().optional(),
  status: z.enum(["unknown", "visited", "current", "adjacent", "exit"]),
  hasPlayer: z.boolean(),
  exits: z.array(z.string()).optional(),
});

const characterViewSchema = z.object({
  id: z.string(),
  name: z.string(),
  hp: z.number(),
  maxHp: z.number(),
  strength: z.number(),
  dexterity: z.number(),
  isAlive: z.boolean(),
  status: z.enum(["Healthy", "Wounded", "Critical", "Dead"]),
});

const monsterViewSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  hp: z.number(),
  maxHp: z.number(),
  damage: z.number(),
});

const itemViewSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: z.enum(["weapon", "armor", "consumable", "key", "treasure"]),
  damage: z.number().optional(),
  armor: z.number().optional(),
  healing: z.number().optional(),
  isEquipped: z.boolean(),
});

const equipmentViewSchema = z.object({
  weapon: itemViewSchema.optional(),
  armor: itemViewSchema.optional(),
});

const roomViewSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  isEntrance: z.boolean(),
  isExit: z.boolean(),
  x: z.number(),
  y: z.number(),
  exits: z.array(z.string()),
});

// Export schemas for use in actions.tsx
export const uiSchemas = {
  mapCell: mapCellSchema,
  characterView: characterViewSchema,
  monsterView: monsterViewSchema,
  itemView: itemViewSchema,
  equipmentView: equipmentViewSchema,
  roomView: roomViewSchema,
};

// All tools combined for streamUI
export const allTools = {
  mcp_new_game: mcpNewGame,
  mcp_look: mcpLook,
  mcp_move: mcpMove,
  mcp_attack: mcpAttack,
  mcp_take: mcpTake,
  mcp_use: mcpUse,
  mcp_equip: mcpEquip,
  mcp_inventory: mcpInventory,
  mcp_stats: mcpStats,
  mcp_map: mcpMap,
};

// Helper to extract game state from tool result
export function extractGameState(toolResult: unknown): GameStateSnapshot | null {
  if (
    toolResult &&
    typeof toolResult === "object" &&
    "gameState" in toolResult
  ) {
    return (toolResult as { gameState: GameStateSnapshot }).gameState || null;
  }
  return null;
}

// Helper to extract text from tool result
export function extractText(toolResult: unknown): string {
  if (toolResult && typeof toolResult === "object" && "text" in toolResult) {
    return (toolResult as { text: string }).text || "";
  }
  return "";
}
