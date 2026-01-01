import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import debounce from 'lodash/debounce';
import { Tab } from '../components/TabBar';

const STORAGE_KEY_CURRENT_TMP = 'boop_current_session_tmp_v3';

const generateId = () => {
  try {
    return crypto.randomUUID();
  } catch {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
};

interface UseTabsOptions {
  initialTabs?: Tab[];
  initialActiveId?: string;
}

export function useTabs(options: UseTabsOptions = {}) {
  const [tabs, setTabs] = useState<Tab[]>(() => {
    if (options.initialTabs && options.initialTabs.length > 0) {
      return options.initialTabs;
    }
    const defaultId = generateId();
    return [{ id: defaultId, title: 'Untitled', content: '' }];
  });

  const [activeTabId, setActiveTabId] = useState(() => {
    if (options.initialActiveId) return options.initialActiveId;
    if (options.initialTabs && options.initialTabs.length > 0) {
      return options.initialTabs[0].id;
    }
    return tabs[0]?.id || '';
  });

  // localStorage 저장에 debounce 적용 (300ms)
  const debouncedSaveRef = useRef(
    debounce((tabsToSave: Tab[]) => {
      try {
        localStorage.setItem(STORAGE_KEY_CURRENT_TMP, JSON.stringify(tabsToSave));
      } catch (e) {
        if (e instanceof DOMException && e.name === 'QuotaExceededError') {
          console.error('[Storage] Quota exceeded, unable to save tabs');
        }
      }
    }, 300)
  );

  useEffect(() => {
    if (tabs.length > 0) {
      debouncedSaveRef.current(tabs);
    }
  }, [tabs]);

  // 컴포넌트 언마운트 시 debounce flush
  useEffect(() => {
    return () => {
      debouncedSaveRef.current.flush();
    };
  }, []);

  const activeTab = useMemo(
    () => tabs.find((t) => t.id === activeTabId) || tabs[0],
    [tabs, activeTabId]
  );

  const addTab = useCallback(() => {
    const newId = generateId();
    setTabs((prev) => [...prev, { id: newId, title: `Untitled ${prev.length + 1}`, content: '' }]);
    setActiveTabId(newId);
    return newId;
  }, []);

  const closeTab = useCallback(
    (id: string) => {
      if (tabs.length <= 1) {
        const newId = generateId();
        setTabs([{ id: newId, title: 'Untitled', content: '' }]);
        setActiveTabId(newId);
        return;
      }
      const newTabs = tabs.filter((t) => t.id !== id);
      setTabs(newTabs);
      if (activeTabId === id) {
        setActiveTabId(newTabs[newTabs.length - 1].id);
      }
    },
    [tabs, activeTabId]
  );

  const updateTabContent = useCallback(
    (content: string) => {
      setTabs((prev) => prev.map((t) => (t.id === activeTabId ? { ...t, content } : t)));
    },
    [activeTabId]
  );

  const renameTab = useCallback((id: string, newTitle: string) => {
    setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, title: newTitle } : t)));
  }, []);

  const restoreTabs = useCallback((newTabs: Tab[], selectFirst = true) => {
    setTabs(newTabs);
    if (selectFirst && newTabs.length > 0) {
      setActiveTabId(newTabs[0].id);
    }
  }, []);

  return {
    tabs,
    activeTabId,
    activeTab,
    setActiveTabId,
    addTab,
    closeTab,
    updateTabContent,
    renameTab,
    restoreTabs,
    setTabs,
  };
}
