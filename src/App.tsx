import { useState, useEffect, useCallback, useMemo } from 'react';
import CodeMirror, { EditorView } from '@uiw/react-codemirror';
import { indentUnit } from '@codemirror/language';
import {
  keymap,
  drawSelection,
  highlightActiveLine,
  highlightActiveLineGutter,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { foldGutter, foldKeymap } from '@codemirror/language';
import { lineNumbers, highlightSpecialChars } from '@codemirror/view';
import { invoke } from '@tauri-apps/api/core';
import { CommandPalette } from './components/CommandPalette';
import { TabBar, Tab } from './components/TabBar';
import { ClipboardPopover } from './components/ClipboardPopover';
import { SessionPopover, Session } from './components/SessionPopover';
import { SettingsPopover, Settings } from './components/SettingsPopover';
import { ScriptModel, runScriptAsync } from './lib/ScriptRunner';
import { ExecutionContextData } from './lib/WorkerTypes';
import { boopTheme } from './lib/BoopTheme';
import { UpdateNotification } from './components/UpdateNotification';
import { checkForUpdates, type UpdateInfo } from './lib/updater';
import './App.css';

const STORAGE_KEY_SESSIONS = 'boop_sessions_stack_v3';
const STORAGE_KEY_CURRENT_TMP = 'boop_current_session_tmp_v3';
const STORAGE_KEY_SETTINGS = 'boop_settings_v1';

// IME composition 상태 (CodeMirror extension용 모듈 스코프 변수)
// Note: CodeMirror extensions는 React lifecycle과 독립적으로 동작하며,
// 이 값은 렌더링에 영향을 주지 않으므로 모듈 레벨 관리가 적합합니다.
let isComposing = false;

const DEFAULT_SETTINGS: Settings = {
  enableSessionRestore: true,
  autoRestoreLastSession: false,
  openNewTabOnRestore: false,
  enableClipboardHistory: true,
  enableAutoUpdate: true,
};

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
  const [editorView, setEditorView] = useState<EditorView | null>(null);
  const [scripts, setScripts] = useState<ScriptModel[]>([]);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
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
        setStatusMessage('Last session restored automatically');
      } else {
        const defaultId = generateId();
        setTabs([{ id: defaultId, title: 'Untitled', content: '' }]);
        setActiveTabId(defaultId);
      }

      setIsInitialized(true);
      try {
        const data = await invoke('load_scripts');
        setScripts(data as ScriptModel[]);
        if (!loadedSettings.autoRestoreLastSession || sessionStack.length === 0) {
          setStatusMessage(`${(data as ScriptModel[]).length} scripts loaded`);
        }
      } catch {
        setStatusMessage('Error loading scripts');
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

  useEffect(() => {
    if (isInitialized && tabs.length > 0)
      localStorage.setItem(STORAGE_KEY_CURRENT_TMP, JSON.stringify(tabs));
  }, [tabs, isInitialized]);

  const activeTab = useMemo(
    () => tabs.find((t) => t.id === activeTabId) || tabs[0],
    [tabs, activeTabId]
  );

  // Composition 상태에 따라 value를 제어
  // Composition 중에는 React state 업데이트를 차단하므로 문제없음
  const editorValue = activeTab?.content || '';

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
      setStatusMessage('Session restored');
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

  const handlePasteFromHistory = useCallback(
    (content: string) => {
      if (!editorView) return;
      editorView.dispatch({
        changes: { from: 0, to: editorView.state.doc.length, insert: content },
      });
      setStatusMessage('Pasted from history');
    },
    [editorView]
  );

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
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTabId, handleAddTab, handleCloseTab, tabs]);

  const runSelectedScript = useCallback(
    async (script: ScriptModel) => {
      setIsPaletteOpen(false);
      if (!editorView) return;
      const state = editorView.state;
      const sel = state.selection.main;
      const context: ExecutionContextData = {
        fullText: state.doc.toString(),
        selection: state.sliceDoc(sel.from, sel.to),
        selectionOffset: sel.from,
        isSelection: !sel.empty,
      };
      setStatusMessage(`Running ${script.name || 'Script'}...`);
      try {
        const result = await runScriptAsync(script, context, (msg) => console.info(msg));
        const transaction: { changes?: { from: number; to: number; insert: string } } = {};
        if (!sel.empty) {
          if (result.selection !== context.selection)
            transaction.changes = { from: sel.from, to: sel.to, insert: result.selection };
        } else {
          if (result.fullText !== context.fullText)
            transaction.changes = { from: 0, to: state.doc.length, insert: result.fullText };
        }
        if (transaction.changes) {
          editorView.dispatch(transaction);
          setStatusMessage(`Success: ${script.name}`);
        } else setStatusMessage(`Done: ${script.name}`);
      } catch (error) {
        setStatusMessage(`Error: ${error}`);
      }
      editorView.focus();
    },
    [editorView]
  );

  if (!isInitialized) return null;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
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

      <CodeMirror
        key={activeTabId}
        value={editorValue}
        height="100%"
        theme={boopTheme}
        extensions={[
          // 기본 에디터 기능 (basicSetup 없이 수동 추가)
          lineNumbers(),
          highlightSpecialChars(),
          history(),
          foldGutter(),
          drawSelection(),
          highlightActiveLine(),
          highlightActiveLineGutter(),

          // 에디터 동작
          EditorView.lineWrapping,
          indentUnit.of('  '),

          // 키맵 (커스텀 키를 최상단에 배치하여 최우선 순위 확보)
          keymap.of([
            // Enter 키를 최상단에 추가 (최우선 순위)
            {
              key: 'Enter',
              run: (view) => {
                view.dispatch(view.state.replaceSelection('\n'));
                return true;
              },
            },
            ...historyKeymap,
            ...foldKeymap,
            // defaultKeymap에서 들여쓰기 관련 제외
            ...defaultKeymap.filter(
              (binding) => binding.key !== 'Enter' && !binding.key?.includes('Tab')
            ),
          ]),

          // IME Composition 처리 (Uncontrolled이므로 간소화)
          // CodeMirror extension은 React lifecycle과 독립적으로 동작하므로
          // 모듈 레벨 변수 사용이 적합합니다.
          /* eslint-disable react-hooks/globals */
          EditorView.domEventHandlers({
            compositionstart: () => {
              isComposing = true;
              return false;
            },
            compositionupdate: () => {
              isComposing = true;
              return false;
            },
            compositionend: (_event, view) => {
              setTimeout(() => {
                isComposing = false;
                // Uncontrolled이므로 composition 완료 시에만 state 업데이트
                handleTabContentChange(view.state.doc.toString());
              }, 50);
              return false;
            },
          }),

          // 문서 변경 감지 (composition 중에는 state 업데이트 안 함)
          EditorView.updateListener.of((update) => {
            if (update.docChanged && !isComposing) {
              handleTabContentChange(update.state.doc.toString());
            }
          }),
          /* eslint-enable react-hooks/globals */

          // DOM Attributes
          EditorView.contentAttributes.of({
            autocomplete: 'off',
            autocorrect: 'off',
            autocapitalize: 'off',
            spellcheck: 'false',
          }),
        ]}
        onChange={() => {}}
        onCreateEditor={setEditorView}
        autoFocus={true}
        style={{ flex: 1, fontSize: '13px', minHeight: 0, overflow: 'hidden' }}
        basicSetup={false}
      />

      <div className="status-bar">
        <span>{statusMessage || 'Ready'}</span>
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
