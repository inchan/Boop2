import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import debounce from 'lodash/debounce';
import SlateEditor, { SlateEditorHandle } from './components/SlateEditor';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CommandPalette } from './components/CommandPalette';
import { TabBar, Tab } from './components/TabBar';
import { ClipboardPopover } from './components/ClipboardPopover';
import { SessionPopover, Session } from './components/SessionPopover';
import { SettingsPopover, Settings } from './components/SettingsPopover';
import { ScriptModel, runScriptAsync } from './lib/ScriptRunner';
import { ExecutionContextData } from './lib/WorkerTypes';
import { UpdateNotification } from './components/UpdateNotification';
import { checkForUpdates, type UpdateInfo } from './lib/updater';
import { useFavorites } from './hooks';
import { DEFAULT_SETTINGS } from './hooks/useSettings';
import './App.css';

const STORAGE_KEY_SESSIONS = 'boop_sessions_stack_v3';
const STORAGE_KEY_CURRENT_TMP = 'boop_current_session_tmp_v3';
const STORAGE_KEY_SETTINGS = 'boop_settings_v1';

const generateId = () => {
  try {
    return crypto.randomUUID();
  } catch {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
};

function App() {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState('');
  const [clipboardHistory, setClipboardHistory] = useState<string[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isClipboardOpen, setIsClipboardOpen] = useState(false);
  const [isSessionsOpen, setIsSessionsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const slateEditorRef = useRef<SlateEditorHandle>(null);
  const [scripts, setScripts] = useState<ScriptModel[]>([]);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [status, setStatus] = useState<{ type: 'info' | 'error' | 'success'; text: string }>({
    type: 'info',
    text: '',
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const { executeFavorite, onScriptsLoaded } = useFavorites();

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
        const tmpSession = localStorage.getItem(STORAGE_KEY_CURRENT_TMP);
        if (tmpSession) {
          const parsedTmp = JSON.parse(tmpSession);
          if (
            Array.isArray(parsedTmp) &&
            parsedTmp.length > 0 &&
            parsedTmp.some((t) => t.content.trim() !== '')
          ) {
            sessionStack = [
              { id: generateId(), timestamp: Date.now(), tabs: parsedTmp },
              ...sessionStack,
            ].slice(0, 50);
            localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessionStack));
          }
          localStorage.removeItem(STORAGE_KEY_CURRENT_TMP);
        }
      } catch (error) {
        console.error(error);
      }
      setSessions(sessionStack);

      // Auto-restore last session if enabled
      if (
        loadedSettings.enableSessionRestore &&
        loadedSettings.autoRestoreLastSession &&
        sessionStack.length > 0
      ) {
        const lastSession = sessionStack[0];
        let restoredTabs = [...lastSession.tabs];
        let newTabId: string | null = null;

        // 복원 시 새로운 탭 추가 옵션
        if (loadedSettings.openNewTabOnRestore) {
          const lastTab = restoredTabs[restoredTabs.length - 1];
          // 마지막 탭이 빈 탭이 아니면 새 탭을 맨 뒤에 추가
          if (!lastTab || lastTab.content.trim() !== '') {
            newTabId = generateId();
            restoredTabs = [...restoredTabs, { id: newTabId, title: 'Untitled', content: '' }];
          }
        }

        setTabs(restoredTabs);
        if (newTabId) {
          // 새 탭을 추가했으면 그 탭으로 포커스
          setActiveTabId(newTabId);
        } else if (restoredTabs.length > 0) {
          // 새 탭이 없으면 첫 번째 탭으로 포커스
          setActiveTabId(restoredTabs[0].id);
        }
        setStatus({ type: 'info', text: 'Last session restored automatically' });
      } else {
        const defaultId = generateId();
        setTabs([{ id: defaultId, title: 'Untitled', content: '' }]);
        setActiveTabId(defaultId);
      }

      setIsInitialized(true);
      try {
        const data = await invoke('load_scripts');
        const loadedScripts = data as ScriptModel[];
        setScripts(loadedScripts);
        // eslint-disable-next-line react-hooks/exhaustive-deps
        onScriptsLoaded(loadedScripts);
        if (!loadedSettings.autoRestoreLastSession || sessionStack.length === 0) {
          setStatus({ type: 'info', text: `${loadedScripts.length} scripts loaded` });
        }
      } catch {
        setStatus({ type: 'error', text: 'Error loading scripts' });
      }

      // Check for updates if enabled
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
    if (isInitialized && tabs.length > 0) {
      debouncedSaveRef.current(tabs);
    }
  }, [tabs, isInitialized]);

  // 컴포넌트 언마운트 시 debounce flush
  useEffect(() => {
    const debouncedSave = debouncedSaveRef.current;
    return () => {
      debouncedSave.flush();
    };
  }, []);

  const activeTab = useMemo(
    () => tabs.find((t) => t.id === activeTabId) || tabs[0],
    [tabs, activeTabId]
  );

  const handleAddTab = useCallback(() => {
    const newId = generateId();
    setTabs((prev) => [...prev, { id: newId, title: `Untitled ${prev.length + 1}`, content: '' }]);
    setActiveTabId(newId);
  }, []);

  const handleCloseTab = useCallback(
    (id: string) => {
      if (tabs.length <= 1) {
        const newId = generateId();
        setTabs([{ id: newId, title: 'Untitled', content: '' }]);
        setActiveTabId(newId);
        return;
      }
      const newTabs = tabs.filter((t) => t.id !== id);
      setTabs(newTabs);
      if (activeTabId === id) setActiveTabId(newTabs[newTabs.length - 1].id);
    },
    [tabs, activeTabId]
  );

  const handleTabContentChange = useCallback(
    (val: string) => {
      setTabs((prev) => prev.map((t) => (t.id === activeTabId ? { ...t, content: val } : t)));
    },
    [activeTabId]
  );

  const handleRenameTab = useCallback((id: string, newTitle: string) => {
    setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, title: newTitle } : t)));
  }, []);

  const handleRestoreSession = useCallback(
    (session: Session) => {
      const currentSnapshot: Session = { id: generateId(), timestamp: Date.now(), tabs: tabs };
      setTabs(session.tabs);
      if (session.tabs.length > 0) setActiveTabId(session.tabs[0].id);
      setSessions((prev) =>
        [currentSnapshot, ...prev.filter((s) => s.id !== session.id)].slice(0, 50)
      );
      setStatus({ type: 'info', text: 'Session restored' });
    },
    [tabs]
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
        if (tabs[index]) setActiveTabId(tabs[index].id);
      }
      if ((e.metaKey || e.ctrlKey) && /^[1-5]$/.test(e.key)) {
        const number = parseInt(e.key);
        const scriptPath = executeFavorite(number);
        if (scriptPath) {
          const script = scripts.find((s) => s.path === scriptPath);
          if (script) {
            e.preventDefault();
            runSelectedScript(script);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTabId, handleAddTab, handleCloseTab, tabs, scripts, executeFavorite]);

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

  if (!isInitialized) return null;

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        opacity: settings.opacity / 100,
      }}
    >
      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        scripts={scripts}
        onSelect={runSelectedScript}
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

      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onSelect={setActiveTabId}
        onClose={handleCloseTab}
        onAdd={handleAddTab}
        onRename={handleRenameTab}
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

      <ErrorBoundary>
        <SlateEditor
          ref={slateEditorRef}
          initialValue={activeTab?.content || ''}
          onChange={handleTabContentChange}
          autoFocus={true}
          placeholder="Type or paste text here..."
        />
      </ErrorBoundary>

      <div className={`status-bar status-${status.type}`}>
        <span className="status-text">{status.text || 'Ready'}</span>
        <span>
          {tabs.length} tabs • {scripts.length} scripts
        </span>
      </div>

      {updateInfo?.available && (
        <UpdateNotification updateInfo={updateInfo} onDismiss={() => setUpdateInfo(null)} />
      )}
    </div>
  );
}

export default App;
