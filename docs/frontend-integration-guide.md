# Frontend Integration Guide for Backend Enhancements

This guide explains how to use the new backend response fields for AI-driven UI rendering decisions.

## Overview

The backend now provides structured metadata to help the frontend AI make better layout and presentation decisions. All new fields are optional - maintain your existing fallback logic for backward compatibility.

## New Response Fields

### 1. Event Metadata (`event`)

```typescript
interface EventInfo {
  type: "combat" | "discovery" | "movement" | "interaction" | "death" | "victory";
  subtype: string;  // e.g., "attack_hit", "attack_miss", "enemy_defeated", "item_found"
  entities: string[]; // IDs of involved monsters/items
}
```

**Usage:**
- Use `type` to determine primary UI mode (combat layout, exploration layout, etc.)
- Use `subtype` for specific animations or notifications
- Use `entities` to highlight relevant monsters/items in the UI

**Determining Importance:** The frontend AI should assess importance based on context:
- Critical: player HP < 25%, enemy defeated, rare item found, death, victory
- Notable: successful hits, new room entry, item pickup
- Routine: movement, misses, repeated actions

### 2. Monster Threat (`monsters[].threat`)

```typescript
type Threat = "trivial" | "normal" | "dangerous" | "deadly";
```

**UI Mapping:**
| Threat | Suggested Presentation |
|--------|------------------------|
| trivial | `minimal` variant, subdued colors |
| normal | `standard` variant |
| dangerous | `dramatic` variant, warning indicators |
| deadly | `dramatic` variant, screen effects, urgent audio cues |

**Fallback:** If `threat` is missing, estimate from monster HP relative to player damage output.

### 3. Monster Defeat State (`monsters[].isDefeated`)

When `true`, the monster was defeated this turn.

**Usage:**
- Trigger defeat animation
- Show victory flourish for `dangerous`/`deadly` threats
- Consider `cinematic` layout momentarily for significant defeats

### 4. Item Rarity (`items[].rarity`)

```typescript
type Rarity = "common" | "uncommon" | "rare" | "legendary";
```

**UI Mapping:**
| Rarity | Suggested Presentation |
|--------|------------------------|
| common | Standard item display |
| uncommon | Subtle highlight |
| rare | Glow effect, `dramatic` variant |
| legendary | Full `cinematic` moment, special effects |

### 5. Item Discovery (`items[].isNew`)

When `true`, the item was just discovered this turn.

**Usage:**
- Animate item appearance
- Draw player attention to new items
- Combine with `rarity` to determine emphasis level

### 6. Inventory Delta (`inventoryDelta`)

```typescript
interface InventoryDelta {
  added?: string[];   // Item IDs picked up
  removed?: string[]; // Item IDs dropped
  used?: string[];    // Item IDs consumed
}
```

**Usage:**
- Show "+1 Health Potion" style notifications for `added`
- Show consumption effects for `used` (potion drinking animation, scroll burning, etc.)
- Update inventory UI with appropriate transitions

### 7. Room Atmosphere (`currentRoom.atmosphere`)

```typescript
type Atmosphere = "safe" | "tense" | "dangerous" | "mysterious" | "ominous";
```

**UI Mapping:**
| Atmosphere | Suggested Presentation |
|------------|------------------------|
| safe | Warm lighting, relaxed music, `standard` layout |
| tense | Dim lighting, subtle ambient sounds |
| dangerous | Red tints, combat-ready UI, `focused` layout |
| mysterious | Fog effects, muted colors, `atmospheric` variant |
| ominous | Dark palette, foreboding audio, `dramatic` variant |

**Note:** Atmosphere is computed by the backend based on monster presence, threat levels, item rarity, and proximity to exit.

### 8. First Visit (`currentRoom.isFirstVisit`)

When `true`, the player has never been to this room before.

**Usage:**
- Use `atmospheric` component variants for room description
- Consider brief `cinematic` layout for significant rooms
- Trigger exploration discovery effects

### 9. Combat Results (`combatResult`)

```typescript
interface CombatResult {
  playerAttack?: AttackResult;
  enemyAttack?: AttackResult;
  enemyDefeated: boolean;
  playerDied: boolean;
}

interface AttackResult {
  attackerName: string;
  targetName: string;
  damage: number;
  wasHit: boolean;
  wasCritical: boolean;
  remainingHp: number;  // Target's HP after attack
}
```

**Usage:**
- Use `remainingHp` to animate health bar changes smoothly
- Trigger critical hit effects when `wasCritical` is true
- Use `enemyDefeated` to trigger victory sequences
- Use `playerDied` to trigger death sequence

**Fallback:** If `combatResult` is missing, parse the `message` field for combat info.

### 10. Game Context (`context`)

```typescript
interface GameContext {
  phase: "early_game" | "mid_game" | "late_game" | "exit";
  turnsInRoom: number;
  consecutiveCombat: number;
  explorationPct: number;
}
```

**Phase Calculation:** Based on Manhattan distance from entrance (0,0):
- `early_game`: distance 0-2
- `mid_game`: distance 3-5
- `late_game`: distance 6-7
- `exit`: distance 8 (room 4,4)

**UI Mapping:**
| Phase | Suggested Presentation |
|-------|------------------------|
| early_game | Tutorial hints, `standard` layout, encouraging tone |
| mid_game | Full UI, `standard` or `focused` layouts |
| late_game | Tense atmosphere, `dramatic` variants, urgency cues |
| exit | Victory anticipation, `cinematic` layout |

**Other Context Usage:**
- `turnsInRoom > 3`: Player may be stuck, consider offering hints
- `consecutiveCombat > 2`: Sustained combat, use `focused` layout, show fatigue
- `explorationPct`: Show progress indicators, "almost there" messaging at high values

## Layout Selection Guide

Based on the new fields, here's a decision framework:

```
if (event.type === "victory" || context.phase === "exit")
  → cinematic layout

if (event.type === "combat" || consecutiveCombat > 0)
  → focused layout

if (currentRoom.isFirstVisit && atmosphere === "mysterious")
  → cinematic layout (brief)

if (monsters.some(m => m.threat === "deadly"))
  → focused layout with dramatic variants

if (inventory interaction)
  → dense layout

default
  → standard layout
```

## Component Variant Selection

```
if (monster.threat === "deadly" || monster.threat === "dangerous")
  → dramatic variant

if (item.rarity === "rare" || item.rarity === "legendary")
  → dramatic variant

if (currentRoom.isFirstVisit)
  → atmospheric variant for room description

if (atmosphere === "safe" && context.phase === "early_game")
  → minimal variant (reduce visual noise)

default
  → standard variant
```

## Backward Compatibility

All new fields are optional. Maintain existing inference logic as fallbacks:

| New Field | Fallback Logic |
|-----------|----------------|
| `threat` | Compare monster HP/damage to player stats |
| `atmosphere` | Infer from monster count and player HP |
| `event` | Parse `message` text for keywords |
| `combatResult` | Parse `message` for damage numbers |
| `context.phase` | Calculate from room coordinates if available |
| `inventoryDelta` | Compare inventory arrays between turns |

## Example: Processing a Response

```typescript
function selectLayout(response: GameResponse): Layout {
  const { event, context, currentRoom, monsters, combatResult } = response;

  // Victory or exit
  if (event?.type === "victory" || context?.phase === "exit") {
    return "cinematic";
  }

  // Active combat
  if (event?.type === "combat" || combatResult || context?.consecutiveCombat > 0) {
    return "focused";
  }

  // Dramatic discovery
  if (currentRoom?.isFirstVisit && currentRoom?.atmosphere === "mysterious") {
    return "cinematic";
  }

  // Deadly threat present
  if (monsters?.some(m => m.threat === "deadly")) {
    return "focused";
  }

  // Default
  return "standard";
}

function selectMonsterVariant(monster: Monster): Variant {
  if (monster.threat === "deadly" || monster.threat === "dangerous") {
    return "dramatic";
  }
  if (monster.isDefeated) {
    return "minimal"; // Fading out
  }
  return "standard";
}
```
