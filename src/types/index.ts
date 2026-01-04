// Favorites feature types

export interface FavoriteScript {
  /** Primary key reference to the script */
  scriptPath: string;
  /** Assigned keyboard shortcut (1-5) */
  assignedNumber: number;
  /** ISO 8601 timestamp when favorited */
  createdAt: string;
  /** ISO 8601 timestamp when last executed via shortcut (for LRU) */
  lastUsedAt: string | null;
  /** Number of times executed via favorite shortcut */
  usageCount: number;
}

export interface FavoritesCollection {
  /** Ordered list of favorites (max 5 items, ordered by createdAt) */
  favorites: FavoriteScript[];
  /** Configuration constant - always 5 */
  maxSize: number;
  /** ISO 8601 timestamp when collection was last modified */
  lastUpdated: string;
}
