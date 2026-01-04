import { useState, useCallback } from 'react';
import type { FavoriteScript, FavoritesCollection } from '../types';
import type { ScriptModel } from '../lib/ScriptRunner';

const FAVORITES_KEY = 'boop_favorites_v1';
const MAX_FAVORITES = 5;

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteScript[]>(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_KEY);
      if (!saved) return [];
      const collection: FavoritesCollection = JSON.parse(saved);
      return Array.isArray(collection.favorites) ? collection.favorites : [];
    } catch {
      return [];
    }
  });

  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const saveFavorites = useCallback((newFavorites: FavoriteScript[]) => {
    const collection: FavoritesCollection = {
      favorites: newFavorites,
      maxSize: MAX_FAVORITES,
      lastUpdated: new Date().toISOString(),
    };
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(collection));
      setFavorites(newFavorites);
      setLastUpdated(collection.lastUpdated);
    } catch (e) {
      console.error('Failed to save favorites:', e);
    }
  }, []);

  const isFavorite = useCallback(
    (scriptPath: string) => favorites.some((f) => f.scriptPath === scriptPath),
    [favorites]
  );

  // Find first available number (1-5)
  const getNextAvailableNumber = useCallback(() => {
    const usedNumbers = new Set(favorites.map((f) => f.assignedNumber));
    for (let i = 1; i <= MAX_FAVORITES; i++) {
      if (!usedNumbers.has(i)) return i;
    }
    return null; // All numbers used
  }, [favorites]);

  // Find least recently used favorite (for eviction)
  const getLeastRecentlyUsed = useCallback(() => {
    if (favorites.length < MAX_FAVORITES) return null;

    let lru = favorites[0];
    for (const fav of favorites) {
      const lruTime = lru.lastUsedAt || lru.createdAt;
      const favTime = fav.lastUsedAt || fav.createdAt;
      if (favTime < lruTime) {
        lru = fav;
      }
    }
    return lru;
  }, [favorites]);

  const addToFavorites = useCallback(
    (scriptPath: string, preferredNumber?: number) => {
      if (isFavorite(scriptPath)) return;

      const now = new Date().toISOString();
      const assignedNumber = preferredNumber || getNextAvailableNumber() || 1;

      const newFavorite: FavoriteScript = {
        scriptPath,
        assignedNumber,
        createdAt: now,
        lastUsedAt: null,
        usageCount: 0,
      };

      let newFavorites = [newFavorite, ...favorites];

      // LRU eviction: remove least recently used if exceeding max
      if (newFavorites.length > MAX_FAVORITES) {
        const lru = getLeastRecentlyUsed();
        if (lru) {
          newFavorites = newFavorites.filter((f) => f.scriptPath !== lru.scriptPath);
        }
      }

      // Renumber based on usage recency (most recently used first)
      const renumbered = newFavorites.map((f, index) => ({
        ...f,
        assignedNumber: index + 1,
      }));

      saveFavorites(renumbered);
    },
    [favorites, isFavorite, getNextAvailableNumber, getLeastRecentlyUsed, saveFavorites]
  );

  // Reassign a favorite to a specific number (for hover + number assignment)
  const reassignFavoriteNumber = useCallback(
    (scriptPath: string, newNumber: number) => {
      const favorite = favorites.find((f) => f.scriptPath === scriptPath);
      if (!favorite) return false;
      if (newNumber < 1 || newNumber > MAX_FAVORITES) return false;
      if (favorite.assignedNumber === newNumber) return true;

      // Find favorite currently using the new number
      const existingWithNumber = favorites.find((f) => f.assignedNumber === newNumber);

      const updatedFavorites = favorites.map((f) => {
        if (f.scriptPath === scriptPath) {
          return { ...f, assignedNumber: newNumber };
        }
        if (existingWithNumber && f.scriptPath === existingWithNumber.scriptPath) {
          // Swap: give old number to the displaced favorite
          return { ...f, assignedNumber: favorite.assignedNumber };
        }
        return f;
      });

      // Re-sort by usage recency and renumber
      const sorted = updatedFavorites.sort((a, b) => {
        const aTime = a.lastUsedAt || a.createdAt;
        const bTime = b.lastUsedAt || b.createdAt;
        return bTime.localeCompare(aTime);
      });

      const renumbered = sorted.map((f, index) => ({
        ...f,
        assignedNumber: index + 1,
      }));

      // Ensure the reassigned favorite has the requested number
      const final = renumbered.map((f) => {
        if (f.scriptPath === scriptPath) {
          return { ...f, assignedNumber: newNumber, lastUsedAt: new Date().toISOString() };
        }
        return f;
      });

      saveFavorites(final);
      return true;
    },
    [favorites, saveFavorites]
  );

  const removeFromFavorites = useCallback(
    (scriptPath: string) => {
      const newFavorites = favorites.filter((f) => f.scriptPath !== scriptPath);
      saveFavorites(newFavorites);
    },
    [favorites, saveFavorites]
  );

  const executeFavorite = useCallback(
    (number: number) => {
      const favorite = favorites.find((f) => f.assignedNumber === number);
      if (!favorite) return null;

      const now = new Date().toISOString();
      const updatedFavorite: FavoriteScript = {
        ...favorite,
        lastUsedAt: now,
        usageCount: favorite.usageCount + 1,
      };

      const otherFavorites = favorites.filter((f) => f.scriptPath !== favorite.scriptPath);
      const newFavorites = [updatedFavorite, ...otherFavorites];

      const reorderedFavorites = newFavorites.map((f, index) => ({
        ...f,
        assignedNumber: index + 1,
      }));

      saveFavorites(reorderedFavorites);

      return favorite.scriptPath;
    },
    [favorites, saveFavorites]
  );

  const getFavoriteByNumber = useCallback(
    (number: number) => favorites.find((f) => f.assignedNumber === number) || null,
    [favorites]
  );

  const cleanupInvalidFavorites = useCallback(
    (existingScriptPaths: Set<string>) => {
      const validFavorites = favorites.filter((f) => existingScriptPaths.has(f.scriptPath));
      if (validFavorites.length !== favorites.length) {
        const removedCount = favorites.length - validFavorites.length;
        saveFavorites(validFavorites);
        return removedCount;
      }
      return 0;
    },
    [favorites, saveFavorites]
  );

  const onScriptsLoaded = useCallback(
    (scripts: ScriptModel[]) => {
      const scriptPaths = new Set(scripts.map((s) => s.path));
      const removedCount = cleanupInvalidFavorites(scriptPaths);
      if (removedCount > 0) {
        console.info(`[useFavorites] Cleaned up ${removedCount} invalid favorite(s)`);
      }
    },
    [cleanupInvalidFavorites]
  );

  return {
    favorites,
    lastUpdated,
    isFavorite,
    addToFavorites,
    removeFromFavorites,
    executeFavorite,
    getFavoriteByNumber,
    cleanupInvalidFavorites,
    onScriptsLoaded,
    reassignFavoriteNumber,
  };
}
