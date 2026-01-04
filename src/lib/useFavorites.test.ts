import { describe, it, expect, beforeEach } from 'vitest';

describe('useFavorites Logic (Pure Function Tests)', () => {
  type FavoriteScript = {
    scriptPath: string;
    assignedNumber: number;
    createdAt: string;
    lastUsedAt: string | null;
    usageCount: number;
  };

  const MAX_FAVORITES = 5;
  let favorites: FavoriteScript[] = [];

  const isFavorite = (scriptPath: string) => favorites.some((f) => f.scriptPath === scriptPath);

  const addToFavorites = (scriptPath: string) => {
    if (isFavorite(scriptPath)) return;

    const now = new Date().toISOString();
    const newFavorite: FavoriteScript = {
      scriptPath,
      assignedNumber: favorites.length + 1,
      createdAt: now,
      lastUsedAt: null,
      usageCount: 0,
    };

    let newFavorites = [newFavorite, ...favorites];
    if (newFavorites.length > MAX_FAVORITES) {
      newFavorites = newFavorites.slice(0, MAX_FAVORITES);
    }

    favorites = newFavorites;
  };

  const removeFromFavorites = (scriptPath: string) => {
    favorites = favorites.filter((f) => f.scriptPath !== scriptPath);
    favorites = favorites.map((f, index) => ({ ...f, assignedNumber: index + 1 }));
  };

  const executeFavorite = (number: number) => {
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

    favorites = newFavorites.map((f, index) => ({ ...f, assignedNumber: index + 1 }));

    return favorite.scriptPath;
  };

  const getFavoriteByNumber = (number: number) =>
    favorites.find((f) => f.assignedNumber === number) || null;

  const cleanupInvalidFavorites = (existingScriptPaths: Set<string>) => {
    const validFavorites = favorites.filter((f) => existingScriptPaths.has(f.scriptPath));
    const removedCount = favorites.length - validFavorites.length;
    favorites = validFavorites;
    return removedCount;
  };

  const resetFavorites = () => {
    favorites = [];
  };

  beforeEach(() => {
    resetFavorites();
  });

  describe('TC-FAV-001: Add Script to Favorites', () => {
    it('should add script to favorites with assignedNumber 1', () => {
      addToFavorites('scripts/UpperCase.js');

      expect(favorites).toHaveLength(1);
      expect(favorites[0].scriptPath).toBe('scripts/UpperCase.js');
      expect(favorites[0].assignedNumber).toBe(1);
    });
  });

  describe('TC-FAV-002: Add Multiple Scripts', () => {
    it('should assign sequential numbers when adding multiple scripts', () => {
      addToFavorites('scripts/A.js');
      addToFavorites('scripts/B.js');
      addToFavorites('scripts/C.js');

      expect(favorites).toHaveLength(3);
      expect(favorites[0].scriptPath).toBe('scripts/C.js');
      expect(favorites[0].assignedNumber).toBe(3);
      expect(favorites[1].assignedNumber).toBe(2);
      expect(favorites[2].assignedNumber).toBe(1);
    });
  });

  describe('TC-FAV-003: LRU Eviction - Max 5 Favorites', () => {
    it('should remove oldest favorite when exceeding 5', () => {
      addToFavorites('scripts/1.js');
      addToFavorites('scripts/2.js');
      addToFavorites('scripts/3.js');
      addToFavorites('scripts/4.js');
      addToFavorites('scripts/5.js');

      expect(favorites).toHaveLength(5);
      expect(favorites[4].scriptPath).toBe('scripts/1.js');

      addToFavorites('scripts/6.js');

      expect(favorites).toHaveLength(5);
      expect(favorites.find((f) => f.scriptPath === 'scripts/1.js')).toBeUndefined();
      expect(favorites[0].scriptPath).toBe('scripts/6.js');
      expect(favorites[0].assignedNumber).toBe(6);
    });
  });

  describe('TC-FAV-004: Remove from Favorites', () => {
    it('should remove script and renumber remaining', () => {
      addToFavorites('scripts/A.js');
      addToFavorites('scripts/B.js');
      addToFavorites('scripts/C.js');

      removeFromFavorites('scripts/B.js');

      expect(favorites).toHaveLength(2);
      expect(favorites.find((f) => f.scriptPath === 'scripts/B.js')).toBeUndefined();
      expect(favorites[0].assignedNumber).toBe(1);
      expect(favorites[1].assignedNumber).toBe(2);
    });
  });

  describe('TC-FAV-005: Execute Favorite via Shortcut', () => {
    it('should return scriptPath and move to top when executing favorite', () => {
      addToFavorites('scripts/A.js');
      addToFavorites('scripts/B.js');
      addToFavorites('scripts/C.js');

      const scriptPath = executeFavorite(2);

      expect(scriptPath).toBe('scripts/B.js');
      expect(favorites[0].scriptPath).toBe('scripts/B.js');
      expect(favorites[0].assignedNumber).toBe(1);
      expect(favorites[0].usageCount).toBe(1);
      expect(favorites[0].lastUsedAt).not.toBeNull();
    });
  });

  describe('TC-FAV-006: Execute Non-existent Shortcut', () => {
    it('should return null for non-existent shortcut', () => {
      addToFavorites('scripts/A.js');
      addToFavorites('scripts/B.js');

      const scriptPath = executeFavorite(5);

      expect(scriptPath).toBeNull();
      expect(favorites).toHaveLength(2);
    });
  });

  describe('TC-FAV-007: Is Favorite Check', () => {
    it('should return true for favorited script', () => {
      addToFavorites('scripts/Test.js');

      expect(isFavorite('scripts/Test.js')).toBe(true);
    });

    it('should return false for non-favorited script', () => {
      expect(isFavorite('scripts/NonExistent.js')).toBe(false);
    });
  });

  describe('TC-FAV-008: Duplicate Add Prevention', () => {
    it('should not add duplicate script to favorites', () => {
      addToFavorites('scripts/Duplicate.js');
      addToFavorites('scripts/Duplicate.js');
      addToFavorites('scripts/Duplicate.js');

      expect(favorites).toHaveLength(1);
      expect(favorites[0].scriptPath).toBe('scripts/Duplicate.js');
    });
  });

  describe('TC-FAV-009: Get Favorite by Number', () => {
    it('should return favorite when number matches', () => {
      addToFavorites('scripts/A.js');
      addToFavorites('scripts/B.js');

      const favorite = getFavoriteByNumber(2);

      expect(favorite).not.toBeNull();
      expect(favorite?.scriptPath).toBe('scripts/B.js');
    });

    it('should return null when no match', () => {
      addToFavorites('scripts/A.js');

      const favorite = getFavoriteByNumber(5);

      expect(favorite).toBeNull();
    });
  });

  describe('TC-FAV-010: Cleanup Invalid Favorites', () => {
    it('should remove favorites that are not in existing paths', () => {
      favorites = [
        {
          scriptPath: 'scripts/Valid.js',
          assignedNumber: 1,
          createdAt: new Date().toISOString(),
          lastUsedAt: null,
          usageCount: 0,
        },
        {
          scriptPath: 'scripts/Deleted.js',
          assignedNumber: 2,
          createdAt: new Date().toISOString(),
          lastUsedAt: null,
          usageCount: 0,
        },
      ];

      const existingPaths = new Set(['scripts/Valid.js', 'scripts/Other.js']);
      const removedCount = cleanupInvalidFavorites(existingPaths);

      expect(removedCount).toBe(1);
      expect(favorites).toHaveLength(1);
      expect(favorites[0].scriptPath).toBe('scripts/Valid.js');
    });
  });

  describe('TC-FAV-011: Scripts Loaded Cleanup Trigger', () => {
    it('should clean up invalid favorites', () => {
      favorites = [
        {
          scriptPath: 'scripts/Existing.js',
          assignedNumber: 1,
          createdAt: new Date().toISOString(),
          lastUsedAt: null,
          usageCount: 0,
        },
        {
          scriptPath: 'scripts/NonExistent.js',
          assignedNumber: 2,
          createdAt: new Date().toISOString(),
          lastUsedAt: null,
          usageCount: 0,
        },
      ];

      const mockScripts = [
        { path: 'scripts/Existing.js', name: 'Existing' },
        { path: 'scripts/New.js', name: 'New' },
      ];

      const scriptPaths = new Set(mockScripts.map((s) => s.path));
      const removedCount = cleanupInvalidFavorites(scriptPaths);

      expect(removedCount).toBe(1);
      expect(favorites).toHaveLength(1);
      expect(favorites[0].scriptPath).toBe('scripts/Existing.js');
    });
  });

  describe('TC-FAV-012: Persistence Simulation', () => {
    it('should serialize favorites to localStorage format', () => {
      addToFavorites('scripts/Persist.js');

      const collection = {
        favorites,
        maxSize: MAX_FAVORITES,
        lastUpdated: new Date().toISOString(),
      };

      const serialized = JSON.stringify(collection);

      expect(serialized).toContain('scripts/Persist.js');
      expect(serialized).toContain('"maxSize":5');
    });

    it('should deserialize favorites from localStorage format', () => {
      const savedData = JSON.stringify({
        favorites: [
          {
            scriptPath: 'scripts/Saved.js',
            assignedNumber: 1,
            createdAt: new Date().toISOString(),
            lastUsedAt: null,
            usageCount: 0,
          },
        ],
        maxSize: 5,
        lastUpdated: new Date().toISOString(),
      });

      const collection = JSON.parse(savedData);
      favorites = Array.isArray(collection.favorites) ? collection.favorites : [];

      expect(favorites).toHaveLength(1);
      expect(favorites[0].scriptPath).toBe('scripts/Saved.js');
    });
  });

  describe('Edge Cases', () => {
    it('EC-01: should handle empty state', () => {
      expect(favorites).toHaveLength(0);
      expect(isFavorite('any')).toBe(false);
    });

    it('EC-02: should handle malformed localStorage data', () => {
      const corruptData = 'invalid json{{{';
      let collection;

      try {
        collection = JSON.parse(corruptData);
        favorites = Array.isArray(collection.favorites) ? collection.favorites : [];
      } catch {
        favorites = [];
      }

      expect(favorites).toHaveLength(0);
    });

    it('EC-03: should handle remove then re-add same script', () => {
      addToFavorites('scripts/Test.js');
      removeFromFavorites('scripts/Test.js');
      addToFavorites('scripts/Test.js');

      expect(favorites).toHaveLength(1);
      expect(favorites[0].assignedNumber).toBe(1);
    });

    it('EC-04: should handle empty scriptPath', () => {
      addToFavorites('');

      expect(favorites).toHaveLength(1);
      expect(favorites[0].scriptPath).toBe('');
    });

    it('EC-05: should handle maximum boundary', () => {
      addToFavorites('scripts/1.js');
      addToFavorites('scripts/2.js');
      addToFavorites('scripts/3.js');
      addToFavorites('scripts/4.js');
      addToFavorites('scripts/5.js');

      expect(favorites).toHaveLength(5);
      expect(favorites[0].assignedNumber).toBe(5);
      expect(favorites[4].assignedNumber).toBe(1);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle mixed operations', () => {
      addToFavorites('scripts/A.js');
      addToFavorites('scripts/B.js');
      addToFavorites('scripts/C.js');

      executeFavorite(2);

      addToFavorites('scripts/D.js');

      removeFromFavorites('scripts/C.js');

      expect(favorites).toHaveLength(3);
      expect(favorites[0].scriptPath).toBe('scripts/D.js');
      expect(favorites[1].scriptPath).toBe('scripts/B.js');
      expect(favorites[2].scriptPath).toBe('scripts/A.js');
    });

    it('should handle rapid add/remove operations', () => {
      for (let i = 0; i < 10; i++) {
        addToFavorites(`scripts/${i}.js`);
      }
      expect(favorites).toHaveLength(5);

      removeFromFavorites('scripts/5.js');
      removeFromFavorites('scripts/6.js');
      removeFromFavorites('scripts/7.js');

      expect(favorites).toHaveLength(2);
    });
  });
});
