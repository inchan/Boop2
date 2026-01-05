// Find utility functions for text search in editor

/**
 * Represents a single search match in the document
 */
export interface SearchMatch {
  id: string;
  start: number;
  end: number;
  line: number;
}

/**
 * Result of a search operation
 */
export interface SearchResult {
  matches: SearchMatch[];
  totalCount: number;
  durationMs: number;
}

/**
 * Find all matches of a query string in the given text
 * Uses case-insensitive matching by default
 */
export function findMatches(
  text: string,
  query: string,
  options?: { caseSensitive?: boolean; maxResults?: number }
): SearchResult {
  const startTime = performance.now();

  if (!query || query.trim() === '') {
    return { matches: [], totalCount: 0, durationMs: 0 };
  }

  const caseSensitive = options?.caseSensitive ?? false;
  const maxResults = options?.maxResults ?? Infinity;

  const matches: SearchMatch[] = [];
  const searchText = caseSensitive ? text : text.toLowerCase();
  const searchQuery = caseSensitive ? query : query.toLowerCase();

  let pos = searchText.indexOf(searchQuery);
  let matchId = 0;

  while (pos !== -1 && matches.length < maxResults) {
    const lineNumber = text.substring(0, pos).split('\n').length - 1;

    matches.push({
      id: `match-${matchId++}`,
      start: pos,
      end: pos + query.length,
      line: lineNumber,
    });

    pos = searchText.indexOf(searchQuery, pos + 1);
  }

  const durationMs = performance.now() - startTime;

  return {
    matches,
    totalCount: matches.length,
    durationMs,
  };
}

/**
 * Generate highlight ranges for rendering matches
 * Returns an array of text segments with match indicators
 */
export function highlightRanges(
  text: string,
  matches: SearchMatch[]
): Array<{ text: string; isMatch: boolean }> {
  if (matches.length === 0) {
    return [{ text, isMatch: false }];
  }

  const ranges: Array<{ text: string; isMatch: boolean }> = [];
  let lastEnd = 0;

  for (const match of matches) {
    // Add non-match text before this match
    if (match.start > lastEnd) {
      ranges.push({
        text: text.substring(lastEnd, match.start),
        isMatch: false,
      });
    }

    // Add match text
    ranges.push({
      text: text.substring(match.start, match.end),
      isMatch: true,
    });

    lastEnd = match.end;
  }

  // Add remaining text after last match
  if (lastEnd < text.length) {
    ranges.push({
      text: text.substring(lastEnd),
      isMatch: false,
    });
  }

  return ranges;
}

/**
 * Create a debounced search function for performance optimization
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  waitMs: number
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debounced = function (...args: Parameters<T>) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, waitMs);
  } as ((...args: Parameters<T>) => void) & { cancel: () => void };

  debounced.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}

/**
 * Get the next match index with wrap-around
 */
export function getNextMatchIndex(
  currentIndex: number,
  totalMatches: number,
  direction: 'next' | 'previous'
): number {
  if (totalMatches === 0) return -1;

  if (direction === 'next') {
    return (currentIndex + 1) % totalMatches;
  }

  return (currentIndex - 1 + totalMatches) % totalMatches;
}

/**
 * Generate unique match IDs
 */
export function generateMatchIds(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `match-${i}`);
}
