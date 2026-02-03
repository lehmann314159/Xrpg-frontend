# Generative UI in the Dungeon Crawler

This document explains how the dungeon crawler uses Claude AI to dynamically generate its user interface based on game context.

## Overview

Traditional game UIs render fixed components in predetermined layouts. This app takes a different approach: **Claude decides what to show and how to show it** based on the current game state.

Instead of:
```
if (monsters.length > 0) showMonsterCard();
if (player.hp < 30) showWarning();
```

We ask Claude:
```
"Here's the game state. Decide which components to render,
what layout to use, and how to style them."
```

This creates a more dynamic, context-aware experience where the UI adapts to the narrative.

## Architecture

### Two-Phase Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      User Action                            │
│                    (clicks button)                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   Phase 1: Game Logic                       │
│                                                             │
│  • Direct MCP tool call to Go backend                       │
│  • Backend executes game action (move, attack, etc.)        │
│  • Returns updated GameStateSnapshot                        │
│                                                             │
│  (No AI needed - deterministic button → tool mapping)       │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  Phase 2: UI Generation                     │
│                                                             │
│  • Claude (Haiku) receives summarized game context          │
│  • Decides layout style (standard/focused/cinematic/dense)  │
│  • Chooses which components to render                       │
│  • Selects variants (standard/dramatic/atmospheric/etc.)    │
│  • Calls UI tools to build the interface                    │
│                                                             │
│  (AI-driven - Claude interprets context and makes choices)  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   React Components                          │
│                                                             │
│  • UI tool results converted to React nodes                 │
│  • Components rendered with chosen variants                 │
│  • Layout wrapper applies grid/flex styling                 │
└─────────────────────────────────────────────────────────────┘
```

### Why Two Phases?

**Phase 1** handles game logic. Originally this used Claude to interpret text commands, but we switched to deterministic button-based actions for cost efficiency. The backend MCP tools are called directly.

**Phase 2** is where the generative UI happens. Given the game state, Claude decides *how* to present it visually.

## UI Tools

Claude has access to these tools to build the interface:

| Tool | Purpose |
|------|---------|
| `ui_set_layout` | Choose layout style (must be called first) |
| `ui_render_notification` | Show game messages with urgency levels |
| `ui_render_room` | Display current room description |
| `ui_render_player` | Show character stats |
| `ui_render_monster` | Render enemy cards |
| `ui_render_item` | Display items (room or inventory) |
| `ui_render_map` | Show dungeon map |
| `ui_render_equipment` | Display equipped items |
| `ui_render_inventory` | Show inventory panel |
| `ui_render_combat_result` | Show what happened in combat |
| `ui_render_narrative` | Add atmospheric flavor text |
| `ui_complete` | Signal that UI generation is done |

### Layout Styles

```typescript
const layoutStyles = {
  standard: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
  focused: "grid grid-cols-1 lg:grid-cols-2 gap-4",
  cinematic: "flex flex-col items-center gap-4 max-w-2xl mx-auto",
  dense: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3",
};
```

- **Standard**: 3-column grid for general exploration
- **Focused**: 2-column for combat situations
- **Cinematic**: Single centered column for dramatic moments (boss fights, victory, death)
- **Dense**: 4-column compact grid for inventory management

### Component Variants

Each component supports multiple visual variants:

| Variant | Use Case |
|---------|----------|
| `standard` | Normal display |
| `dramatic` | Danger, bosses, critical moments |
| `atmospheric` | Mystery, exploration, new areas |
| `compact` | Secondary info, lists |
| `minimal` | Background/pinned components |

## Context Summarization

To minimize tokens sent to Claude, the full game state is summarized into a `UIContext` object:

```typescript
interface UIContext {
  // Player state
  hp: number;
  maxHp: number;
  isInDanger: boolean;        // HP <= 30%
  playerStatus: string;

  // Room state
  roomName: string;
  roomIsExit: boolean;
  roomAtmosphere?: "safe" | "tense" | "dangerous" | "mysterious" | "ominous";
  isFirstVisit?: boolean;

  // Threats
  monsterCount: number;
  maxThreat?: "trivial" | "normal" | "dangerous" | "deadly";
  monstersDefeatedThisTurn: boolean;

  // Items
  roomItemCount: number;
  inventoryCount: number;
  newItemsThisTurn: boolean;
  highestRarity?: "common" | "uncommon" | "rare" | "legendary";

  // Combat
  combatResult?: {
    playerAttack?: { damage: number; wasCritical: boolean; ... };
    enemyAttack?: { damage: number; wasHit: boolean; ... };
    enemyDefeated: boolean;
    playerDied: boolean;
  };

  // Game phase
  gamePhase?: "early_game" | "mid_game" | "late_game" | "exit";
  consecutiveCombat: number;

  // Status
  message: string;
  isVictory: boolean;
  isGameOver: boolean;
}
```

## System Prompt

Claude receives a system prompt that guides its UI decisions. Key rules:

1. **Always call `ui_set_layout` first**
2. **Always show combat results when `combatResult` is present**
3. **Match variants to context** (dramatic for danger, atmospheric for mystery)
4. **Maximum 6 components per response**
5. **Call `ui_complete` when done**

The prompt includes a decision matrix:

| Condition | Layout | Variants |
|-----------|--------|----------|
| `maxThreat = "deadly"` | cinematic | monster: dramatic+emphasis |
| `roomAtmosphere = "ominous"` | focused | room: atmospheric |
| `combatResult.enemyDefeated` | focused | - |
| `isInDanger = true` | focused | player: dramatic |
| `isVictory = true` | cinematic | triumphant narrative |
| `highestRarity = "legendary"` | cinematic | item: dramatic+emphasis |

## Fallback System

If Phase 2 fails or returns no components, a deterministic fallback renders the UI:

```typescript
function determineLayoutStyle(gameState: GameStateSnapshot): LayoutStyle {
  if (gameState.victory || gameState.gameOver) return "cinematic";
  if (gameState.monsters?.length > 0) return "focused";
  if (gameState.combatResult) return "focused";
  if ((gameState.character?.hp ?? 100) / (gameState.character?.maxHp ?? 100) <= 0.3) {
    return "focused";
  }
  return "standard";
}
```

The fallback ensures the game is always playable even if the AI fails.

## Focus Mode

In addition to the generative UI, users can enter **focus mode** by clicking Look, Stats, Inventory, or Map buttons. This shows a single component in a cinematic layout:

- **Look**: Room description with atmospheric styling
- **Stats**: Character stats and equipment
- **Inventory**: Full inventory view
- **Map**: Centered dungeon map

Any game action (move, attack, etc.) automatically exits focus mode.

## Cost Optimization

The system uses Claude Haiku for Phase 2, which costs approximately **$0.001 per action**. Key optimizations:

1. **Summarized context** - Send ~500 tokens instead of full game state
2. **Haiku model** - Fast and cheap ($0.25/1M input, $1.25/1M output)
3. **No Phase 1 AI** - Buttons map directly to tools
4. **Max 8 tool calls** - Limits response size

## Example: Combat Scenario

**Input context:**
```json
{
  "hp": 15,
  "maxHp": 50,
  "isInDanger": true,
  "monsterCount": 1,
  "maxThreat": "dangerous",
  "combatResult": {
    "playerAttack": { "damage": 12, "wasCritical": true },
    "enemyDefeated": false
  },
  "message": "Critical hit! You deal 12 damage to the Orc."
}
```

**Claude's tool calls:**
```
1. ui_set_layout({ style: "focused" })
2. ui_render_combat_result({ variant: "dramatic" })
3. ui_render_monster({ monsterId: "orc-1", variant: "dramatic" })
4. ui_render_player({ variant: "dramatic" })
5. ui_complete()
```

**Result:** A 2-column focused layout with emphasized combat results, the orc displayed dramatically, and player stats highlighted (since HP is low).

## Files

| File | Purpose |
|------|---------|
| `lib/ui-tools.tsx` | UI tool definitions and system prompt |
| `lib/types.ts` | TypeScript interfaces for UI system |
| `app/actions.tsx` | Two-phase flow, rendering logic |
| `components/game/GameLayout.tsx` | Layout wrapper component |
| `components/game/FocusView.tsx` | Focus mode view |
| `components/game/*.tsx` | Individual game components with variant support |

## Extending the System

To add a new component type:

1. Create the React component with `variant` prop support
2. Add a UI tool in `lib/ui-tools.tsx`
3. Add the type to `UIComponent` in `lib/types.ts`
4. Handle it in `renderUIFromComponents()` in `app/actions.tsx`
5. Optionally add to fallback in `renderFallbackUI()`
6. Update the system prompt with guidance on when to use it

---

This architecture demonstrates how AI can move beyond generating text to **generating interfaces** - making decisions about layout, emphasis, and presentation that traditionally required explicit programming logic.
