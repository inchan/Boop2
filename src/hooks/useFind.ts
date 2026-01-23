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
    caseSensitive: false,
    wholeWord: false,
  });

  // Use ref to always have latest documentText for replace operations
  const documentTextRef = useRef(documentText);
  useEffect(() => {
    documentTextRef.current = documentText;
  }, [documentText]);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const performSearch = useCallback((term: string, caseSensitive: boolean, wholeWord: boolean) => {
    if (term.trim() === '') {
      setFindState((prev) => ({
        ...prev,
        matches: [],
        activeIndex: -1,
      }));
      return;
    }

    const result = findMatches(documentTextRef.current, term, {
      caseSensitive,
      wholeWord,
    });
    setFindState((prev) => ({
      ...prev,
      matches: result.matches,
      activeIndex: result.matches.length > 0 ? 0 : -1,
    }));
  }, []);

  // Re-search when documentText changes (after replace) - using ref to avoid cascading renders
  const prevDocumentTextRef = useRef(documentText);
  useEffect(() => {
    if (prevDocumentTextRef.current !== documentText && findState.searchTerm.trim() !== '') {
      prevDocumentTextRef.current = documentText;
      // Schedule state update for next tick to avoid cascading render
      const timeoutId = setTimeout(() => {
        const result = findMatches(documentText, findState.searchTerm, {
          caseSensitive: findState.caseSensitive,
          wholeWord: findState.wholeWord,
        });
        setFindState((prev) => ({
          ...prev,
          matches: result.matches,
          activeIndex:
            result.matches.length > 0 ? Math.min(prev.activeIndex, result.matches.length - 1) : -1,
        }));
      }, 0);
      return () => clearTimeout(timeoutId);
    }
    prevDocumentTextRef.current = documentText;
  }, [documentText, findState.searchTerm, findState.caseSensitive, findState.wholeWord]);

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

      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        setFindState((current) => {
          performSearch(term, current.caseSensitive, current.wholeWord);
          return current;
        });
      }, DEBOUNCE_MS);
    },
    [performSearch]
  );

  const setReplaceTerm = useCallback((term: string) => {
    setFindState((prev) => ({ ...prev, replaceTerm: term }));
  }, []);

  const toggleCaseSensitive = useCallback(() => {
    setFindState((prev) => {
      const newCaseSensitive = !prev.caseSensitive;
      // Trigger re-search with new option
      if (prev.searchTerm.trim() !== '') {
        const result = findMatches(documentTextRef.current, prev.searchTerm, {
          caseSensitive: newCaseSensitive,
          wholeWord: prev.wholeWord,
        });
        return {
          ...prev,
          caseSensitive: newCaseSensitive,
          matches: result.matches,
          activeIndex: result.matches.length > 0 ? 0 : -1,
        };
      }
      return { ...prev, caseSensitive: newCaseSensitive };
    });
  }, []);

  const toggleWholeWord = useCallback(() => {
    setFindState((prev) => {
      const newWholeWord = !prev.wholeWord;
      // Trigger re-search with new option
      if (prev.searchTerm.trim() !== '') {
        const result = findMatches(documentTextRef.current, prev.searchTerm, {
          caseSensitive: prev.caseSensitive,
          wholeWord: newWholeWord,
        });
        return {
          ...prev,
          wholeWord: newWholeWord,
          matches: result.matches,
          activeIndex: result.matches.length > 0 ? 0 : -1,
        };
      }
      return { ...prev, wholeWord: newWholeWord };
    });
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
    // Use current state snapshot for replace operation
    const currentText = documentTextRef.current;

    setFindState((prev) => {
      if (prev.matches.length === 0 || prev.activeIndex < 0) return prev;

      const activeMatch = prev.matches[prev.activeIndex];
      const before = currentText.slice(0, activeMatch.start);
      const after = currentText.slice(activeMatch.end);

      const replacedText = before + prev.replaceTerm + after;

      // Call onReplace callback to update editor
      onReplace?.(replacedText);

      // Return state unchanged - the useEffect will re-search with new documentText
      return prev;
    });
  }, [onReplace]);

  const replaceAll = useCallback(() => {
    const currentText = documentTextRef.current;

    setFindState((prev) => {
      if (prev.matches.length === 0) return prev;

      let replacedText = currentText;
      // Sort matches in reverse order to prevent offset issues
      const matches = [...prev.matches].sort((a, b) => b.start - a.start);

      for (const match of matches) {
        const before = replacedText.slice(0, match.start);
        const after = replacedText.slice(match.end);
        replacedText = before + prev.replaceTerm + after;
      }

      // Call onReplace callback to update editor
      onReplace?.(replacedText);

      // Return state unchanged - the useEffect will re-search with new documentText
      return prev;
    });
  }, [onReplace]);

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
    toggleCaseSensitive,
    toggleWholeWord,
  };
}
