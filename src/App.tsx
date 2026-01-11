import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { createEditor, Descendant } from 'slate';
import { withReact } from 'slate-react';
import { withHistory } from 'slate-history';
import SlateEditor, { SlateEditorHandle, CustomEditor } from './components/SlateEditor';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CommandPalette } from './components/CommandPalette';
import { FindPanel } from './components/FindPanel';
import { TabBar } from './components/TabBar';
import { ClipboardPopover } from './components/ClipboardPopover';
import { SessionPopover, Session } from './components/SessionPopover';
import { SettingsPopover, Settings } from './components/SettingsPopover';
import { ScriptModel, runScriptAsync } from './lib/ScriptRunner';
import { ExecutionContextData } from './lib/WorkerTypes';
import { UpdateNotification } from './components/UpdateNotification';
import { checkForUpdates, type UpdateInfo } from './lib/updater';
import { useFind } from './hooks/useFind';
import { DEFAULT_SETTINGS } from './hooks/useSettings';
import { useWorkspace } from './hooks/useWorkspace';
import { DEFAULT_GROUP_ID } from './lib/tabGroups';
import './App.css';

const STORAGE_KEY_SESSIONS = 'boop_sessions_stack_v3';
// const STORAGE_KEY_CURRENT_TMP = 'boop_current_session_tmp_v3'; // Handled by useWorkspace
const STORAGE_KEY_SETTINGS = 'boop_settings_v1';

function App() {
  const {
    workspace,
    isInitialized: isWorkspaceInitialized,
    activeTabId,
    activeTab,
    setActiveTabId,
    addTab,
    closeTab,
    updateTabContent,
    renameTab,
    restoreSession,
    createGroup,
    renameGroup,
    moveTabToGroup,
    activateGroup,
  } = useWorkspace();

  const [clipboardHistory, setClipboardHistory] = useState<string[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isClipboardOpen, setIsClipboardOpen] = useState(false);
  const [isSessionsOpen, setIsSessionsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const slateEditorRef = useRef<SlateEditorHandle>(null);

  // 텍스트를 Slate 노드로 변환하는 헬퍼
  const textToSlateValue = (text: string): Descendant[] => {
    const lines = text.split('\n');
    return lines.map((line) => ({
      type: 'paragraph' as const,
      children: [{ text: line }],
    }));
  };

  // 탭별 에디터 인스턴스 맵
  const editorsMapRef = useRef<Map<string, CustomEditor>>(new Map());
  const [editorVersion, setEditorVersion] = useState(0);

  // 현재 활성 탭의 에디터 인스턴스 (ref를 캐시로 사용하는 의도적 패턴)
  /* eslint-disable react-hooks/refs, react-hooks/exhaustive-deps */
  const activeEditor = useMemo((): CustomEditor => {
    if (!activeTabId) {
      const tempEditor = withReact(withHistory(createEditor())) as CustomEditor;
      tempEditor.children = textToSlateValue('');
      return tempEditor;
    }

    const existing = editorsMapRef.current.get(activeTabId);
    if (existing) {
      return existing;
    }

    const tabContent = workspace.tabs.find((t) => t.id === activeTabId)?.content || '';
    const newEditor = withReact(withHistory(createEditor())) as CustomEditor;
    newEditor.children = textToSlateValue(tabContent);
    editorsMapRef.current.set(activeTabId, newEditor);

    return newEditor;
  }, [activeTabId, editorVersion, workspace.tabs]);
  /* eslint-enable react-hooks/refs, react-hooks/exhaustive-deps */

  const [scripts, setScripts] = useState<ScriptModel[]>([]);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [status, setStatus] = useState<{ type: 'info' | 'error' | 'success'; text: string }>({
    type: 'info',
    text: '',
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);

  useEffect(() => {
    const initialize = async () => {
      // Load settings
      let loadedSettings = DEFAULT_SETTINGS;
      try {
        const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
        if (savedSettings) {
          loadedSettings = JSON.parse(savedSettings);
          setSettings(loadedSettings);
        }
      } catch (e) {
        console.error('Failed to load settings:', e);
      }

      let sessionStack: Session[] = [];
      try {
        const savedStack = localStorage.getItem(STORAGE_KEY_SESSIONS);
        if (savedStack) sessionStack = JSON.parse(savedStack);

        // Note: Legacy session migration logic (moving tmp to stack) is disabled
        // to let useWorkspace handle V3 -> V1 migration seamlessly without clearing data.
      } catch (error) {
        console.error(error);
      }
      setSessions(sessionStack);

      setIsInitialized(true);
      try {
        const data = await invoke('load_scripts');
        const loadedScripts = data as ScriptModel[];
        setScripts(loadedScripts);
        if (!loadedSettings.autoRestoreLastSession || sessionStack.length === 0) {
          setStatus({ type: 'info', text: `${loadedScripts.length} scripts loaded` });
        }
      } catch {
        setStatus({ type: 'error', text: 'Error loading scripts' });
      }

      if (loadedSettings.enableAutoUpdate) {
        try {
          const info = await checkForUpdates();
          if (info.available) {
            setUpdateInfo(info);
          }
        } catch (error) {
          console.error('[Updater] Check failed:', error);
        }
      }
    };
    initialize();
  }, []);

  // 교체 콜백
  const handleReplace = useCallback(
    (newText: string) => {
      updateTabContent(activeTabId, newText);
    },
    [activeTabId, updateTabContent]
  );

  // Find feature hook
  const {
    findState,
    closeFind,
    toggleFind,
    setSearchTerm,
    setReplaceTerm,
    goToNext,
    goToPrevious,
    replaceCurrent,
    replaceAll,
  } = useFind({
    documentText: activeTab?.content || '',
    initialOpen: false,
    onReplace: handleReplace,
  });

  const handleAddTab = useCallback(() => {
    addTab(DEFAULT_GROUP_ID);
  }, [addTab]);

  const handleCloseTab = useCallback(
    (id: string) => {
      editorsMapRef.current.delete(id);
      setEditorVersion((v) => v + 1);
      closeTab(id);
    },
    [closeTab]
  );

  const handleTabContentChange = useCallback(
    (val: string) => {
      updateTabContent(activeTabId, val);
    },
    [activeTabId, updateTabContent]
  );

  const handleRestoreSession = useCallback(
    (session: Session) => {
      // Save current as session history before restoring?
      // For now, simpler restore logic compatible with existing flow
      restoreSession(session.tabs);
      setStatus({ type: 'info', text: 'Session restored' });
    },
    [restoreSession]
  );

  const handleUpdateSettings = useCallback((newSettings: Settings) => {
    setSettings(newSettings);
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(newSettings));
  }, []);

  const addToClipboardHistory = useCallback(
    (text: string) => {
      if (!settings.enableClipboardHistory) return;
      if (!text || text.trim() === '') return;
      setClipboardHistory((prev) => [text, ...prev.filter((item) => item !== text)].slice(0, 20));
    },
    [settings.enableClipboardHistory]
  );

  const handlePasteFromHistory = useCallback((content: string) => {
    if (!slateEditorRef.current) return;
    slateEditorRef.current.setText(content);
    setStatus({ type: 'info', text: 'Pasted from history' });
  }, []);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData('text');
      if (text) addToClipboardHistory(text);
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [addToClipboardHistory]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        toggleFind();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'h' && e.shiftKey) {
        e.preventDefault();
        replaceCurrent();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'h' && e.altKey) {
        e.preventDefault();
        replaceAll();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 't') {
        e.preventDefault();
        handleAddTab();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'w') {
        e.preventDefault();
        handleCloseTab(activeTabId);
      }
      if ((e.metaKey || e.ctrlKey) && /^[1-9]$/.test(e.key)) {
        const index = parseInt(e.key) - 1;
        if (workspace.tabs[index]) setActiveTabId(workspace.tabs[index].id);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeTabId,
    handleAddTab,
    handleCloseTab,
    workspace.tabs,
    scripts,
    toggleFind,
    replaceCurrent,
    replaceAll,
    setActiveTabId,
  ]);

  const runSelectedScript = useCallback(async (script: ScriptModel) => {
    setIsPaletteOpen(false);
    const editor = slateEditorRef.current;
    if (!editor) return;

    const fullText = editor.getText();
    const selection = editor.getSelection();
    const selRange = editor.getSelectionRange();
    const isSelection = selRange ? !selRange.isEmpty : false;

    const context: ExecutionContextData = {
      fullText,
      selection,
      selectionOffset: selRange?.from ?? 0,
      isSelection,
    };

    setStatus({ type: 'info', text: `Running ${script.name || 'Script'}...` });
    try {
      const result = await runScriptAsync(script, context, (msg) => console.info(msg));

      if (isSelection) {
        if (result.selection !== context.selection) {
          editor.replaceSelection(result.selection);
          setStatus({ type: 'success', text: `Success: ${script.name}` });
        } else {
          setStatus({ type: 'info', text: `Done: ${script.name}` });
        }
      } else {
        if (result.fullText !== context.fullText) {
          editor.setText(result.fullText, { saveHistory: true });
          setStatus({ type: 'success', text: `Success: ${script.name}` });
        } else {
          setStatus({ type: 'info', text: `Done: ${script.name}` });
        }
      }
    } catch (error) {
      setStatus({ type: 'error', text: `Error: ${error}` });
    }
    editor.focus();
  }, []);

  if (!isInitialized || !isWorkspaceInitialized) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary)',
          background: 'var(--bg-primary)',
          gap: '10px',
        }}
      >
        <div>Loading Workspace...</div>
        <div style={{ fontSize: '10px', opacity: 0.7 }}>
          Init: {String(isInitialized)}, WS: {String(isWorkspaceInitialized)}
          <br />
          Tabs: {workspace?.tabs?.length ?? '?'}, Groups: {workspace?.groups?.length ?? '?'}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        opacity: (settings.opacity ?? 100) / 100,
      }}
    >
      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        scripts={scripts}
        onSelect={runSelectedScript}
      />
      {/* ... FindPanel, Popovers ... */}
      <FindPanel
        isOpen={findState.isOpen}
        onClose={closeFind}
        onSearch={setSearchTerm}
        onReplace={setReplaceTerm}
        onNext={goToNext}
        onPrevious={goToPrevious}
        onReplaceCurrent={replaceCurrent}
        onReplaceAll={replaceAll}
        matchCount={findState.matches.length}
        activeIndex={findState.activeIndex}
        hasNoMatches={findState.searchTerm !== '' && findState.matches.length === 0}
        replaceTerm={findState.replaceTerm}
      />
      {isClipboardOpen && settings.enableClipboardHistory && (
        <ClipboardPopover
          history={clipboardHistory}
          onSelect={handlePasteFromHistory}
          onRemoveItem={(idx) => setClipboardHistory((prev) => prev.filter((_, i) => i !== idx))}
          onClear={() => setClipboardHistory([])}
          onClose={() => setIsClipboardOpen(false)}
        />
      )}
      {isSessionsOpen && settings.enableSessionRestore && (
        <SessionPopover
          sessions={sessions.slice(0, 2)}
          onSelect={handleRestoreSession}
          onClear={() => {
            setSessions([]);
            localStorage.removeItem(STORAGE_KEY_SESSIONS);
          }}
          onClose={() => setIsSessionsOpen(false)}
        />
      )}
      {isSettingsOpen && (
        <SettingsPopover
          settings={settings}
          onUpdate={handleUpdateSettings}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      <ErrorBoundary fallback={<div>Error loading TabBar</div>}>
        <TabBar
          tabs={workspace.tabs}
          groups={workspace.groups}
          activeTabId={activeTabId}
          onSelect={setActiveTabId}
          onClose={handleCloseTab}
          onAdd={handleAddTab}
          onRename={renameTab}
          onCreateGroup={createGroup}
          onRenameGroup={renameGroup}
          onActivateGroup={activateGroup}
          moveTabToGroup={moveTabToGroup}
          onToggleClipboard={() => {
            setIsClipboardOpen(!isClipboardOpen);
            setIsSessionsOpen(false);
            setIsSettingsOpen(false);
          }}
          onToggleSessions={() => {
            setIsSessionsOpen(!isSessionsOpen);
            setIsClipboardOpen(false);
            setIsSettingsOpen(false);
          }}
          onToggleSettings={() => {
            setIsSettingsOpen(!isSettingsOpen);
            setIsClipboardOpen(false);
            setIsSessionsOpen(false);
          }}
          hasHistory={settings.enableClipboardHistory && clipboardHistory.length > 0}
          hasSessions={settings.enableSessionRestore && sessions.length > 0}
        />
      </ErrorBoundary>

      <ErrorBoundary>
        <SlateEditor
          ref={slateEditorRef}
          editor={activeEditor}
          initialValue={activeTab?.content || ''}
          onChange={handleTabContentChange}
          autoFocus={true}
          placeholder="Type or paste text here..."
          findState={findState}
        />
      </ErrorBoundary>

      <div className={`status-bar status-${status.type}`}>
        <span className="status-text">{status.text || 'Ready'}</span>
        <span>
          {workspace.tabs.length} tabs • {scripts.length} scripts
        </span>
      </div>

      {updateInfo?.available && (
        <UpdateNotification updateInfo={updateInfo} onDismiss={() => setUpdateInfo(null)} />
      )}
    </div>
  );
}

export default App;
