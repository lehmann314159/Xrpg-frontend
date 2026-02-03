# Generative UI: Our Approach vs Vercel's

This document compares our generative UI implementation with Vercel's "pure" generative UI approach using the AI SDK.

## Vercel's "Pure" Generative UI Approach

Vercel's AI SDK supports tools that **directly return React components**:

```typescript
import { render } from 'ai/rsc';

const result = await render({
  model: openai('gpt-4'),
  messages: [...],
  tools: {
    showWeather: {
      description: 'Show weather for a city',
      parameters: z.object({ city: z.string() }),
      render: async function* ({ city }) {
        yield <WeatherSkeleton />;  // Stream a loading state
        const weather = await getWeather(city);
        return <WeatherCard data={weather} />;  // Final component
      }
    }
  }
});
```

The AI calls `showWeather`, and it **directly streams React JSX** to the client. The tool's `render` function returns actual components.

## Our Approach: Data → Components

We do something different. Our tools return **data structures**, not components:

```typescript
// Our tool returns data
export const uiRenderMonster = tool({
  execute: async ({ monsterId, variant }): Promise<UIToolResult> => {
    return {
      component: {
        type: "monster",
        variant: variant,
        data: { monsterId },
      },
    };
  },
});
```

Then we **separately convert** that data to React:

```typescript
// Separate rendering step
function renderUIFromComponents(components: UIComponent[], gameState) {
  for (const comp of components) {
    if (comp.type === "monster") {
      const monster = gameState.monsters.find(m => m.id === comp.data.monsterId);
      renderedNodes.push(<MonsterCard monster={monster} variant={comp.variant} />);
    }
  }
  return <GameLayout>{renderedNodes}</GameLayout>;
}
```

## Comparison Table

| Aspect | Vercel's Pure Approach | Our Approach |
|--------|------------------------|--------------|
| **Tool returns** | React JSX directly | Data structure (UIComponent) |
| **Rendering** | Inside tool's render function | Separate `renderUIFromComponents` |
| **AI decides** | Which tool to call | Which tools to call + parameters |
| **Component code** | In tool definition | In separate component files |
| **Flexibility** | Tool owns rendering | Centralized rendering logic |
| **Testability** | Harder (JSX in tools) | Easier (data is inspectable) |

## Why We Chose This Approach

### 1. Separation of Concerns

Claude decides *what* to show (data), we decide *how* to render it (React). The AI doesn't need to know about Tailwind classes or React patterns.

```
Claude's job:  "Show the monster card with dramatic variant"
Our job:       "Here's how dramatic variant looks in CSS/React"
```

### 2. Fallback Handling

If Phase 2 fails, we can render from the same game state deterministically:

```typescript
if (uiComponents.length > 0) {
  ui.done(renderUIFromComponents(uiComponents, gameState));
} else {
  // Fallback: deterministic rendering without AI
  ui.done(renderFallbackUI(gameState, pinnedTypes));
}
```

With pure generative UI, if the AI fails, you get no UI.

### 3. Debugging

We can log exactly what Claude decided before rendering:

```typescript
const uiComponents = extractUIComponents(uiToolResults);
console.log('Phase 2 generated:', uiComponents.map(c => c.type));
// Output: ["layout", "combatResult", "monster", "player"]
```

With pure JSX streaming, you just see the rendered output.

### 4. Type Safety

Our `UIComponent` type enforces valid combinations:

```typescript
interface UIComponent {
  type: "layout" | "monster" | "player" | "room" | ...;
  variant?: "standard" | "dramatic" | "compact" | ...;
  data?: unknown;
}
```

Pure JSX tools can return anything.

### 5. Reusability

The same `MonsterCard` component works everywhere:

- Generative UI (Phase 2)
- Fallback UI (when AI fails)
- Focus mode (user explicitly views details)

No duplication of rendering logic.

## What Vercel's Approach Does Better

### 1. Streaming Partial UI

Their `yield` pattern lets you stream loading states, then replace with final content:

```typescript
render: async function* ({ city }) {
  yield <WeatherSkeleton />;        // Immediate loading state
  const weather = await getWeather(city);
  return <WeatherCard data={weather} />;  // Replace when ready
}
```

We show a complete fallback, then replace entirely.

### 2. Simpler for Simple Cases

If you just want AI to pick from 3 widgets, their approach is less code:

```typescript
tools: {
  showChart: { render: () => <Chart /> },
  showTable: { render: () => <Table /> },
  showCard: { render: () => <Card /> },
}
```

vs our data structure + switch statement pattern.

### 3. Dynamic Component Creation

AI could theoretically generate novel layouts or component combinations. Our approach is constrained to predefined component types.

## Hybrid Possibility

You could combine both approaches - have Claude call tools that return data, but use `createStreamableUI` to stream partial updates as components are decided:

```typescript
const ui = createStreamableUI(<LoadingSpinner />);

const phase2Result = streamText({
  tools: uiTools,
  onStepFinish: (step) => {
    // As Claude calls each tool, update the UI progressively
    const componentsSoFar = extractUIComponents(allResults);
    ui.update(renderUIFromComponents(componentsSoFar, gameState));
  }
});

// Wait for completion
await phase2Result;

// Final render
ui.done(renderUIFromComponents(allComponents, gameState));
```

We partially do this - we show `renderFallbackUI` while Phase 2 runs, then replace with the generative result when done.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    VERCEL'S PURE APPROACH                       │
│                                                                 │
│   AI ──calls──► Tool ──returns──► React JSX ──streams──► Client │
│                   │                                             │
│                   └── render: () => <Component />               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                       OUR APPROACH                              │
│                                                                 │
│   AI ──calls──► Tool ──returns──► UIComponent data              │
│                                          │                      │
│                                          ▼                      │
│                               renderUIFromComponents()          │
│                                          │                      │
│                                          ▼                      │
│                                    React JSX                    │
│                                          │                      │
│                                          ▼                      │
│                                       Client                    │
└─────────────────────────────────────────────────────────────────┘
```

## When to Use Which

**Use Vercel's pure approach when:**
- Simple use case (AI picks from a few widgets)
- You want progressive streaming of UI parts
- Tools are self-contained with their own data fetching

**Use our data-first approach when:**
- Complex state shared across components (like game state)
- You need robust fallbacks
- Debugging/logging AI decisions is important
- Same components used in multiple contexts
- You want centralized control over rendering

## Summary

| | Vercel Pure | Our Approach |
|--|-------------|--------------|
| **Philosophy** | AI returns JSX directly | AI returns data, we render |
| **Complexity** | Simpler for simple cases | More structure, more control |
| **Fallbacks** | Harder | Built-in |
| **Debugging** | See rendered output | See data decisions |
| **Best for** | Widget selection | Complex stateful UIs |

Both approaches use the same underlying Vercel AI SDK infrastructure (`createStreamableUI`, `streamText`, tool calling). The difference is in what the tools produce and where rendering logic lives.
