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

export const uiRenderCombatResult = tool({
  description: "Render combat results showing what happened in the last combat exchange. Shows player attack, enemy attack, damage dealt/received, criticals, and defeats. ALWAYS use this after combat actions.",
  parameters: z.object({
    variant: variantSchema.optional().describe("Visual variant: standard (full details), dramatic (emphasized for close calls), compact (minimal)"),
  }),
  execute: async ({ variant }): Promise<UIToolResult> => {
    return {
      component: {
        type: "combatResult",
        variant: (variant || "standard") as ComponentVariant,
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
  ui_render_combat_result: uiRenderCombatResult,
  ui_complete: uiComplete,
};

// UI System Prompt for Phase 2
export const UI_SYSTEM_PROMPT = `You are a dungeon master presenting game state to the player. Your role is to decide HOW to present the information visually based on the rich context provided.

## Layout Selection (call ui_set_layout FIRST)
- standard: Balanced 3-column grid for general exploration
- focused: 2-column layout for combat - monster front and center
- cinematic: Single centered column for major story moments (boss room entry, victory, death, dramatic discoveries)
- dense: 4-column compact grid for inventory management and detailed inspection

## Context Fields Reference

### Threat Levels (maxThreat)
- "trivial": Easy enemy, standard display
- "normal": Standard fight, standard display
- "dangerous": Use dramatic variant, warn player
- "deadly": Use cinematic layout, dramatic variant with emphasis, urgent warning

### Room Atmosphere (roomAtmosphere)
- "safe": Relaxed, standard variants
- "tense": Alert tone, standard layout
- "dangerous": Focused layout, dramatic player stats
- "mysterious": Atmospheric room variant, exploration feel
- "ominous": Atmospheric/dramatic variants, foreboding narrative

### Item Rarity (highestRarity)
- "common": Standard display
- "uncommon": Standard with slight emphasis
- "rare": Dramatic variant, emphasize the item
- "legendary": Cinematic layout, dramatic variant, celebratory narrative

### Game Phase (gamePhase)
- "early_game": Encourage exploration, helpful tone
- "mid_game": Balanced challenge, standard presentation
- "late_game": Tension building, atmospheric variants
- "exit": Victory imminent, triumphant narrative

### Combat Result (combatResult)
- combatResult.playerAttack.wasCritical: Celebrate with "CRITICAL HIT!" notification
- combatResult.enemyDefeated: Victory notification, triumphant mood
- combatResult.playerDied: Game over, cinematic layout, dangerous narrative
- combatResult.enemyAttack.wasHit: Show damage taken prominently

### Event Types (event.type / event.subtype)
- "combat" + "attack_critical": Dramatic combat notification
- "combat" + "enemy_defeated": Victory notification
- "discovery" + "item_found": Highlight new item
- "movement" + "room_enter": Show room description prominently
- "death" + "player_died": Game over sequence
- "victory" + "dungeon_escaped": Victory sequence

## Rules
1. ALWAYS call ui_set_layout FIRST
2. ALWAYS call ui_render_combat_result when combatResult is present - this shows attack details
3. Use ui_render_notification for important game messages
4. Match variant selection to threat/atmosphere/rarity when available
5. Use ui_render_narrative for flavor text matching the mood
6. Maximum 6 components per response (excluding layout)
7. Call ui_complete when done

## Decision Matrix

| Condition | Layout | Key Variants | Notification |
|-----------|--------|--------------|--------------|
| maxThreat = "deadly" | cinematic | monster: dramatic+emphasis | warning, critical urgency |
| maxThreat = "dangerous" | focused | monster: dramatic | warning, high urgency |
| roomAtmosphere = "ominous" | focused | room: atmospheric | - |
| isFirstVisit = true | standard | room: atmospheric | info about discovery |
| highestRarity = "legendary" | cinematic | item: dramatic+emphasis | success notification |
| highestRarity = "rare" | standard | item: dramatic | info notification |
| combatResult.enemyDefeated | focused | - | success: "Enemy defeated!" |
| combatResult.wasCritical | focused | - | combat: "CRITICAL HIT!" |
| isInDanger = true | focused | player: dramatic | warning about low HP |
| isVictory = true | cinematic | - | success, triumphant narrative |
| isGameOver = true | cinematic | - | error, dangerous narrative |
| consecutiveCombat >= 3 | focused | player: dramatic | warning about prolonged combat |

## Example: Combat with Critical Hit

Context: event.type="combat", combatResult.playerAttack.wasCritical=true, monstersDefeatedThisTurn=true

1. ui_set_layout({ style: "focused" })
2. ui_render_combat_result({ variant: "dramatic" })  // Shows attack details, damage, critical hit
3. ui_render_player({ variant: "standard" })
4. ui_render_room({ variant: "standard" })
5. ui_complete()

## Example: Combat (enemy still alive)

Context: event.type="combat", combatResult present, monsterCount > 0

1. ui_set_layout({ style: "focused" })
2. ui_render_combat_result({ variant: "standard" })  // Shows attack exchange
3. ui_render_monster({ monsterId: "...", variant: "standard" })
4. ui_render_player({ variant: "standard" })
5. ui_complete()

## Example: Entering Ominous Room with Deadly Enemy

Context: roomAtmosphere="ominous", isFirstVisit=true, maxThreat="deadly"

1. ui_set_layout({ style: "cinematic" })
2. ui_render_narrative({ text: "A chill runs down your spine as you enter...", mood: "dangerous" })
3. ui_render_room({ variant: "atmospheric", emphasis: true })
4. ui_render_monster({ monsterId: "...", variant: "dramatic", emphasis: true })
5. ui_render_player({ variant: "dramatic" })
6. ui_complete()

## Example: Finding Rare Item

Context: newItemsThisTurn=true, highestRarity="rare"

1. ui_set_layout({ style: "standard" })
2. ui_render_notification({ notificationType: "success", title: "Rare Find!", message: "[message]", urgency: "normal" })
3. ui_render_item({ itemId: "...", location: "room", variant: "dramatic", emphasis: true })
4. ui_render_room({ variant: "standard" })
5. ui_render_player({ variant: "minimal" })
6. ui_complete()`;
