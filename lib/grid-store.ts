"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ComponentType, GridTile, GameStateSnapshot, NotificationData } from "./types";

interface GridState {
  // Current tiles displayed in the grid
  tiles: GridTile[];

  // Pinned component types (persisted)
  pinnedTypes: Set<ComponentType>;

  // Current game state from backend
  gameState: GameStateSnapshot | null;

  // Notifications queue
  notifications: NotificationData[];

  // Connection status
  isConnected: boolean;

  // Loading state
  isLoading: boolean;

  // Conversation history (last 5 turns)
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>;

  // Actions
  setTiles: (tiles: GridTile[]) => void;
  addTile: (tile: Omit<GridTile, "id" | "position">) => void;
  removeTile: (id: string) => void;
  moveTile: (id: string, newPosition: number) => void;
  pinTile: (id: string) => void;
  unpinTile: (id: string) => void;
  togglePin: (id: string) => void;
  setGameState: (state: GameStateSnapshot | null) => void;
  addNotification: (notification: Omit<NotificationData, "id" | "timestamp">) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  setConnected: (connected: boolean) => void;
  setLoading: (loading: boolean) => void;
  addToConversation: (message: { role: "user" | "assistant"; content: string }) => void;
  clearConversation: () => void;
  getPinnedTypes: () => ComponentType[];
}

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 9);

export const useGridStore = create<GridState>()(
  persist(
    (set, get) => ({
      tiles: [],
      pinnedTypes: new Set<ComponentType>(),
      gameState: null,
      notifications: [],
      isConnected: true,
      isLoading: false,
      conversationHistory: [],

      setTiles: (tiles) => set({ tiles }),

      addTile: (tile) => {
        const currentTiles = get().tiles;
        const maxPosition = currentTiles.length > 0
          ? Math.max(...currentTiles.map((t) => t.position))
          : -1;

        const newTile: GridTile = {
          ...tile,
          id: generateId(),
          position: maxPosition + 1,
          isPinned: get().pinnedTypes.has(tile.componentType),
        };

        set({ tiles: [...currentTiles, newTile] });
      },

      removeTile: (id) => {
        const tiles = get().tiles.filter((t) => t.id !== id);
        // Reindex positions
        const reindexed = tiles.map((t, i) => ({ ...t, position: i }));
        set({ tiles: reindexed });
      },

      moveTile: (id, newPosition) => {
        const tiles = [...get().tiles];
        const tileIndex = tiles.findIndex((t) => t.id === id);
        if (tileIndex === -1) return;

        const tile = tiles[tileIndex];
        tiles.splice(tileIndex, 1);
        tiles.splice(newPosition, 0, tile);

        // Reindex all positions and auto-pin moved tile
        const reindexed = tiles.map((t, i) => ({
          ...t,
          position: i,
          isPinned: t.id === id ? true : t.isPinned,
        }));

        // Track pinned type
        if (!tile.isPinned) {
          const pinnedTypes = new Set(get().pinnedTypes);
          pinnedTypes.add(tile.componentType);
          set({ tiles: reindexed, pinnedTypes });
        } else {
          set({ tiles: reindexed });
        }
      },

      pinTile: (id) => {
        const tiles = get().tiles.map((t) =>
          t.id === id ? { ...t, isPinned: true } : t
        );
        const tile = tiles.find((t) => t.id === id);
        if (tile) {
          const pinnedTypes = new Set(get().pinnedTypes);
          pinnedTypes.add(tile.componentType);
          set({ tiles, pinnedTypes });
        }
      },

      unpinTile: (id) => {
        const tiles = get().tiles.map((t) =>
          t.id === id ? { ...t, isPinned: false } : t
        );
        const tile = tiles.find((t) => t.id === id);
        if (tile) {
          // Check if there are other pinned tiles of the same type
          const otherPinned = tiles.some(
            (t) => t.id !== id && t.componentType === tile.componentType && t.isPinned
          );
          if (!otherPinned) {
            const pinnedTypes = new Set(get().pinnedTypes);
            pinnedTypes.delete(tile.componentType);
            set({ tiles, pinnedTypes });
          } else {
            set({ tiles });
          }
        }
      },

      togglePin: (id) => {
        const tile = get().tiles.find((t) => t.id === id);
        if (tile) {
          if (tile.isPinned) {
            get().unpinTile(id);
          } else {
            get().pinTile(id);
          }
        }
      },

      setGameState: (gameState) => set({ gameState }),

      addNotification: (notification) => {
        const newNotification: NotificationData = {
          ...notification,
          id: generateId(),
          timestamp: Date.now(),
        };
        set((state) => ({
          notifications: [...state.notifications.slice(-4), newNotification],
        }));
      },

      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      },

      clearNotifications: () => set({ notifications: [] }),

      setConnected: (isConnected) => set({ isConnected }),

      setLoading: (isLoading) => set({ isLoading }),

      addToConversation: (message) => {
        set((state) => ({
          conversationHistory: [...state.conversationHistory.slice(-9), message],
        }));
      },

      clearConversation: () => set({ conversationHistory: [] }),

      getPinnedTypes: () => Array.from(get().pinnedTypes),
    }),
    {
      name: "dungeon-grid-storage",
      partialize: (state) => ({
        pinnedTypes: Array.from(state.pinnedTypes),
      }),
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray(state.pinnedTypes)) {
          state.pinnedTypes = new Set(state.pinnedTypes as unknown as ComponentType[]);
        }
      },
    }
  )
);

// Helper to build tiles from game state for Claude to render
export function buildTilesFromGameState(
  gameState: GameStateSnapshot,
  pinnedTypes: ComponentType[]
): Omit<GridTile, "id" | "position">[] {
  const tiles: Omit<GridTile, "id" | "position">[] = [];

  // Always include pinned components
  const addedTypes = new Set<ComponentType>();

  // Map
  if (pinnedTypes.includes("dungeonMap") || gameState.mapGrid) {
    tiles.push({
      componentType: "dungeonMap",
      isPinned: pinnedTypes.includes("dungeonMap"),
      data: gameState.mapGrid,
    });
    addedTypes.add("dungeonMap");
  }

  // Player stats
  if (pinnedTypes.includes("playerStats") || gameState.character) {
    tiles.push({
      componentType: "playerStats",
      isPinned: pinnedTypes.includes("playerStats"),
      data: gameState.character,
    });
    addedTypes.add("playerStats");
  }

  // Equipment
  if (pinnedTypes.includes("equipmentPanel") || gameState.equipment) {
    tiles.push({
      componentType: "equipmentPanel",
      isPinned: pinnedTypes.includes("equipmentPanel"),
      data: gameState.equipment,
    });
    addedTypes.add("equipmentPanel");
  }

  // Room description
  if (pinnedTypes.includes("roomDescription") || gameState.currentRoom) {
    tiles.push({
      componentType: "roomDescription",
      isPinned: pinnedTypes.includes("roomDescription"),
      data: gameState.currentRoom,
    });
    addedTypes.add("roomDescription");
  }

  // Monsters
  if (gameState.monsters && gameState.monsters.length > 0) {
    gameState.monsters.forEach((monster) => {
      tiles.push({
        componentType: "monsterCard",
        isPinned: false,
        data: monster,
      });
    });
  }

  // Room items
  if (gameState.roomItems && gameState.roomItems.length > 0) {
    gameState.roomItems.forEach((item) => {
      tiles.push({
        componentType: "itemCard",
        isPinned: false,
        data: item,
      });
    });
  }

  // Inventory (if pinned)
  if (pinnedTypes.includes("inventory")) {
    tiles.push({
      componentType: "inventory",
      isPinned: true,
      data: gameState.inventory,
    });
  }

  return tiles;
}
