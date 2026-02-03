# Rendering Walkthrough

This document traces the complete code path when a user takes an action in the dungeon crawler, showing how the generative UI renders the result.

## 1. User Clicks a Button

In `components/game/ActionButtons.tsx`, when the user clicks "Attack Goblin":

```typescript
<Button
  onClick={() =>
    onAction({
      tool: "attack",
      args: { target_id: monster.id },
      label: `Attack ${monster.name}`,
    })
  }
>
```

This calls `onAction` with a `GameAction` object.

## 2. Page Handles the Action

In `app/page.tsx`, `handleAction` receives the action:

```typescript
const handleAction = useCallback(async (action: GameAction) => {
  // Clear focus mode when taking a game action
  setFocusMode(null);

  // Get API key from localStorage
  const apiKey = session?.user?.id ? getStoredApiKey(session.user.id) : null;

  setIsLoading(true);
  setStreamedUI(<ThinkingIndicator message={`${action.label}...`} />);

  // Call the server action
  const { uiNode, gameStateStream } = await executeAction(
    action.tool,
    action.args,
    action.label,
    pinnedTypesArray,
    apiKey
  );

  // Set the UI node (this is the generative UI result)
  setStreamedUI(uiNode);

  // Stream game state updates to the store
  for await (const state of readStreamableValue(gameStateStream)) {
    if (state) {
      setGameState(state);
    }
  }
}, [...]);
```

## 3. Server Action: Direct MCP Call

In `app/actions.tsx`, `executeAction` starts by calling the backend directly:

```typescript
export async function executeAction(
  tool: string,
  args: Record<string, string>,
  actionLabel: string,
  pinnedTypes: ComponentType[],
  apiKey: string
): Promise<StreamResult> {
  const ui = createStreamableUI(<ThinkingIndicator />);
  const gameStateStream = createStreamableValue<GameStateSnapshot | null>(null);

  (async () => {
    // ============================================
    // DIRECT MCP CALL (No Phase 1 AI needed!)
    // ============================================
    const mcpResult = await callTool(tool, args);
    const currentGameState = mcpResult.gameState;

    // Update the game state stream
    gameStateStream.update(currentGameState);

    // Show fallback UI while Phase 2 processes
    ui.update(renderFallbackUI(currentGameState, pinnedTypes));
```

The `callTool` function in `lib/mcp-client.ts` makes an HTTP request to the Go backend.

## 4. Phase 2: Claude Generates the UI

Still in `executeAction`, we now call Claude with the UI tools:

```typescript
    // ============================================
    // PHASE 2: AI-driven UI generation
    // ============================================

    // Summarize game state for token efficiency
    const uiContext = summarizeForUI(currentGameState, actionLabel, pinnedTypes);

    // Build the context message for Claude
    const contextMessage = `Game Context:
${JSON.stringify(uiContext, null, 2)}

Available Data:
- Room: ${currentGameState.currentRoom?.name ?? "none"}
- Monsters: ${currentGameState.monsters?.map(m => `${m.name} (id: ${m.id})`).join(", ") || "none"}
- Room Items: ${currentGameState.roomItems?.map(i => `${i.name} (id: ${i.id})`).join(", ") || "none"}
...

Decide how to present this game state to the player.`;

    // Collect UI tool results
    const uiToolResults: unknown[] = [];

    // Call Claude with UI tools
    const phase2Result = streamText({
      model: anthropic("claude-haiku-4-20250414"),
      system: UI_SYSTEM_PROMPT,  // From lib/ui-tools.tsx
      messages: [{ role: "user", content: contextMessage }],
      tools: uiTools,           // The UI tool definitions
      maxSteps: 8,
      maxTokens: 500,
      onStepFinish: async (step) => {
        // Collect each tool result as Claude calls tools
        if (step.toolResults) {
          for (const toolResult of step.toolResults) {
            uiToolResults.push(toolResult.result);
          }
        }
      },
    });

    // Consume the stream (Claude is thinking and calling tools)
    for await (const _ of phase2Result.textStream) {
      // Discard text output, we only care about tool calls
    }
```

## 5. UI Tools Return Components

When Claude calls a tool like `ui_render_monster`, it executes in `lib/ui-tools.tsx`:

```typescript
export const uiRenderMonster = tool({
  description: "Render a monster card...",
  parameters: z.object({
    monsterId: z.string(),
    variant: variantSchema.optional(),
    emphasis: z.boolean().optional(),
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
```

Each tool returns a `UIComponent` object describing what to render.

## 6. Extract Components from Tool Results

Back in `actions.tsx`, we extract the components:

```typescript
function extractUIComponents(toolResults: unknown[]): UIComponent[] {
  const components: UIComponent[] = [];

  for (const result of toolResults) {
    if (result && typeof result === "object" && "component" in result) {
      components.push((result as { component: UIComponent }).component);
    }
  }

  return components;
}
```

After Claude finishes:

```typescript
    const uiComponents = extractUIComponents(uiToolResults);
    console.log(`Phase 2 generated ${uiComponents.length} components:`,
                uiComponents.map(c => c.type));

    if (uiComponents.length > 0) {
      ui.done(renderUIFromComponents(uiComponents, currentGameState));
    } else {
      ui.done(renderFallbackUI(currentGameState, pinnedTypes));
    }
```

## 7. Render Components to React

`renderUIFromComponents` converts the `UIComponent` objects to actual React elements:

```typescript
function renderUIFromComponents(
  components: UIComponent[],
  gameState: GameStateSnapshot
): React.ReactNode {
  // Find layout style (default to standard)
  const layoutComponent = components.find(c => c.type === "layout");
  const layoutStyle: LayoutStyle = layoutComponent?.style ?? "standard";

  const renderedNodes: React.ReactNode[] = [];

  for (const comp of components.filter(c => c.type !== "layout")) {
    const key = `${comp.type}-${renderedNodes.length}`;
    const variant = comp.variant;

    switch (comp.type) {
      case "monster": {
        const data = comp.data as { monsterId: string };
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

      case "combatResult": {
        if (gameState.combatResult) {
          renderedNodes.push(
            <div key={key} className="rounded-lg border border-orange-600/30 bg-card p-4">
              <h3 className="text-xs font-medium text-orange-400 uppercase tracking-wide mb-3">
                Combat Results
              </h3>
              <CombatResult result={gameState.combatResult} variant={combatVariant} />
            </div>
          );
        }
        break;
      }

      // ... other component types (room, player, item, map, etc.)
    }
  }

  // Wrap in the layout
  return (
    <GameLayout style={layoutStyle}>
      {renderedNodes}
    </GameLayout>
  );
}
```

## 8. GameLayout Applies the Grid

In `components/game/GameLayout.tsx`:

```typescript
const layoutStyles: Record<LayoutStyle, string> = {
  standard: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
  focused: "grid grid-cols-1 lg:grid-cols-2 gap-4",
  cinematic: "flex flex-col items-center gap-4 max-w-2xl mx-auto",
  dense: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3",
};

export function GameLayout({ style, children }: GameLayoutProps) {
  return (
    <div className={layoutStyles[style]}>
      {children}
    </div>
  );
}
```

## 9. UI Streams Back to the Client

The `ui.done(...)` call finalizes the streamable UI, which flows back to `page.tsx`:

```typescript
// In page.tsx
setStreamedUI(uiNode);  // This is the rendered React tree
```

And finally renders in the JSX:

```typescript
{streamedUI ? (
  streamedUI  // The generative UI result
) : (
  <div>Welcome, Adventurer!</div>
)}
```

---

## Visual Summary

```
Button Click
    │
    ▼
ActionButtons.onAction({ tool: "attack", args: { target_id: "goblin-1" } })
    │
    ▼
page.tsx handleAction()
    │
    ▼
actions.tsx executeAction()
    │
    ├──► callTool("attack", { target_id: "goblin-1" })  ──► Go Backend
    │                                                            │
    │    ◄── GameStateSnapshot (goblin defeated, combat result) ◄┘
    │
    ├──► summarizeForUI() ──► UIContext { isInDanger: true, combatResult: {...} }
    │
    ├──► streamText({ tools: uiTools, system: UI_SYSTEM_PROMPT })
    │         │
    │         │  Claude thinks and calls:
    │         │    ui_set_layout({ style: "focused" })
    │         │    ui_render_combat_result({ variant: "dramatic" })
    │         │    ui_render_player({ variant: "dramatic" })
    │         │    ui_complete()
    │         │
    │         ▼
    │    uiToolResults: [{ component: { type: "layout", style: "focused" }}, ...]
    │
    ├──► extractUIComponents() ──► UIComponent[]
    │
    ├──► renderUIFromComponents()
    │         │
    │         ├──► <GameLayout style="focused">
    │         │        <CombatResult variant="dramatic" />
    │         │        <PlayerStats variant="dramatic" />
    │         │    </GameLayout>
    │         │
    │         ▼
    │    React.ReactNode
    │
    ▼
ui.done(reactNode) ──► streams to client ──► setStreamedUI() ──► renders
```

## Key Files

| File | Role in Rendering |
|------|-------------------|
| `components/game/ActionButtons.tsx` | Creates GameAction objects from button clicks |
| `app/page.tsx` | Orchestrates the flow, manages state, renders final UI |
| `app/actions.tsx` | Server action: calls backend, runs Phase 2, renders components |
| `lib/mcp-client.ts` | HTTP calls to Go backend |
| `lib/ui-tools.tsx` | UI tool definitions that Claude calls |
| `lib/types.ts` | TypeScript interfaces for UIComponent, GameState, etc. |
| `components/game/GameLayout.tsx` | Applies layout grid styles |
| `components/game/*.tsx` | Individual components (MonsterCard, PlayerStats, etc.) |

## Fallback Path

If Phase 2 fails or returns no components, the fallback path is used:

```typescript
if (uiComponents.length > 0) {
  ui.done(renderUIFromComponents(uiComponents, currentGameState));
} else {
  // Fallback: deterministic rendering
  ui.done(renderFallbackUI(currentGameState, pinnedTypes));
}
```

`renderFallbackUI` uses `determineLayoutStyle()` to pick a layout based on game state (combat → focused, victory → cinematic, etc.) and renders all relevant components without AI involvement.
