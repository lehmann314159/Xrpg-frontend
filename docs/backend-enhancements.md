# Backend Enhancements for Generative UI Support

## Context

The frontend now uses a two-phase AI flow for rendering:
1. **Phase 1**: Parse commands and execute game actions via MCP tools (unchanged)
2. **Phase 2**: AI decides which UI components to render, their layout, and visual variants based on game context

The AI makes decisions like:
- Layout: standard (3-col), focused (combat), cinematic (dramatic moments), dense (inventory)
- Component variants: standard, dramatic, compact, atmospheric, minimal
- Which components to show and emphasize

## Current Limitations

The frontend currently infers context from limited signals:
- `hp/maxHp` to detect danger
- Monster count and basic stats to detect "strong" enemies
- Message text parsing for combat detection
- `isExit`, `victory`, `gameOver` flags

## Requested Backend Enhancements

### 1. Add Event/Action Metadata to Responses

Add an `event` object to the game state response:

```go
type EventInfo struct {
    Type        string   `json:"type"`        // "combat", "discovery", "movement", "interaction", "death", "victory"
    Subtype     string   `json:"subtype"`     // "attack_hit", "attack_miss", "enemy_defeated", "item_found", "boss_encounter", etc.
    Importance  string   `json:"importance"`  // "routine", "notable", "critical"
    Entities    []string `json:"entities"`    // IDs of involved monsters/items
}
```

### 2. Enhance Monster Data

Add fields to help the UI determine presentation:

```go
type MonsterView struct {
    // ... existing fields ...
    IsBoss       bool   `json:"isBoss"`       // Boss encounter flag
    Threat       string `json:"threat"`       // "trivial", "normal", "dangerous", "deadly"
    IsDefeated   bool   `json:"isDefeated"`   // Was just defeated this turn
}
```

### 3. Enhance Item Data

```go
type ItemView struct {
    // ... existing fields ...
    Rarity      string `json:"rarity"`       // "common", "uncommon", "rare", "legendary"
    IsNew       bool   `json:"isNew"`        // Just discovered this turn
}
```

### 4. Add Room Atmosphere

```go
type RoomView struct {
    // ... existing fields ...
    Atmosphere  string `json:"atmosphere"`   // "safe", "tense", "dangerous", "mysterious", "ominous"
    IsFirstVisit bool  `json:"isFirstVisit"` // Player hasn't been here before
}
```

### 5. Structured Combat Results

Instead of just a message string, provide structured combat data:

```go
type CombatResult struct {
    PlayerAttack *AttackResult `json:"playerAttack,omitempty"`
    EnemyAttack  *AttackResult `json:"enemyAttack,omitempty"`
    EnemyDefeated bool         `json:"enemyDefeated"`
    PlayerDied    bool         `json:"playerDied"`
}

type AttackResult struct {
    AttackerName string `json:"attackerName"`
    TargetName   string `json:"targetName"`
    Damage       int    `json:"damage"`
    WasHit       bool   `json:"wasHit"`
    WasCritical  bool   `json:"wasCritical"`
}
```

### 6. Add Game Phase/Context

```go
type GameContext struct {
    Phase           string `json:"phase"`           // "early_game", "mid_game", "late_game", "boss_fight", "escape"
    TurnsInRoom     int    `json:"turnsInRoom"`     // How long player has been in current room
    ConsecutiveCombat int  `json:"consecutiveCombat"` // Turns of continuous combat
    ExplorationPct  float64 `json:"explorationPct"` // % of dungeon explored
}
```

## Example Enhanced Response

```json
{
  "character": { "hp": 15, "maxHp": 50, ... },
  "currentRoom": {
    "name": "Dark Chamber",
    "atmosphere": "dangerous",
    "isFirstVisit": false,
    ...
  },
  "monsters": [{
    "id": "goblin_1",
    "name": "Goblin Warrior",
    "isBoss": false,
    "threat": "normal",
    "isDefeated": false,
    ...
  }],
  "event": {
    "type": "combat",
    "subtype": "attack_hit",
    "importance": "notable",
    "entities": ["goblin_1"]
  },
  "combatResult": {
    "playerAttack": { "damage": 8, "wasHit": true, "wasCritical": false },
    "enemyAttack": { "damage": 5, "wasHit": true },
    "enemyDefeated": false
  },
  "context": {
    "phase": "mid_game",
    "consecutiveCombat": 2
  },
  "message": "You strike the Goblin Warrior for 8 damage! It retaliates for 5 damage.",
  ...
}
```

## Benefits

With these enhancements, the frontend AI can make better decisions:
- Use `cinematic` layout for boss encounters (`isBoss: true`)
- Use `dramatic` variants for `threat: "deadly"` enemies
- Show `atmospheric` room descriptions for `isFirstVisit` rooms
- Emphasize items with `rarity: "rare"` or higher
- Add tension with `atmosphere: "ominous"` rooms
- Better combat notifications from structured `combatResult`

## Backward Compatibility

All new fields should be optional. The frontend has fallback logic that infers context when these fields are missing.
