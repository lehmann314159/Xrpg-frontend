// TypeScript interfaces mirroring Go backend types

export interface CharacterView {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  strength: number;
  dexterity: number;
  isAlive: boolean;
  status: "Healthy" | "Wounded" | "Critical" | "Dead";
}

export interface RoomView {
  id: string;
  name: string;
  description: string;
  isEntrance: boolean;
  isExit: boolean;
  x: number;
  y: number;
  exits: string[];
}

export interface MonsterView {
  id: string;
  name: string;
  description: string;
  hp: number;
  maxHp: number;
  damage: number;
}

export interface ItemView {
  id: string;
  name: string;
  description: string;
  type: "weapon" | "armor" | "consumable" | "key" | "treasure";
  damage?: number;
  armor?: number;
  healing?: number;
  isEquipped: boolean;
}

export interface EquipmentView {
  weapon?: ItemView;
  armor?: ItemView;
}

export interface MapCell {
  x: number;
  y: number;
  roomId?: string;
  status: "unknown" | "visited" | "current" | "adjacent" | "exit";
  hasPlayer: boolean;
  exits?: string[];
}

export interface GameStateSnapshot {
  character?: CharacterView;
  currentRoom?: RoomView;
  monsters?: MonsterView[];
  roomItems?: ItemView[];
  inventory?: ItemView[];
  equipment?: EquipmentView;
  mapGrid?: MapCell[][];
  gameOver: boolean;
  victory: boolean;
  turnNumber: number;
  message?: string;
}

// MCP Tool Result from backend
export interface ToolResult {
  content: ContentBlock[];
  isError?: boolean;
  gameState?: GameStateSnapshot;
}

export interface ContentBlock {
  type: string;
  text?: string;
}

// UI Component Types
export type NotificationType = "info" | "success" | "warning" | "error" | "combat";

export interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
}

// Grid/Layout Types
export type ComponentType =
  | "dungeonMap"
  | "playerStats"
  | "monsterCard"
  | "itemCard"
  | "equipmentPanel"
  | "roomDescription"
  | "notification"
  | "inventory";

export interface GridTile {
  id: string;
  componentType: ComponentType;
  position: number; // Grid position index
  isPinned: boolean;
  data?: unknown;
}

// Conversation Types for AI
export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

// MCP Tool definitions for AI
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

// Generative UI Types

export type LayoutStyle = "standard" | "focused" | "cinematic" | "dense";

export type ComponentVariant = "standard" | "dramatic" | "compact" | "atmospheric" | "minimal";

export type NarrativeMood = "neutral" | "tense" | "triumphant" | "mysterious" | "dangerous";

// Summarized game context for Phase 2 UI generation (token-optimized)
export interface UIContext {
  hp: number;
  maxHp: number;
  isInDanger: boolean;
  roomName: string;
  roomIsExit: boolean;
  monsterCount: number;
  hasStrongMonster: boolean;
  itemCount: number;
  lastAction: string;
  actionWasCombat: boolean;
  message: string;
  isVictory: boolean;
  isGameOver: boolean;
  pinnedTypes: ComponentType[];
}

// UI component that has been rendered by AI
export interface UIComponent {
  type: "layout" | "notification" | "room" | "player" | "monster" | "item" | "map" | "equipment" | "inventory" | "narrative";
  variant?: ComponentVariant;
  mood?: NarrativeMood;
  emphasis?: boolean;
  urgency?: "low" | "normal" | "high" | "critical";
  data?: unknown;
  text?: string;
  style?: LayoutStyle;
}

// Result from UI tool execution
export interface UIToolResult {
  component: UIComponent;
}
