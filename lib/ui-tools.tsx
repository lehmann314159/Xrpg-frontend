import { z } from "zod";
import { tool } from "ai";
import {
  LayoutStyle,
  ComponentVariant,
  NarrativeMood,
  UIComponent,
  UIToolResult,
} from "./types";

// Schema for layout style
const layoutStyleSchema = z.enum(["standard", "focused", "cinematic", "dense"]);

// Schema for component variant
const variantSchema = z.enum(["standard", "dramatic", "compact", "atmospheric", "minimal"]);

// Schema for narrative mood
const moodSchema = z.enum(["neutral", "tense", "triumphant", "mysterious", "dangerous"]);

// Schema for notification urgency
const urgencySchema = z.enum(["low", "normal", "high", "critical"]);

// Schema for notification type
const notificationTypeSchema = z.enum(["info", "success", "warning", "error", "combat"]);

// ============== UI Tools (for Phase 2 UI generation) ==============

export const uiSetLayout = tool({
  description: "Set the overall layout style for the UI. Call this FIRST before rendering components.",
  parameters: z.object({
    style: layoutStyleSchema.describe("Layout style: standard (3-column balanced), focused (2-column for combat), cinematic (single centered for dramatic moments), dense (4-column for inventory management)"),
  }),
  execute: async ({ style }): Promise<UIToolResult> => {
    return {
      component: {
        type: "layout",
        style: style as LayoutStyle,
      },
    };
  },
});

export const uiRenderNotification = tool({
  description: "Render a notification message to the player. Use for game events, combat results, warnings, etc.",
  parameters: z.object({
    notificationType: notificationTypeSchema.describe("Type of notification: info, success, warning, error, combat"),
    title: z.string().describe("Short title for the notification"),
    message: z.string().describe("The notification message content"),
    urgency: urgencySchema.optional().describe("Urgency level affects visual prominence"),
    variant: variantSchema.optional().describe("Visual variant: standard, dramatic (for important events), compact"),
  }),
  execute: async ({ notificationType, title, message, urgency, variant }): Promise<UIToolResult> => {
    return {
      component: {
        type: "notification",
        variant: (variant || "standard") as ComponentVariant,
        urgency: urgency || "normal",
        data: { notificationType, title, message },
      },
    };
  },
});

export const uiRenderRoom = tool({
  description: "Render the current room description. Shows room name, description, and available exits.",
  parameters: z.object({
    variant: variantSchema.optional().describe("Visual variant: standard (normal), atmospheric (mysterious/exploration), compact (minimal info)"),
    emphasis: z.boolean().optional().describe("Whether to emphasize this component (larger, more prominent)"),
  }),
  execute: async ({ variant, emphasis }): Promise<UIToolResult> => {
    return {
      component: {
        type: "room",
        variant: (variant || "standard") as ComponentVariant,
        emphasis: emphasis || false,
      },
    };
  },
});

export const uiRenderPlayer = tool({
  description: "Render player stats including HP, strength, dexterity, and status.",
  parameters: z.object({
    variant: variantSchema.optional().describe("Visual variant: standard, dramatic (emphasize HP when low), compact, minimal (just HP bar)"),
    emphasis: z.boolean().optional().describe("Whether to emphasize this component"),
  }),
  execute: async ({ variant, emphasis }): Promise<UIToolResult> => {
    return {
      component: {
        type: "player",
        variant: (variant || "standard") as ComponentVariant,
        emphasis: emphasis || false,
      },
    };
  },
});

export const uiRenderMonster = tool({
  description: "Render a monster card. Use for enemies in the current room.",
  parameters: z.object({
    monsterId: z.string().describe("ID of the monster to render (from gameState.monsters)"),
    variant: variantSchema.optional().describe("Visual variant: standard, dramatic (for bosses/strong enemies), compact (for multiple enemies)"),
    emphasis: z.boolean().optional().describe("Whether to emphasize this monster (e.g., for boss battles)"),
  }),
  execute: async ({ monsterId, variant, emphasis }): Promise<UIToolResult> => {
    return {
      component: {
        type: "monster",
        variant: (variant || "standard") as ComponentVariant,
        emphasis: emphasis || false,
        data: { monsterId },
      },
    };
  },
});

export const uiRenderItem = tool({
  description: "Render an item card. Use for items in the room or inventory highlights.",
  parameters: z.object({
    itemId: z.string().describe("ID of the item to render"),
    location: z.enum(["room", "inventory"]).describe("Where the item is located"),
    variant: variantSchema.optional().describe("Visual variant: standard, dramatic (for rare/important items), compact"),
    emphasis: z.boolean().optional().describe("Whether to emphasize this item"),
  }),
  execute: async ({ itemId, location, variant, emphasis }): Promise<UIToolResult> => {
    return {
      component: {
        type: "item",
        variant: (variant || "standard") as ComponentVariant,
        emphasis: emphasis || false,
        data: { itemId, location },
      },
    };
  },
});

export const uiRenderMap = tool({
  description: "Render the dungeon map showing explored areas and current position.",
  parameters: z.object({
    variant: variantSchema.optional().describe("Visual variant: standard (full map with legend), minimal (compact map only)"),
  }),
  execute: async ({ variant }): Promise<UIToolResult> => {
    return {
      component: {
        type: "map",
        variant: (variant || "standard") as ComponentVariant,
      },
    };
  },
});

export const uiRenderEquipment = tool({
  description: "Render the equipment panel showing equipped weapon and armor.",
  parameters: z.object({
    variant: variantSchema.optional().describe("Visual variant: standard (full details), compact (icons only)"),
  }),
  execute: async ({ variant }): Promise<UIToolResult> => {
    return {
      component: {
        type: "equipment",
        variant: (variant || "standard") as ComponentVariant,
      },
    };
  },
});

export const uiRenderInventory = tool({
  description: "Render the inventory panel showing all items the player is carrying.",
  parameters: z.object({
    variant: variantSchema.optional().describe("Visual variant: standard (full item cards), compact (list view)"),
  }),
  execute: async ({ variant }): Promise<UIToolResult> => {
    return {
      component: {
        type: "inventory",
        variant: (variant || "standard") as ComponentVariant,
      },
    };
  },
});

export const uiRenderNarrative = tool({
  description: "Render custom dungeon master narrative text. Use for flavor, atmosphere, and storytelling.",
  parameters: z.object({
    text: z.string().describe("The narrative text to display"),
    mood: moodSchema.optional().describe("Mood affects styling: neutral, tense, triumphant, mysterious, dangerous"),
  }),
  execute: async ({ text, mood }): Promise<UIToolResult> => {
    return {
      component: {
        type: "narrative",
        mood: (mood || "neutral") as NarrativeMood,
        text,
      },
    };
  },
});

export const uiComplete = tool({
  description: "Signal that UI rendering is complete. Call this after rendering all desired components.",
  parameters: z.object({}),
  execute: async (): Promise<{ done: true }> => {
    return { done: true };
  },
});

// Export all UI tools
export const uiTools = {
  ui_set_layout: uiSetLayout,
  ui_render_notification: uiRenderNotification,
  ui_render_room: uiRenderRoom,
  ui_render_player: uiRenderPlayer,
  ui_render_monster: uiRenderMonster,
  ui_render_item: uiRenderItem,
  ui_render_map: uiRenderMap,
  ui_render_equipment: uiRenderEquipment,
  ui_render_inventory: uiRenderInventory,
  ui_render_narrative: uiRenderNarrative,
  ui_complete: uiComplete,
};

// UI System Prompt for Phase 2
export const UI_SYSTEM_PROMPT = `You are a dungeon master presenting game state to the player. Your role is to decide HOW to present the information visually.

## Layout Selection (call ui_set_layout FIRST)
- standard: Balanced 3-column grid for general exploration
- focused: 2-column layout for combat - monster front and center
- cinematic: Single centered column for major story moments (boss room entry, victory, death, dramatic discoveries)
- dense: 4-column compact grid for inventory management and detailed inspection

## Variant Selection Guidelines
- dramatic: Use for danger, bosses, critical HP (<30%), important discoveries, rare items
- atmospheric: Use for mystery, new unexplored areas, exploration moments
- compact: Use for secondary info, when showing multiple items/enemies, pinned components
- minimal: Use for pinned components that should stay in background

## Rules
1. ALWAYS call ui_set_layout FIRST to set the layout style
2. Only render contextually relevant components - NOT everything
3. Always include pinned components (use minimal variant for these)
4. Use ui_render_narrative for custom flavor text and dungeon master commentary
5. Maximum 6 components per response (excluding layout)
6. Call ui_complete when done

## Context-Based Decisions
- Combat: Use focused layout, emphasize monster, show player HP prominently
- Low HP (<30%): Use dramatic variant for player, add warning notification
- Boss/Strong enemy: Use cinematic layout, dramatic monster variant with emphasis
- New room exploration: Atmospheric room variant, standard layout
- Finding items: Highlight the item with emphasis, use standard layout
- Victory/Death: Cinematic layout, triumphant/dangerous narrative
- Inventory check: Dense layout, show all items compactly

## Example Scenarios

Boss encounter (player at 30% HP):
1. ui_set_layout({ style: "cinematic" })
2. ui_render_notification({ notificationType: "warning", title: "Danger!", message: "...", urgency: "critical" })
3. ui_render_room({ variant: "atmospheric" })
4. ui_render_monster({ monsterId: "...", variant: "dramatic", emphasis: true })
5. ui_render_player({ variant: "dramatic" })
6. ui_complete()

Routine exploration:
1. ui_set_layout({ style: "standard" })
2. ui_render_room({ variant: "standard" })
3. ui_render_player({ variant: "minimal" })
4. ui_render_map({ variant: "minimal" })
5. ui_complete()`;
