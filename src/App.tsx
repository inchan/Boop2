import { useState, useEffect, useCallback } from 'react';
import CodeMirror, { EditorView } from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { invoke } from "@tauri-apps/api/core";
import { CommandPalette } from './components/CommandPalette';
import { ScriptModel, runScriptAsync } from './lib/ScriptRunner';
import { ExecutionContextData } from './lib/WorkerTypes';
import { boopTheme } from './lib/BoopTheme';
import './App.css';

function App() {
  const [value, setValue] = useState("// Welcome to Boop (Tauri Edition)\n// Press Cmd+B (or Ctrl+B) to run scripts.");
  const [editorView, setEditorView] = useState<EditorView | null>(null);
  const [scripts, setScripts] = useState<ScriptModel[]>([]);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  // Load Scripts
  useEffect(() => {
      invoke('load_scripts')
        .then((data: any) => {
            console.log("Scripts loaded:", data.length);
            setScripts(data);
            setStatusMessage(`${data.length} scripts loaded`);
        })
        .catch(err => {
            console.error("Failed to load scripts:", err);
            setValue(`// ❌ CRITICAL ERROR: Could not load scripts.\n// Debug Log:\n${err}\n\n// Please check if 'scripts' folder exists in the app resources.`);
            setStatusMessage("Error loading scripts");
        });
  }, []);

  // Shortcuts
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
              e.preventDefault();
              setIsPaletteOpen(prev => !prev);
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <CommandPalette 
            isOpen={isPaletteOpen} 
            onClose={() => setIsPaletteOpen(false)}
            scripts={scripts}
            onSelect={runSelectedScript}
        />
        
        <CodeMirror
          value={value}
          height="100%"
          theme={boopTheme}
          extensions={[javascript({ jsx: true })]}
          onChange={(val) => setValue(val)}
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
            background: '#1E1E1E', 
            color: '#6e7681', 
            fontSize: '11px',
            borderTop: '1px solid #2d2d2d',
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
            <span>{statusMessage || "Ready"}</span>
            <span>{scripts.length} scripts</span>
        </div>
    </div>
  );
}

export default App;
