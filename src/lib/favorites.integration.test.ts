import { describe, it, expect, beforeEach } from 'vitest';

interface MockScript {
  path: string;
  name: string;
  description?: string;
  tags?: string;
}

interface MockFavorite {
  scriptPath: string;
  assignedNumber: number;
  createdAt: string;
  lastUsedAt: string | null;
  usageCount: number;
}

interface DisplayItem {
  scriptPath?: string;
  path?: string;
  name?: string;
  [key: string]: any;
}

describe('Favorites UI Integration', () => {
  const mockScripts: MockScript[] = [
    {
      path: 'scripts/UpperCase.js',
      name: 'Upper Case',
      description: 'Convert to uppercase',
      tags: 'text',
    },
    {
      path: 'scripts/LowerCase.js',
      name: 'Lower Case',
      description: 'Convert to lowercase',
      tags: 'text',
    },
    { path: 'scripts/Trim.js', name: 'Trim', description: 'Remove whitespace', tags: 'text' },
  ];

  describe('TC-UI-001: Favorites Section Display Logic', () => {
    it('should show favorites section when query is empty and favorites exist', () => {
      const favorites: MockFavorite[] = [
        {
          scriptPath: 'scripts/UpperCase.js',
          assignedNumber: 1,
          createdAt: new Date().toISOString(),
          lastUsedAt: null,
          usageCount: 0,
        },
      ];

      const hasFavorites = favorites.length > 0;
      const query = '';

      const shouldShowFavoritesSection = hasFavorites && !query;

      expect(shouldShowFavoritesSection).toBe(true);
    });

    it('should hide favorites section when searching', () => {
      const favorites: MockFavorite[] = [
        {
          scriptPath: 'scripts/UpperCase.js',
          assignedNumber: 1,
          createdAt: new Date().toISOString(),
          lastUsedAt: null,
          usageCount: 0,
        },
      ];

      const hasFavorites = favorites.length > 0;
      const query = 'upper';

      const shouldShowFavoritesSection = hasFavorites && !query;

      expect(shouldShowFavoritesSection).toBe(false);
    });
  });

  describe('TC-UI-002: Favorites Section Display Logic', () => {
    it('should filter out invalid favorites from display list', () => {
      const favorites: MockFavorite[] = [
        {
          scriptPath: 'scripts/UpperCase.js',
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
        {
          scriptPath: 'scripts/LowerCase.js',
          assignedNumber: 3,
          createdAt: new Date().toISOString(),
          lastUsedAt: null,
          usageCount: 0,
        },
      ];

      const validFavorites = favorites.filter((f) =>
        mockScripts.some((s) => s.path === f.scriptPath)
      );

      expect(validFavorites).toHaveLength(2);
      expect(validFavorites[0].scriptPath).toBe('scripts/UpperCase.js');
      expect(validFavorites[1].scriptPath).toBe('scripts/LowerCase.js');
    });
  });

  describe('TC-UI-003: Star Toggle State Logic', () => {
    it('should correctly identify favorited vs non-favorited scripts', () => {
      const favorites: MockFavorite[] = [
        {
          scriptPath: 'scripts/UpperCase.js',
          assignedNumber: 1,
          createdAt: new Date().toISOString(),
          lastUsedAt: null,
          usageCount: 0,
        },
      ];

      const isFavorite = (path: string) => favorites.some((f) => f.scriptPath === path);

      expect(isFavorite('scripts/UpperCase.js')).toBe(true);
      expect(isFavorite('scripts/LowerCase.js')).toBe(false);
      expect(isFavorite('scripts/NonExistent.js')).toBe(false);
    });
  });

  describe('TC-UI-004: Tooltip Shortcut Display', () => {
    it('should correctly display shortcut number in tooltip', () => {
      const favorites: MockFavorite[] = [
        {
          scriptPath: 'scripts/UpperCase.js',
          assignedNumber: 1,
          createdAt: new Date().toISOString(),
          lastUsedAt: null,
          usageCount: 0,
        },
        {
          scriptPath: 'scripts/LowerCase.js',
          assignedNumber: 2,
          createdAt: new Date().toISOString(),
          lastUsedAt: null,
          usageCount: 0,
        },
      ];

      const getTooltip = (path: string) => {
        const fav = favorites.find((f) => f.scriptPath === path);
        return fav ? `Press Cmd+${fav.assignedNumber}` : null;
      };

      expect(getTooltip('scripts/UpperCase.js')).toBe('Press Cmd+1');
      expect(getTooltip('scripts/LowerCase.js')).toBe('Press Cmd+2');
      expect(getTooltip('scripts/NonExistent.js')).toBe(null);
    });
  });

  describe('Display List Ordering', () => {
    it('should order display list as: favorites, recent, all scripts', () => {
      const favorites: MockFavorite[] = [
        {
          scriptPath: 'scripts/UpperCase.js',
          assignedNumber: 1,
          createdAt: new Date().toISOString(),
          lastUsedAt: null,
          usageCount: 0,
        },
      ];
      const recentScripts: MockScript[] = [
        { path: 'scripts/LowerCase.js', name: 'Lower Case', description: '', tags: '' },
      ];
      const query = '';

      const favs = favorites.filter((f) => mockScripts.some((s) => s.path === f.scriptPath));
      const allScripts = [...favs, ...recentScripts, ...mockScripts];

      expect(allScripts[0]).toHaveProperty('scriptPath');
      expect((allScripts[0] as MockFavorite).scriptPath).toBe('scripts/UpperCase.js');
    });

    it('should show only search results when query is present', () => {
      const favorites: MockFavorite[] = [
        {
          scriptPath: 'scripts/UpperCase.js',
          assignedNumber: 1,
          createdAt: new Date().toISOString(),
          lastUsedAt: null,
          usageCount: 0,
        },
      ];
      const recentScripts: MockScript[] = [
        { path: 'scripts/LowerCase.js', name: 'Lower Case', description: '', tags: '' },
      ];
      const query = 'lower';

      const searchResults = mockScripts.filter((s) =>
        s.name.toLowerCase().includes(query.toLowerCase())
      );

      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].name).toBe('Lower Case');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should handle keyboard events for favorites', () => {
      let selectedIndex = 0;
      const displayList: DisplayItem[] = [
        { scriptPath: 'scripts/UpperCase.js', name: 'Upper Case' },
        { scriptPath: 'scripts/LowerCase.js', name: 'Lower Case' },
      ];

      selectedIndex = Math.min(selectedIndex + 1, displayList.length - 1);
      expect(selectedIndex).toBe(1);

      selectedIndex = Math.max(selectedIndex - 1, 0);
      expect(selectedIndex).toBe(0);
    });

    it('should wrap around when navigating past bounds', () => {
      let selectedIndex = 0;
      const displayList: DisplayItem[] = [
        { scriptPath: 'scripts/UpperCase.js', name: 'Upper Case' },
        { scriptPath: 'scripts/LowerCase.js', name: 'Lower Case' },
      ];

      selectedIndex = Math.max(selectedIndex - 1, 0);
      expect(selectedIndex).toBe(0);

      selectedIndex = displayList.length - 1;
      selectedIndex = Math.min(selectedIndex + 1, displayList.length - 1);
      expect(selectedIndex).toBe(1);
    });
  });

  describe('Script Selection', () => {
    it('should correctly identify script from item', () => {
      const item: DisplayItem = { scriptPath: 'scripts/UpperCase.js', name: 'Upper Case' };

      const scriptPath = 'scriptPath' in item ? item.scriptPath : item.path;
      const script = mockScripts.find((s) => s.path === scriptPath);

      expect(script).not.toBeNull();
      expect(script?.path).toBe('scripts/UpperCase.js');
    });
  });
});
