import { useState, useCallback, useRef, useEffect } from 'react';
import { FindState, UseFindOptions, UseFindReturn } from '../types/find';
import { findMatches } from '../lib/findUtils';

const DEBOUNCE_MS = 100;

export function useFind(options: UseFindOptions): UseFindReturn {
  const { documentText, initialOpen = false, onReplace } = options;

  const [findState, setFindState] = useState<FindState>({
    isOpen: initialOpen,
    searchTerm: '',
    replaceTerm: '',
    matches: [],
    activeIndex: -1,
    isComposing: false,
  });

  const isComposingRef = useRef(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const performSearch = useCallback(
    (term: string) => {
      if (term.trim() === '') {
        setFindState((prev) => ({
          ...prev,
          matches: [],
          activeIndex: -1,
        }));
        return;
      }

      const result = findMatches(documentText, term);
      setFindState((prev) => ({
        ...prev,
        matches: result.matches,
        activeIndex: result.matches.length > 0 ? 0 : -1,
      }));
    },
    [documentText]
  );

  const openFind = useCallback(() => {
    setFindState((prev) => ({ ...prev, isOpen: true }));
  }, []);

  const closeFind = useCallback(() => {
    setFindState((prev) => ({
      ...prev,
      isOpen: false,
      searchTerm: '',
      replaceTerm: '',
      matches: [],
      activeIndex: -1,
    }));
  }, []);

  const toggleFind = useCallback(() => {
    setFindState((prev) => ({
      ...prev,
      isOpen: !prev.isOpen,
      searchTerm: prev.isOpen ? '' : prev.searchTerm,
      replaceTerm: prev.isOpen ? '' : prev.replaceTerm,
      matches: prev.isOpen ? [] : prev.matches,
      activeIndex: prev.isOpen ? -1 : prev.activeIndex,
    }));
  }, []);

  const setSearchTerm = useCallback(
    (term: string) => {
      setFindState((prev) => ({ ...prev, searchTerm: term }));

      if (isComposingRef.current) {
        return;
      }

      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        performSearch(term);
      }, DEBOUNCE_MS);
    },
    [performSearch]
  );

  const setReplaceTerm = useCallback((term: string) => {
    setFindState((prev) => ({ ...prev, replaceTerm: term }));
  }, []);

  const goToNext = useCallback(() => {
    setFindState((prev) => {
      if (prev.matches.length === 0) return prev;
      const nextIndex = (prev.activeIndex + 1) % prev.matches.length;
      return { ...prev, activeIndex: nextIndex };
    });
  }, []);

  const goToPrevious = useCallback(() => {
    setFindState((prev) => {
      if (prev.matches.length === 0) return prev;
      const prevIndex = prev.activeIndex <= 0 ? prev.matches.length - 1 : prev.activeIndex - 1;
      return { ...prev, activeIndex: prevIndex };
    });
  }, []);

  const clearSearch = useCallback(() => {
    setFindState((prev) => ({
      ...prev,
      searchTerm: '',
      matches: [],
      activeIndex: -1,
    }));
  }, []);

  const replaceCurrent = useCallback(() => {
    setFindState((prev) => {
      if (prev.matches.length === 0 || prev.activeIndex < 0) return prev;

      const activeMatch = prev.matches[prev.activeIndex];
      const before = documentText.slice(0, activeMatch.start);
      const after = documentText.slice(activeMatch.end);

      const replacedText = before + prev.replaceTerm + after;
      const result = findMatches(replacedText, prev.searchTerm);

      let newActiveIndex = prev.activeIndex;
      if (result.matches.length > 0) {
        const replacedLengthDiff = prev.replaceTerm.length - (activeMatch.end - activeMatch.start);
        if (replacedLengthDiff !== 0) {
          for (let i = prev.activeIndex + 1; i < result.matches.length; i++) {
            result.matches[i].start += replacedLengthDiff;
            result.matches[i].end += replacedLengthDiff;
          }
        }
        newActiveIndex = (prev.activeIndex + 1) % result.matches.length;
      }

      // Call onReplace callback to update editor
      onReplace?.(replacedText);

      return {
        ...prev,
        matches: result.matches,
        activeIndex: result.matches.length > 0 ? newActiveIndex : -1,
      };
    });
  }, [documentText, onReplace]);

  const replaceAll = useCallback(() => {
    setFindState((prev) => {
      if (prev.matches.length === 0) return prev;

      let replacedText = documentText;
      const matches = [...prev.matches].sort((a, b) => b.start - a.start);

      for (const match of matches) {
        const before = replacedText.slice(0, match.start);
        const after = replacedText.slice(match.end);
        replacedText = before + prev.replaceTerm + after;
      }

      const result = findMatches(replacedText, prev.searchTerm);

      // Call onReplace callback to update editor
      onReplace?.(replacedText);

      return {
        ...prev,
        matches: result.matches,
        activeIndex: result.matches.length > 0 ? 0 : -1,
      };
    });
  }, [documentText, onReplace]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return {
    findState,
    openFind,
    closeFind,
    toggleFind,
    setSearchTerm,
    setReplaceTerm,
    goToNext,
    goToPrevious,
    clearSearch,
    replaceCurrent,
    replaceAll,
  };
}
