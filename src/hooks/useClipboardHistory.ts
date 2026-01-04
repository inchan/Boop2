import { useState, useCallback, useEffect } from 'react';

const MAX_HISTORY_SIZE = 20;

export function useClipboardHistory(enabled: boolean) {
  const [history, setHistory] = useState<string[]>([]);

  const addToHistory = useCallback(
    (text: string) => {
      if (!enabled) return;
      if (!text || text.trim() === '') return;
      setHistory((prev) =>
        [text, ...prev.filter((item) => item !== text)].slice(0, MAX_HISTORY_SIZE)
      );
    },
    [enabled]
  );

  const removeFromHistory = useCallback((index: number) => {
    setHistory((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  // 전역 paste 이벤트 리스너
  useEffect(() => {
    if (!enabled) return;

    const handlePaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData('text');
      if (text) addToHistory(text);
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [enabled, addToHistory]);

  return {
    history,
    hasHistory: history.length > 0,
    addToHistory,
    removeFromHistory,
    clearHistory,
  };
}
