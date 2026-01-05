import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  findMatches,
  highlightRanges,
  getNextMatchIndex,
  generateMatchIds,
  debounce,
} from './findUtils';

describe('findUtils', () => {
  describe('findMatches', () => {
    it('returns empty result for empty query', () => {
      const result = findMatches('hello world', '');
      expect(result.matches).toEqual([]);
      expect(result.totalCount).toBe(0);
    });

    it('returns empty result for whitespace query', () => {
      const result = findMatches('hello world', '   ');
      expect(result.matches).toEqual([]);
      expect(result.totalCount).toBe(0);
    });

    it('finds single match', () => {
      const result = findMatches('hello world', 'hello');
      expect(result.totalCount).toBe(1);
      expect(result.matches[0].start).toBe(0);
      expect(result.matches[0].end).toBe(5);
      expect(result.matches[0].line).toBe(0);
    });

    it('finds multiple matches in same line', () => {
      const result = findMatches('hello hello hello', 'hello');
      expect(result.totalCount).toBe(3);
      expect(result.matches).toHaveLength(3);
      expect(result.matches[0].start).toBe(0);
      expect(result.matches[1].start).toBe(6);
      expect(result.matches[2].start).toBe(12);
    });

    it('finds matches across multiple lines', () => {
      const text = 'hello\nworld\nhello';
      const result = findMatches(text, 'hello');
      expect(result.totalCount).toBe(2);
      expect(result.matches[0].line).toBe(0);
      expect(result.matches[1].line).toBe(2);
    });

    it('is case-insensitive by default', () => {
      const result = findMatches('Hello HELLO hello', 'hello');
      expect(result.totalCount).toBe(3);
    });

    it('is case-sensitive when option set', () => {
      const result = findMatches('Hello HELLO hello', 'Hello', { caseSensitive: true });
      expect(result.totalCount).toBe(1);
      expect(result.matches[0].start).toBe(0);
    });

    it('respects maxResults option', () => {
      const result = findMatches('hello hello hello hello', 'hello', { maxResults: 2 });
      expect(result.totalCount).toBe(2);
      expect(result.matches).toHaveLength(2);
    });

    it('returns correct line numbers', () => {
      const text = 'first\nsecond line\nthird line with hello';
      const result = findMatches(text, 'hello');
      expect(result.matches[0].line).toBe(2);
    });

    it('handles overlapping matches correctly', () => {
      const result = findMatches('aaa', 'aa');
      expect(result.totalCount).toBe(2);
      expect(result.matches[0].start).toBe(0);
      expect(result.matches[0].end).toBe(2);
      expect(result.matches[1].start).toBe(1);
      expect(result.matches[1].end).toBe(3);
    });

    it('handles no matches', () => {
      const result = findMatches('hello world', 'xyz');
      expect(result.matches).toEqual([]);
      expect(result.totalCount).toBe(0);
    });

    it('generates unique match IDs', () => {
      const result = findMatches('hello hello', 'hello');
      expect(result.matches[0].id).toBe('match-0');
      expect(result.matches[1].id).toBe('match-1');
    });

    it('includes duration in result', () => {
      const result = findMatches('hello world', 'hello');
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('highlightRanges', () => {
    it('returns single segment for no matches', () => {
      const result = highlightRanges('hello world', []);
      expect(result).toEqual([{ text: 'hello world', isMatch: false }]);
    });

    it('splits text at match boundaries', () => {
      const matches = [{ id: 'm1', start: 0, end: 5, line: 0 }];
      const result = highlightRanges('hello world', matches);
      expect(result).toEqual([
        { text: 'hello', isMatch: true },
        { text: ' world', isMatch: false },
      ]);
    });

    it('handles multiple matches', () => {
      const matches = [
        { id: 'm1', start: 0, end: 5, line: 0 },
        { id: 'm2', start: 12, end: 17, line: 0 },
      ];
      const result = highlightRanges('hello beautiful world', matches);
      expect(result).toEqual([
        { text: 'hello', isMatch: true },
        { text: ' beauti', isMatch: false },
        { text: 'ful w', isMatch: true },
        { text: 'orld', isMatch: false },
      ]);
    });

    it('handles match at end of text', () => {
      const matches = [{ id: 'm1', start: 6, end: 11, line: 0 }];
      const result = highlightRanges('hello world', matches);
      expect(result).toEqual([
        { text: 'hello ', isMatch: false },
        { text: 'world', isMatch: true },
      ]);
    });

    it('handles match at start of text', () => {
      const matches = [{ id: 'm1', start: 0, end: 5, line: 0 }];
      const result = highlightRanges('hello world', matches);
      expect(result).toEqual([
        { text: 'hello', isMatch: true },
        { text: ' world', isMatch: false },
      ]);
    });

    it('handles entire text as match', () => {
      const matches = [{ id: 'm1', start: 0, end: 11, line: 0 }];
      const result = highlightRanges('hello world', matches);
      expect(result).toEqual([{ text: 'hello world', isMatch: true }]);
    });

    it('handles adjacent matches', () => {
      const matches = [
        { id: 'm1', start: 0, end: 5, line: 0 },
        { id: 'm2', start: 5, end: 10, line: 0 },
      ];
      const result = highlightRanges('helloworld', matches);
      expect(result).toEqual([
        { text: 'hello', isMatch: true },
        { text: 'world', isMatch: true },
      ]);
    });
  });

  describe('getNextMatchIndex', () => {
    it('returns -1 for no matches', () => {
      expect(getNextMatchIndex(0, 0, 'next')).toBe(-1);
    });

    it('wraps around to first match when going next from last', () => {
      expect(getNextMatchIndex(2, 3, 'next')).toBe(0);
    });

    it('wraps around to last match when going previous from first', () => {
      expect(getNextMatchIndex(0, 3, 'previous')).toBe(2);
    });

    it('increments index for next direction', () => {
      expect(getNextMatchIndex(0, 5, 'next')).toBe(1);
      expect(getNextMatchIndex(1, 5, 'next')).toBe(2);
    });

    it('decrements index for previous direction', () => {
      expect(getNextMatchIndex(2, 5, 'previous')).toBe(1);
      expect(getNextMatchIndex(1, 5, 'previous')).toBe(0);
    });

    it('handles single match', () => {
      expect(getNextMatchIndex(0, 1, 'next')).toBe(0);
      expect(getNextMatchIndex(0, 1, 'previous')).toBe(0);
    });
  });

  describe('generateMatchIds', () => {
    it('generates correct number of IDs', () => {
      expect(generateMatchIds(0)).toEqual([]);
      expect(generateMatchIds(1)).toHaveLength(1);
      expect(generateMatchIds(5)).toHaveLength(5);
    });

    it('generates sequential IDs', () => {
      expect(generateMatchIds(3)).toEqual(['match-0', 'match-1', 'match-2']);
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('delays function execution', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced();
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('cancels pending timeout', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced();
      debounced();
      debounced();

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('has cancel method', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced();
      expect(fn).not.toHaveBeenCalled();

      debounced.cancel();
      vi.advanceTimersByTime(100);
      expect(fn).not.toHaveBeenCalled();
    });
  });
});
