import { ToolResult, MCPTool } from "./types";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080";

export class MCPClientError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public isNetworkError: boolean = false
  ) {
    super(message);
    this.name = "MCPClientError";
  }
}

/**
 * Check if the backend is reachable
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * List available MCP tools from the backend
 */
export async function listTools(): Promise<MCPTool[]> {
  try {
    const response = await fetch(`${BACKEND_URL}/mcp/tools`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new MCPClientError(
        `Failed to list tools: ${response.statusText}`,
        response.status
      );
    }

    const data = await response.json();
    return data.tools || [];
  } catch (error) {
    if (error instanceof MCPClientError) {
      throw error;
    }
    throw new MCPClientError(
      "Unable to connect to game server",
      undefined,
      true
    );
  }
}

/**
 * Call an MCP tool on the backend
 */
export async function callTool(
  name: string,
  args: Record<string, unknown> = {}
): Promise<ToolResult> {
  try {
    const response = await fetch(`${BACKEND_URL}/mcp/call`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        arguments: args,
      }),
    });

    if (!response.ok) {
      throw new MCPClientError(
        `Tool call failed: ${response.statusText}`,
        response.status
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof MCPClientError) {
      throw error;
    }
    throw new MCPClientError(
      "Unable to connect to game server",
      undefined,
      true
    );
  }
}

// Convenience wrappers for common MCP tools

export async function newGame(characterName: string): Promise<ToolResult> {
  return callTool("new_game", { character_name: characterName });
}

export async function look(): Promise<ToolResult> {
  return callTool("look", {});
}

export async function move(
  direction: "north" | "south" | "east" | "west"
): Promise<ToolResult> {
  return callTool("move", { direction });
}

export async function attack(targetId: string): Promise<ToolResult> {
  return callTool("attack", { target_id: targetId });
}

export async function take(itemId: string): Promise<ToolResult> {
  return callTool("take", { item_id: itemId });
}

export async function use(itemId: string): Promise<ToolResult> {
  return callTool("use", { item_id: itemId });
}

export async function equip(itemId: string): Promise<ToolResult> {
  return callTool("equip", { item_id: itemId });
}

export async function inventory(): Promise<ToolResult> {
  return callTool("inventory", {});
}

export async function stats(): Promise<ToolResult> {
  return callTool("stats", {});
}

export async function map(): Promise<ToolResult> {
  return callTool("map", {});
}
