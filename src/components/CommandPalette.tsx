import React, { useState, useEffect, useMemo, useRef } from 'react';
import Fuse from 'fuse.js';
import { ScriptModel } from '../lib/ScriptRunner';
import './CommandPalette.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  scripts: ScriptModel[];
  onSelect: (script: ScriptModel) => void;
}

const RECENT_SCRIPTS_KEY = 'boop_recent_scripts';

export function CommandPalette({ isOpen, onClose, scripts, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentPaths, setRecentPaths] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recents
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_SCRIPTS_KEY);
    if (stored) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setRecentPaths(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse recents', error);
      }
    }
  }, [isOpen]);

  const sortedScripts = useMemo(() => {
    return [...scripts].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [scripts]);

  const recentScripts = useMemo(() => {
    return recentPaths
      .map((path) => sortedScripts.find((s) => s.path === path))
      .filter((s): s is ScriptModel => !!s)
      .slice(0, 5);
  }, [recentPaths, sortedScripts]);

  const fuse = useMemo(
    () =>
      new Fuse(sortedScripts, {
        keys: ['name', 'tags', 'description'],
        threshold: 0.3,
      }),
    [sortedScripts]
  );

  const filteredResults = useMemo(() => {
    if (!query) return sortedScripts;
    return fuse.search(query).map((res) => res.item);
  }, [query, sortedScripts, fuse]);

  const finalDisplayList = useMemo(() => {
    if (query) return filteredResults;
    return [...recentScripts, ...sortedScripts];
  }, [query, recentScripts, sortedScripts, filteredResults]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedIndex(0);
  }, [finalDisplayList]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery('');
    }
  }, [isOpen]);

  const handleSelect = (script: ScriptModel) => {
    const newRecents = [script.path, ...recentPaths.filter((p) => p !== script.path)].slice(0, 5);
    setRecentPaths(newRecents);
    localStorage.setItem(RECENT_SCRIPTS_KEY, JSON.stringify(newRecents));

    onSelect(script);
  };

  const handleRemoveRecent = (e: React.MouseEvent, pathToRemove: string) => {
    e.stopPropagation();
    const newRecents = recentPaths.filter((path) => path !== pathToRemove);
    setRecentPaths(newRecents);
    localStorage.setItem(RECENT_SCRIPTS_KEY, JSON.stringify(newRecents));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, finalDisplayList.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (finalDisplayList[selectedIndex]) {
        handleSelect(finalDisplayList[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="command-palette-overlay" onMouseDown={onClose}>
      <div className="command-palette" onMouseDown={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="command-input"
          placeholder="Search scripts..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <ul className="command-list">
          {finalDisplayList.map((script, index) => {
            const isRecent = !query && index < recentScripts.length;
            const isFirstAll = !query && index === recentScripts.length;

            return (
              <React.Fragment key={script.path + index}>
                {isRecent && index === 0 && <div className="list-section-header">RECENT</div>}
                {isFirstAll && <div className="list-section-header">ALL SCRIPTS</div>}
                <li
                  className={`command-item ${index === selectedIndex ? 'active' : ''}`}
                  onClick={() => handleSelect(script)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div
                    style={{ display: 'flex', alignItems: 'baseline', flex: 1, overflow: 'hidden' }}
                  >
                    <span style={{ fontWeight: 600 }}>{script.name || 'Untitled'}</span>
                    <span className="command-desc">{script.description}</span>
                  </div>

                  {isRecent && (
                    <div className="recent-actions">
                      <span className="recent-badge">recent</span>
                      <button
                        className="remove-recent-btn"
                        onClick={(e) => handleRemoveRecent(e, script.path)}
                        title="Remove from recent"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </li>
              </React.Fragment>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
