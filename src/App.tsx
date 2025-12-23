import { useState, useEffect, useCallback, useMemo } from 'react';
import CodeMirror, { EditorView } from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { invoke } from "@tauri-apps/api/core";
import { CommandPalette } from './components/CommandPalette';
import { TabBar, Tab } from './components/TabBar';
import { ScriptModel, runScriptAsync } from './lib/ScriptRunner';
import { ExecutionContextData } from './lib/WorkerTypes';
import { boopTheme } from './lib/BoopTheme';
import './App.css';

const STORAGE_KEY_TABS = 'boop_tabs_data';
const STORAGE_KEY_ACTIVE_ID = 'boop_active_tab_id';

function App() {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState("");
  const [editorView, setEditorView] = useState<EditorView | null>(null);
  const [scripts, setScripts] = useState<ScriptModel[]>([]);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  // 1. Initial State Load (from LocalStorage)
  useEffect(() => {
      const savedTabs = localStorage.getItem(STORAGE_KEY_TABS);
      const savedActiveId = localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
      
      if (savedTabs) {
          try {
              const parsed = JSON.parse(savedTabs);
              setTabs(parsed);
              if (savedActiveId && parsed.find((t: Tab) => t.id === savedActiveId)) {
                  setActiveTabId(savedActiveId);
              } else if (parsed.length > 0) {
                  setActiveTabId(parsed[0].id);
              }
          } catch (e) {
              console.error("Failed to load tabs", e);
          }
      } else {
          // Default initial tab
          const defaultId = crypto.randomUUID();
          setTabs([{ id: defaultId, title: "Untitled", content: "// Welcome to Boop!" }]);
          setActiveTabId(defaultId);
      }

      // Load Scripts
      invoke('load_scripts')
        .then((data: any) => {
            setScripts(data);
            setStatusMessage(`${data.length} scripts loaded`);
        })
        .catch(err => {
            console.error("Failed to load scripts:", err);
            setStatusMessage("Error loading scripts");
        });
  }, []);

  // 2. Persist to LocalStorage whenever tabs change
  useEffect(() => {
      if (tabs.length > 0) {
          localStorage.setItem(STORAGE_KEY_TABS, JSON.stringify(tabs));
          localStorage.setItem(STORAGE_KEY_ACTIVE_ID, activeTabId);
      }
  }, [tabs, activeTabId]);

  const activeTab = useMemo(() => 
      tabs.find(t => t.id === activeTabId) || tabs[0]
  , [tabs, activeTabId]);

  // Tab Handlers
  const handleAddTab = useCallback(() => {
      const newId = crypto.randomUUID();
      const nextNum = tabs.length + 1;
      const newTab: Tab = { id: newId, title: `Untitled ${nextNum}`, content: "" };
      setTabs(prev => [...prev, newTab]);
      setActiveTabId(newId);
  }, [tabs.length]);

  const handleCloseTab = useCallback((id: string) => {
      if (tabs.length <= 1) {
          // If last tab, just clear it instead of removing
          setTabs([{ id: crypto.randomUUID(), title: "Untitled", content: "" }]);
          return;
      }
      
      const newTabs = tabs.filter(t => t.id !== id);
      setTabs(newTabs);
      
      if (activeTabId === id) {
          setActiveTabId(newTabs[newTabs.length - 1].id);
      }
  }, [tabs, activeTabId]);

  const handleTabContentChange = useCallback((val: string) => {
      setTabs(prev => prev.map(t => 
          t.id === activeTabId ? { ...t, content: val } : t
      ));
  }, [activeTabId]);

  const handleRenameTab = useCallback((id: string, newTitle: string) => {
      setTabs(prev => prev.map(t => 
          t.id === id ? { ...t, title: newTitle } : t
      ));
  }, []);

  // 3. Shortcuts
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          // Cmd+B: Script Palette
          if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
              e.preventDefault();
              setIsPaletteOpen(prev => !prev);
          }
          // Cmd+T: New Tab
          if ((e.metaKey || e.ctrlKey) && e.key === 't') {
              e.preventDefault();
              handleAddTab();
          }
          // Cmd+W: Close Tab
          if ((e.metaKey || e.ctrlKey) && e.key === 'w') {
              e.preventDefault();
              handleCloseTab(activeTabId);
          }
          // Cmd+1...9: Switch Tab
          if ((e.metaKey || e.ctrlKey) && /^[1-9]$/.test(e.key)) {
              const index = parseInt(e.key) - 1;
              if (tabs[index]) {
                  setActiveTabId(tabs[index].id);
              }
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
      const isSelection = !sel.empty;

      const context: ExecutionContextData = {
          fullText: state.doc.toString(),
          selection: state.sliceDoc(sel.from, sel.to),
          selectionOffset: sel.from,
          isSelection: isSelection
      };

      setStatusMessage(`Running ${script.name || 'Script'}...`);

      try {
          const result = await runScriptAsync(script, context, (msg) => {
              console.info(`[Script Info] ${msg}`);
          });

          const transactionSpecs: any = {};

          if (isSelection) {
              if (result.selection !== context.selection) {
                  transactionSpecs.changes = {
                      from: sel.from,
                      to: sel.to,
                      insert: result.selection
                  };
              }
          } else {
              if (result.fullText !== context.fullText) {
                  transactionSpecs.changes = {
                      from: 0,
                      to: state.doc.length,
                      insert: result.fullText
                  };
              }
          }

          if (transactionSpecs.changes) {
              editorView.dispatch(transactionSpecs);
              setStatusMessage(`Success: ${script.name}`);
          } else {
              setStatusMessage(`Done (No Change): ${script.name}`);
          }

      } catch (error) {
          console.error("Script Failed:", error);
          setStatusMessage(`Error: ${error}`);
      }

      editorView.focus();

  }, [editorView]);

  if (tabs.length === 0) return null; // Wait for initial load

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <CommandPalette 
            isOpen={isPaletteOpen} 
            onClose={() => setIsPaletteOpen(false)}
            scripts={scripts}
            onSelect={runSelectedScript}
        />

        <TabBar 
            tabs={tabs} 
            activeTabId={activeTabId} 
            onSelect={setActiveTabId} 
            onClose={handleCloseTab}
            onAdd={handleAddTab}
            onRename={handleRenameTab}
        />
        
        <CodeMirror
          key={activeTabId} // Force remount on tab switch to keep state clean
          value={activeTab?.content || ""}
          height="100%"
          theme={boopTheme}
          extensions={[javascript({ jsx: true })]}
          onChange={handleTabContentChange}
          onCreateEditor={(view) => setEditorView(view)}
          autoFocus={true}
          style={{ flex: 1, fontSize: '13px' }}
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            dropCursor: true,
            allowMultipleSelections: true,
            indentOnInput: true,
          }}
        />
        
        {/* Status Bar */}
        <div style={{
            padding: '4px 10px', 
            background: '#181818', 
            color: '#6e7681', 
            fontSize: '11px',
            borderTop: '1px solid #2d2d2d',
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
            <span>{statusMessage || "Ready"}</span>
            <span>{tabs.length} tabs • {scripts.length} scripts</span>
        </div>
    </div>
  );
}

export default App;