import { useState, useEffect, useCallback, useMemo } from 'react';
import CodeMirror, { EditorView } from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { indentUnit } from '@codemirror/language';
import { invoke } from "@tauri-apps/api/core";
import { CommandPalette } from './components/CommandPalette';
import { TabBar, Tab } from './components/TabBar';
import { ClipboardPopover } from './components/ClipboardPopover';
import { SessionPopover, Session } from './components/SessionPopover';
import { ScriptModel, runScriptAsync } from './lib/ScriptRunner';
import { ExecutionContextData } from './lib/WorkerTypes';
import { boopTheme } from './lib/BoopTheme';
import './App.css';

const STORAGE_KEY_SESSIONS = 'boop_sessions_stack_v3';
const STORAGE_KEY_CURRENT_TMP = 'boop_current_session_tmp_v3';

// Resilient ID generator
const generateId = () => {
    try {
        return crypto.randomUUID();
    } catch (e) {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
};

function App() {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState("");
  const [clipboardHistory, setClipboardHistory] = useState<string[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  
  const [isClipboardOpen, setIsClipboardOpen] = useState(false);
  const [isSessionsOpen, setIsSessionsOpen] = useState(false);
  
  const [editorView, setEditorView] = useState<EditorView | null>(null);
  const [scripts, setScripts] = useState<ScriptModel[]>([]);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);

  // 1. Lifecycle: Startup
  useEffect(() => {
      const initialize = async () => {
          console.log("Initializing Boop2...");
          let sessionStack: Session[] = [];

          try {
              // A. Load existing session stack
              const savedStack = localStorage.getItem(STORAGE_KEY_SESSIONS);
              if (savedStack) {
                  sessionStack = JSON.parse(savedStack);
              }

              // B. Check for unrecovered session from previous run
              const tmpSession = localStorage.getItem(STORAGE_KEY_CURRENT_TMP);
              if (tmpSession) {
                  const parsedTmp = JSON.parse(tmpSession);
                  if (Array.isArray(parsedTmp) && parsedTmp.length > 0) {
                      // Only archive if it has meaningful content
                      const hasContent = parsedTmp.some(t => t.content && t.content.trim() !== "");
                      if (hasContent) {
                          const archivedSession: Session = {
                              id: generateId(),
                              timestamp: Date.now(),
                              tabs: parsedTmp
                          };
                                                                      sessionStack = [archivedSession, ...sessionStack].slice(0, 50);
                                                                      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessionStack));                      }
                  }
                  localStorage.removeItem(STORAGE_KEY_CURRENT_TMP);
              }
          } catch (e) {
              console.error("Failed to load sessions:", e);
          }

          setSessions(sessionStack);
          
          // C. Set Initial Tabs (Always start fresh)
          const defaultId = generateId();
          setTabs([{ id: defaultId, title: "Untitled", content: "" }]);
          setActiveTabId(defaultId);
          
          // Mark UI as ready as soon as tabs are set, don't wait for scripts
          setIsInitialized(true);

          // D. Load Scripts (Background)
          try {
              const data = await invoke('load_scripts');
              setScripts(data as ScriptModel[]);
              setStatusMessage(`${(data as any[]).length} scripts loaded`);
          } catch (err) {
              console.error("Failed to load scripts:", err);
              setStatusMessage("Error loading scripts");
          }
      };

      initialize();
  }, []);

  // 2. Lifecycle: Real-time Temp Saving
  useEffect(() => {
      if (isInitialized && tabs.length > 0) {
          localStorage.setItem(STORAGE_KEY_CURRENT_TMP, JSON.stringify(tabs));
      }
  }, [tabs, isInitialized]);

  const activeTab = useMemo(() => 
      tabs.find(t => t.id === activeTabId) || tabs[0]
  , [tabs, activeTabId]);

  // Handlers
  const handleAddTab = useCallback(() => {
      const newId = generateId();
      const nextNum = tabs.length + 1;
      setTabs(prev => [...prev, { id: newId, title: `Untitled ${nextNum}`, content: "" }]);
      setActiveTabId(newId);
  }, [tabs.length]);

  const handleCloseTab = useCallback((id: string) => {
      if (tabs.length <= 1) {
          const newId = generateId();
          setTabs([{ id: newId, title: "Untitled", content: "" }]);
          setActiveTabId(newId);
          return;
      }
      const newTabs = tabs.filter(t => t.id !== id);
      setTabs(newTabs);
      if (activeTabId === id) {
          setActiveTabId(newTabs[newTabs.length - 1].id);
      }
  }, [tabs, activeTabId]);

  const handleTabContentChange = useCallback((val: string) => {
      setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, content: val } : t));
  }, [activeTabId]);

  const handleRenameTab = useCallback((id: string, newTitle: string) => {
      setTabs(prev => prev.map(t => t.id === id ? { ...t, title: newTitle } : t));
  }, []);

  const handleRestoreSession = useCallback((session: Session) => {
      // Current tabs go to history
      const currentSnapshot: Session = {
          id: generateId(),
          timestamp: Date.now(),
          tabs: tabs
      };
      
      setTabs(session.tabs);
      if (session.tabs.length > 0) setActiveTabId(session.tabs[0].id);
      
      setSessions(prev => [currentSnapshot, ...prev.filter(s => s.id !== session.id)].slice(0, 50));
      setStatusMessage("Session restored");
  }, [tabs]);

  // Clipboard Logic
  const addToClipboardHistory = useCallback((text: string) => {
      if (!text || text.trim() === "") return;
      setClipboardHistory(prev => {
          const filtered = prev.filter(item => item !== text);
          return [text, ...filtered].slice(0, 20);
      });
  }, []);

  const handlePasteFromHistory = useCallback((content: string) => {
      if (!editorView) return;
      editorView.dispatch({
          changes: { from: 0, to: editorView.state.doc.length, insert: content }
      });
      setStatusMessage("Pasted from history");
  }, [editorView]);

  // Global Paste Interceptor
  useEffect(() => {
      const handlePaste = (e: ClipboardEvent) => {
          const text = e.clipboardData?.getData('text');
          if (text) addToClipboardHistory(text);
      };
      window.addEventListener('paste', handlePaste);
      return () => window.removeEventListener('paste', handlePaste);
  }, [addToClipboardHistory]);

  // Shortcuts
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'b') { e.preventDefault(); setIsPaletteOpen(prev => !prev); }
          if ((e.metaKey || e.ctrlKey) && e.key === 't') { e.preventDefault(); handleAddTab(); }
          if ((e.metaKey || e.ctrlKey) && e.key === 'w') { e.preventDefault(); handleCloseTab(activeTabId); }
          if ((e.metaKey || e.ctrlKey) && /^[1-9]$/.test(e.key)) {
              const index = parseInt(e.key) - 1;
              if (tabs[index]) setActiveTabId(tabs[index].id);
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTabId, handleAddTab, handleCloseTab, tabs]);

  const runSelectedScript = useCallback(async (script: ScriptModel) => {
      setIsPaletteOpen(false);
      if (!editorView) return;
      const state = editorView.state;
      const sel = state.selection.main;
      const context: ExecutionContextData = {
          fullText: state.doc.toString(),
          selection: state.sliceDoc(sel.from, sel.to),
          selectionOffset: sel.from,
          isSelection: !sel.empty
      };
      setStatusMessage(`Running ${script.name || 'Script'}...`);
      try {
          const result = await runScriptAsync(script, context, (msg) => console.info(msg));
          const transaction: any = {};
          if (!sel.empty) {
              if (result.selection !== context.selection) transaction.changes = { from: sel.from, to: sel.to, insert: result.selection };
          } else {
              if (result.fullText !== context.fullText) transaction.changes = { from: 0, to: state.doc.length, insert: result.fullText };
          }
          if (transaction.changes) {
              editorView.dispatch(transaction);
              setStatusMessage(`Success: ${script.name}`);
          } else setStatusMessage(`Done: ${script.name}`);
      } catch (error) { setStatusMessage(`Error: ${error}`); }
      editorView.focus();
  }, [editorView]);

  // Don't render until initialized to prevent flashing or partial states
  if (!isInitialized) return <div style={{ background: '#1e1e1e', height: '100vh' }} />;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <CommandPalette 
            isOpen={isPaletteOpen} 
            onClose={() => setIsPaletteOpen(false)}
            scripts={scripts}
            onSelect={runSelectedScript}
        />

        {isClipboardOpen && (
            <ClipboardPopover 
                history={clipboardHistory}
                onSelect={handlePasteFromHistory}
                onRemoveItem={(idx) => setClipboardHistory(prev => prev.filter((_, i) => i !== idx))}
                onClear={() => setClipboardHistory([])}
                onClose={() => setIsClipboardOpen(false)}
            />
        )}

        {isSessionsOpen && (
            <SessionPopover 
                sessions={sessions.slice(0, 2)}
                onSelect={handleRestoreSession}
                onClear={() => { setSessions([]); localStorage.removeItem(STORAGE_KEY_SESSIONS); }}
                onClose={() => setIsSessionsOpen(false)}
            />
        )}

        <TabBar 
            tabs={tabs} 
            activeTabId={activeTabId} 
            onSelect={setActiveTabId} 
            onClose={handleCloseTab}
            onAdd={handleAddTab}
            onRename={handleRenameTab}
            onToggleClipboard={() => { setIsClipboardOpen(!isClipboardOpen); setIsSessionsOpen(false); }}
            onToggleSessions={() => { setIsSessionsOpen(!isSessionsOpen); setIsClipboardOpen(false); }}
            hasHistory={clipboardHistory.length > 0}
            hasSessions={sessions.length > 0}
        />
        
        <CodeMirror
          key={activeTabId}
          value={activeTab?.content || ""}
          height="100%"
          theme={boopTheme}
          extensions={[
              javascript({ jsx: true }), 
              EditorView.lineWrapping,
              indentUnit.of("  "), // Use valid 2-space unit
          ]}
          onChange={handleTabContentChange}
          onCreateEditor={setEditorView}
          autoFocus={true}
          style={{ flex: 1, fontSize: '13px' }}
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            dropCursor: true,
            allowMultipleSelections: true,
            indentOnInput: false, // This effectively disables smart indentation
          }}
        />
        
        <div className="status-bar">
            <span>{statusMessage || "Ready"}</span>
            <span>{tabs.length} tabs • {scripts.length} scripts</span>
        </div>
    </div>
  );
}

export default App;
