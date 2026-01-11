import { useState, useCallback, useRef, useEffect } from 'react';
import debounce from 'lodash/debounce';
import {
  Tab,
  WorkspaceSnapshot,
  normalizeWorkspace,
  createDefaultGroup,
  DEFAULT_GROUP_ID,
  toggleGroupCollapsed,
  setGroupColor,
  renameGroup,
  deleteGroup,
  moveTabToGroup,
  findTabToActivateInGroup,
  GroupColor,
} from '../lib/tabGroups';

const STORAGE_KEY_WORKSPACE_V1 = 'boop_workspace_v1';
// Legacy keys for migration
const STORAGE_KEY_CURRENT_TMP_V3 = 'boop_current_session_tmp_v3';

const generateId = () => {
  try {
    return crypto.randomUUID();
  } catch {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
};

export function useWorkspace() {
  const [workspace, setWorkspace] = useState<WorkspaceSnapshot>(() => ({
    version: 1,
    tabs: [],
    groups: [createDefaultGroup()],
    activeTabId: '',
  }));
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize: Load from storage (v1 -> v3 migration -> default)
  useEffect(() => {
    const load = () => {
      try {
        // 1. Try V1
        const v1 = localStorage.getItem(STORAGE_KEY_WORKSPACE_V1);
        if (v1) {
          const parsed = JSON.parse(v1);
          setWorkspace(normalizeWorkspace(parsed));
          setIsInitialized(true);
          return;
        }

        // 2. Try V3 Migration
        const v3 = localStorage.getItem(STORAGE_KEY_CURRENT_TMP_V3);
        if (v3) {
          const parsed = JSON.parse(v3);
          const migrated = normalizeWorkspace(parsed); // treats array as tabs
          setWorkspace(migrated);
          setIsInitialized(true);
          return;
        }

        // 3. Default
        console.log('[useWorkspace] No saved data found, creating default workspace');
        setWorkspace(normalizeWorkspace(null));
        setIsInitialized(true);
      } catch (e) {
        console.error('Failed to load workspace:', e);
        setWorkspace(normalizeWorkspace(null));
        setIsInitialized(true);
      }
    };
    load();
  }, []);

  // Persist: Debounced save
  const debouncedSaveRef = useRef(
    debounce((ws: WorkspaceSnapshot) => {
      try {
        localStorage.setItem(STORAGE_KEY_WORKSPACE_V1, JSON.stringify(ws));
      } catch (e) {
        console.error('Failed to save workspace:', e);
      }
    }, 300)
  );

  useEffect(() => {
    if (isInitialized) {
      debouncedSaveRef.current(workspace);
    }
  }, [workspace, isInitialized]);

  useEffect(() => {
    const debouncedSave = debouncedSaveRef.current;
    return () => {
      debouncedSave.flush();
    };
  }, []);

  // --- Actions ---

  const setActiveTabId = useCallback((id: string) => {
    setWorkspace((prev) => ({ ...prev, activeTabId: id }));
  }, []);

  const addTab = useCallback((groupId: string = DEFAULT_GROUP_ID) => {
    const newId = generateId();
    setWorkspace((prev) => {
      // Ensure group exists, fallback to default
      const targetGroup = prev.groups.find((g) => g.id === groupId) ? groupId : DEFAULT_GROUP_ID;

      const newTab: Tab = {
        id: newId,
        title: `Untitled ${prev.tabs.length + 1}`,
        content: '',
        groupId: targetGroup,
      };

      // Add to end of global list (rendering logic will group them)
      // Ideally we insert it at the end of the specific group in the array
      // But for now simple append + moveTabToGroup logic if needed.
      // Let's just append. Reordering happens in UI or specific move actions.
      // Wait, if we append, it might not be visually inside the group if tabs are sorted by index.
      // `moveTabToGroup` places it correctly. Let's use that helper if possible, or just append.
      // Simple append works if the UI filters by group.

      return {
        ...prev,
        tabs: [...prev.tabs, newTab],
        activeTabId: newId,
      };
    });
    return newId;
  }, []);

  const closeTab = useCallback((id: string) => {
    setWorkspace((prev) => {
      if (prev.tabs.length <= 1) {
        // Don't allow closing last tab, reset content instead
        const newId = generateId();
        const resetTab: Tab = {
          id: newId,
          title: 'Untitled',
          content: '',
          groupId: DEFAULT_GROUP_ID,
        };
        return {
          ...prev,
          tabs: [resetTab],
          activeTabId: newId,
        };
      }

      const newTabs = prev.tabs.filter((t) => t.id !== id);
      let newActiveId = prev.activeTabId;

      if (prev.activeTabId === id) {
        // Select nearest tab
        const index = prev.tabs.findIndex((t) => t.id === id);
        const nextTab = newTabs[index] || newTabs[index - 1] || newTabs[0];
        newActiveId = nextTab.id;
      }

      return {
        ...prev,
        tabs: newTabs,
        activeTabId: newActiveId,
      };
    });
  }, []);

  const updateTabContent = useCallback((id: string, content: string) => {
    setWorkspace((prev) => ({
      ...prev,
      tabs: prev.tabs.map((t) => (t.id === id ? { ...t, content } : t)),
    }));
  }, []);

  const renameTab = useCallback((id: string, title: string) => {
    setWorkspace((prev) => ({
      ...prev,
      tabs: prev.tabs.map((t) => (t.id === id ? { ...t, title } : t)),
    }));
  }, []);

  // --- Group Actions ---

  const handleCreateGroup = useCallback((title: string = 'New Group') => {
    const newId = generateId();
    setWorkspace((prev) => ({
      ...prev,
      groups: [
        ...prev.groups,
        {
          id: newId,
          title,
          color: '#64748b', // Default color
          collapsed: false,
        },
      ],
    }));
    return newId;
  }, []);

  const handleToggleGroup = useCallback((groupId: string) => {
    setWorkspace((prev) => ({
      ...prev,
      groups: toggleGroupCollapsed(prev.groups, groupId),
    }));
  }, []);

  const handleSetGroupColor = useCallback((groupId: string, color: GroupColor) => {
    setWorkspace((prev) => ({
      ...prev,
      groups: setGroupColor(prev.groups, groupId, color),
    }));
  }, []);

  const handleRenameGroup = useCallback((groupId: string, title: string) => {
    setWorkspace((prev) => ({
      ...prev,
      groups: renameGroup(prev.groups, groupId, title),
    }));
  }, []);

  const handleDeleteGroup = useCallback((groupId: string) => {
    setWorkspace((prev) => {
      const { groups, tabs } = deleteGroup(prev.groups, prev.tabs, groupId);
      return {
        ...prev,
        groups,
        tabs,
      };
    });
  }, []);

  const handleMoveTabToGroup = useCallback((tabId: string, groupId: string) => {
    setWorkspace((prev) => ({
      ...prev,
      tabs: moveTabToGroup(prev.tabs, tabId, groupId),
    }));
  }, []);

  const handleActivateGroup = useCallback((groupId: string) => {
    setWorkspace((prev) => {
      // 1. Try to find existing tab in group
      const targetTabId = findTabToActivateInGroup(prev.tabs, groupId);
      if (targetTabId) {
        return { ...prev, activeTabId: targetTabId };
      }

      // 2. If empty, create new tab in that group
      const newId = generateId();
      const newTab: Tab = {
        id: newId,
        title: 'Untitled 1',
        content: '',
        groupId: groupId,
      };
      return {
        ...prev,
        tabs: [...prev.tabs, newTab],
        activeTabId: newId,
      };
    });
  }, []);

  // Session Restore Helper
  const restoreSession = useCallback((newTabs: Tab[], selectFirst = true) => {
    // Session restore usually provides just tabs. We need to normalize it into the workspace.
    // If sessions save 'WorkspaceSnapshot', we can restore full state.
    // For now, assume session.tabs is Tab[] (legacy or new).
    // If it's new Tab[], it has groupIds.
    // We should probably merge groups if they don't exist, or reset workspace.

    // Simplest approach: Treat restored tabs as the new workspace state, keeping existing groups if compatible
    // OR Normalize the input.

    const snapshot = normalizeWorkspace(newTabs); // Will assign default group if missing
    setWorkspace((prev) => ({
      ...prev,
      tabs: snapshot.tabs,
      // If we want to keep existing groups, we might need logic.
      // But usually restore replaces the session.
      // Let's reset to default groups for now unless we enhance Session model to store groups too.
      groups: [createDefaultGroup()],
      activeTabId: selectFirst && snapshot.tabs.length > 0 ? snapshot.tabs[0].id : prev.activeTabId,
    }));
  }, []);

  return {
    workspace,
    isInitialized,
    activeTabId: workspace.activeTabId,
    activeTab:
      workspace.tabs.find((t) => t.id === workspace.activeTabId) ||
      workspace.tabs[0] ||
      ({
        id: 'dummy',
        title: 'Loading...',
        content: '',
        groupId: DEFAULT_GROUP_ID,
      } as Tab),
    // Tab Actions
    setActiveTabId,
    addTab,
    closeTab,
    updateTabContent,
    renameTab,
    restoreSession, // Replaces restoreTabs
    // Group Actions
    createGroup: handleCreateGroup,
    toggleGroup: handleToggleGroup,
    setGroupColor: handleSetGroupColor,
    renameGroup: handleRenameGroup,
    deleteGroup: handleDeleteGroup,
    moveTabToGroup: handleMoveTabToGroup,
    activateGroup: handleActivateGroup,
  };
}
