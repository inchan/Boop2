import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { revealItemInDir } from '@tauri-apps/plugin-opener';
import { createEditor, Descendant } from 'slate';
import { withReact } from 'slate-react';
import { withHistory } from 'slate-history';
import SlateEditor, { SlateEditorHandle, CustomEditor } from './components/SlateEditor';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CommandPalette } from './components/CommandPalette';
import { FindPanel } from './components/FindPanel';
import { ClipboardPopover } from './components/ClipboardPopover';
import { ContextMenu, type MenuItem } from './components/ContextMenu';
import { SessionPopover, Session } from './components/SessionPopover';
import { SettingsPopover, Settings } from './components/SettingsPopover';
import { ScriptModel, runScriptAsync } from './lib/ScriptRunner';
import { ExecutionContextData } from './lib/WorkerTypes';
import { UpdateNotification } from './components/UpdateNotification';
import { checkForUpdates, type UpdateInfo } from './lib/updater';
import { useFind } from './hooks/useFind';
import { DEFAULT_SETTINGS } from './hooks/useSettings';
import { AppShell } from './app/AppShell';
import { FileContentTabs } from './app/FileContentTabs';
import { FilesPanelHeader } from './app/FilesPanelHeader';
import { FilesTree } from './app/FilesTree';
import { ProjectPanel, ProjectPanelHeader } from './app/ProjectPanel';
import type { ProjectEntry, ProjectFileNode } from './app/projectFileTypes';
import { useProjectWorkspace } from './app/useProjectWorkspace';
import './App.css';

const STORAGE_KEY_SESSIONS = 'boop_sessions_stack_v3';
// const STORAGE_KEY_CURRENT_TMP = 'boop_current_session_tmp_v3'; // Handled by useWorkspace
const STORAGE_KEY_SETTINGS = 'boop_settings_v1';

type ShellContextMenu = {
  kind: 'project';
  project: ProjectEntry;
  position: { x: number; y: number };
};

function App() {
  const projectWorkspace = useProjectWorkspace();
  const activeTabId = projectWorkspace.activeTabId;
  const activeTab = projectWorkspace.activeTab;

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
  /* eslint-disable react-hooks/exhaustive-deps */
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

    const tabContent = activeTab?.content || '';
    const newEditor = withReact(withHistory(createEditor())) as CustomEditor;
    newEditor.children = textToSlateValue(tabContent);
    editorsMapRef.current.set(activeTabId, newEditor);

    return newEditor;
  }, [activeTab?.content, activeTabId, editorVersion]);
  /* eslint-enable react-hooks/exhaustive-deps */

  const [scripts, setScripts] = useState<ScriptModel[]>([]);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [status, setStatus] = useState<{ type: 'info' | 'error' | 'success'; text: string }>({
    type: 'info',
    text: '',
  });
  const [contextMenu, setContextMenu] = useState<ShellContextMenu | null>(null);
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

        // Note: Legacy session migration logic is disabled during the Project shell migration.
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
      projectWorkspace.updateActiveTabContent(newText);
    },
    [projectWorkspace]
  );

  // Find feature hook
  const {
    findState,
    closeFind,
    openFind,
    setSearchTerm,
    setReplaceTerm,
    goToNext,
    goToPrevious,
    replaceCurrent,
    replaceAll,
    toggleCaseSensitive,
    toggleWholeWord,
  } = useFind({
    documentText: activeTab?.content || '',
    initialOpen: false,
    onReplace: handleReplace,
  });

  const handleCloseTab = useCallback(
    (id: string) => {
      editorsMapRef.current.delete(id);
      setEditorVersion((v) => v + 1);
      projectWorkspace.closeTab(id);
    },
    [projectWorkspace]
  );

  const handleTabContentChange = useCallback(
    (val: string) => {
      projectWorkspace.updateActiveTabContent(val);
    },
    [projectWorkspace]
  );

  const handleRestoreSession = useCallback((session: Session) => {
    setStatus({
      type: 'info',
      text: `Session restore is unavailable in Project view (${session.tabs.length} tabs)`,
    });
  }, []);

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
      // Escape: Close find panel if open
      if (e.key === 'Escape' && findState.isOpen) {
        e.preventDefault();
        closeFind();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        openFind();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 't' && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        void projectWorkspace
          .createFile()
          .then((node) => {
            if (node) {
              setStatus({ type: 'success', text: `Created file: ${node.name}` });
            }
          })
          .catch((error) => {
            setStatus({ type: 'error', text: `Error creating file: ${error}` });
          });
      }
      // Cmd+G: Next match (VS Code style)
      if ((e.metaKey || e.ctrlKey) && e.key === 'g' && !e.shiftKey) {
        e.preventDefault();
        goToNext();
      }
      // Cmd+Shift+G: Previous match
      if ((e.metaKey || e.ctrlKey) && e.key === 'g' && e.shiftKey) {
        e.preventDefault();
        goToPrevious();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'h' && e.shiftKey) {
        e.preventDefault();
        replaceCurrent();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'h' && e.altKey) {
        e.preventDefault();
        replaceAll();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'w') {
        e.preventDefault();
        if (activeTabId) handleCloseTab(activeTabId);
      }
      if ((e.metaKey || e.ctrlKey) && /^[1-9]$/.test(e.key)) {
        const index = parseInt(e.key) - 1;
        const tab = projectWorkspace.openTabs[index];
        if (tab) projectWorkspace.selectTab(tab.id);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeTabId,
    handleCloseTab,
    projectWorkspace,
    scripts,
    findState.isOpen,
    closeFind,
    openFind,
    goToNext,
    goToPrevious,
    replaceCurrent,
    replaceAll,
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

  const handleAddProject = useCallback(async () => {
    try {
      await projectWorkspace.addProject();
    } catch (error) {
      setStatus({ type: 'error', text: `Error adding Project: ${error}` });
    }
  }, [projectWorkspace]);

  const handleSelectProject = useCallback(
    async (projectId: string) => {
      try {
        await projectWorkspace.selectProject(projectId);
      } catch (error) {
        setStatus({ type: 'error', text: `Error loading Project: ${error}` });
      }
    },
    [projectWorkspace]
  );

  const handleToggleFolder = useCallback(
    async (node: ProjectFileNode) => {
      try {
        await projectWorkspace.toggleFolder(node);
      } catch (error) {
        setStatus({ type: 'error', text: `Error loading folder: ${error}` });
      }
    },
    [projectWorkspace]
  );

  const handleOpenFile = useCallback(
    async (node: ProjectFileNode) => {
      if (node.kind !== 'file') return;

      try {
        await projectWorkspace.openFile(node.path, node.name);
      } catch (error) {
        setStatus({ type: 'error', text: `Error opening file: ${error}` });
      }
    },
    [projectWorkspace]
  );

  const handleCreateFile = useCallback(
    async (parentPath?: string) => {
      try {
        const node = await projectWorkspace.createFile(parentPath);
        if (node) {
          setStatus({ type: 'success', text: `Created file: ${node.name}` });
        }
      } catch (error) {
        setStatus({ type: 'error', text: `Error creating file: ${error}` });
      }
    },
    [projectWorkspace]
  );

  const handleCreateFolder = useCallback(
    async (parentPath?: string) => {
      try {
        const node = await projectWorkspace.createFolder(parentPath);
        if (node) {
          setStatus({ type: 'success', text: `Created folder: ${node.name}` });
        }
      } catch (error) {
        setStatus({ type: 'error', text: `Error creating folder: ${error}` });
      }
    },
    [projectWorkspace]
  );

  const handleMoveEntry = useCallback(
    async (source: ProjectFileNode, destinationFolder?: ProjectFileNode) => {
      try {
        const node = await projectWorkspace.moveEntry(source, destinationFolder?.path);
        if (node) {
          setStatus({
            type: 'success',
            text: `Moved ${source.name}${destinationFolder ? ` to ${destinationFolder.name}` : ''}`,
          });
        }
      } catch (error) {
        setStatus({ type: 'error', text: `Error moving ${source.name}: ${error}` });
      }
    },
    [projectWorkspace]
  );

  const handleOpenProjectMenu = useCallback(
    (project: ProjectEntry, position: { x: number; y: number }) => {
      setContextMenu({ kind: 'project', project, position });
    },
    []
  );

  const handleCopyPath = useCallback(async (path: string) => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard is unavailable');
      }
      await navigator.clipboard.writeText(path);
      setStatus({ type: 'success', text: 'Copied path' });
    } catch (error) {
      setStatus({ type: 'error', text: `Error copying path: ${error}` });
    }
  }, []);

  const handleRevealPath = useCallback(async (path: string) => {
    try {
      await revealItemInDir(path);
    } catch (error) {
      setStatus({ type: 'error', text: `Error revealing path: ${error}` });
    }
  }, []);

  const getProjectContextMenuItems = useCallback(
    (project: ProjectEntry): MenuItem[] => [
      { label: 'New File', onClick: () => void handleCreateFile(project.rootPath) },
      { label: 'New Folder', onClick: () => void handleCreateFolder(project.rootPath) },
      { divider: true, label: '' },
      { label: 'Copy Path', onClick: () => void handleCopyPath(project.rootPath) },
      { label: 'Reveal in Finder', onClick: () => void handleRevealPath(project.rootPath) },
    ],
    [handleCopyPath, handleCreateFile, handleCreateFolder, handleRevealPath]
  );

  if (!isInitialized) {
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
        <div style={{ fontSize: '10px', opacity: 0.7 }}>Init: {String(isInitialized)}</div>
      </div>
    );
  }

  return (
    <AppShell
      opacity={(settings.opacity ?? 100) / 100}
      top={
        <>
          <span className="app-shell__brand">Boop2</span>
          <span>{scripts.length} scripts</span>
          <span className="app-shell__top-spacer" />
          <div className="app-shell__utility-actions">
            <button
              type="button"
              className="app-shell__utility-action"
              onClick={() => setIsPaletteOpen(true)}
            >
              Scripts
            </button>
            {settings.enableClipboardHistory && (
              <button
                type="button"
                className="app-shell__utility-action"
                onClick={() => {
                  setIsClipboardOpen((isOpen) => !isOpen);
                  setIsSessionsOpen(false);
                  setIsSettingsOpen(false);
                }}
              >
                Clipboard
              </button>
            )}
            {settings.enableSessionRestore && (
              <button
                type="button"
                className="app-shell__utility-action"
                onClick={() => {
                  setIsSessionsOpen((isOpen) => !isOpen);
                  setIsClipboardOpen(false);
                  setIsSettingsOpen(false);
                }}
              >
                Sessions
              </button>
            )}
            <button
              type="button"
              className="app-shell__utility-action"
              onClick={() => {
                setIsSettingsOpen((isOpen) => !isOpen);
                setIsClipboardOpen(false);
                setIsSessionsOpen(false);
              }}
            >
              Settings
            </button>
          </div>
          <span>{projectWorkspace.openTabs.length} files</span>
        </>
      }
      menuHeader={<ProjectPanelHeader onAddProject={() => void handleAddProject()} />}
      menu={
        <ProjectPanel
          projects={projectWorkspace.projects}
          activeProjectId={projectWorkspace.activeProjectId}
          onSelectProject={(projectId) => void handleSelectProject(projectId)}
          onOpenProjectMenu={handleOpenProjectMenu}
        />
      }
      listHeader={
        <FilesPanelHeader
          disabled={!projectWorkspace.activeProject}
          onCreateFile={() => void handleCreateFile()}
          onCreateFolder={() => void handleCreateFolder()}
        />
      }
      list={
        <FilesTree
          nodes={projectWorkspace.fileTree}
          expandedPaths={projectWorkspace.expandedPaths}
          activeFilePath={projectWorkspace.selectedFilePath}
          activeFolderPath={projectWorkspace.selectedFolderPath}
          onToggleFolder={(node) => void handleToggleFolder(node)}
          onOpenFile={(node) => void handleOpenFile(node)}
          onMoveEntry={(source, destinationFolder) =>
            void handleMoveEntry(source, destinationFolder)
          }
        />
      }
      contentHeader={
        <FileContentTabs
          tabs={projectWorkspace.openTabs}
          activeTabId={activeTabId}
          onSelectTab={projectWorkspace.selectTab}
          onCloseTab={handleCloseTab}
        />
      }
      content={
        <>
          <CommandPalette
            isOpen={isPaletteOpen}
            onClose={() => setIsPaletteOpen(false)}
            scripts={scripts}
            onSelect={runSelectedScript}
          />
          {contextMenu && (
            <ContextMenu
              items={getProjectContextMenuItems(contextMenu.project)}
              position={contextMenu.position}
              onClose={() => setContextMenu(null)}
            />
          )}
          {isClipboardOpen && settings.enableClipboardHistory && (
            <ClipboardPopover
              history={clipboardHistory}
              onSelect={handlePasteFromHistory}
              onRemoveItem={(idx) =>
                setClipboardHistory((prev) => prev.filter((_, i) => i !== idx))
              }
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
            caseSensitive={findState.caseSensitive}
            wholeWord={findState.wholeWord}
            onToggleCaseSensitive={toggleCaseSensitive}
            onToggleWholeWord={toggleWholeWord}
          />

          {activeTab ? (
            <ErrorBoundary>
              <SlateEditor
                ref={slateEditorRef}
                editor={activeEditor}
                initialValue={activeTab.content}
                onChange={handleTabContentChange}
                autoFocus={true}
                placeholder="Type or paste text here..."
                findState={findState}
              />
            </ErrorBoundary>
          ) : (
            <div className="content-empty-state">Select a file from the Files panel</div>
          )}

          {updateInfo?.available && (
            <UpdateNotification updateInfo={updateInfo} onDismiss={() => setUpdateInfo(null)} />
          )}
        </>
      }
      bottom={
        <div className={`status-bar status-${status.type}`}>
          <span className="status-text">{status.text || 'Ready'}</span>
          <span>
            {projectWorkspace.openTabs.length} files • {scripts.length} scripts
          </span>
        </div>
      }
    />
  );
}

export default App;
