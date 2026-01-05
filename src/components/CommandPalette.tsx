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
const MAX_RECENT = 5;

export function CommandPalette({ isOpen, onClose, scripts, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentPaths, setRecentPaths] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem(RECENT_SCRIPTS_KEY);
      if (stored) {
        try {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setRecentPaths(JSON.parse(stored));
        } catch (error) {
          console.error('Failed to parse recents', error);
        }
      }
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const sortedScripts = useMemo(() => {
    return [...scripts].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [scripts]);

  const fuse = useMemo(
    () =>
      new Fuse(sortedScripts, {
        keys: ['name', 'tags', 'description'],
        threshold: 0.3,
      }),
    [sortedScripts]
  );

  const { recentScripts, allScripts } = useMemo(() => {
    const filtered = query ? fuse.search(query).map((res) => res.item) : sortedScripts;

    const recent = recentPaths
      .map((path) => filtered.find((s) => s.path === path))
      .filter((s): s is ScriptModel => !!s)
      .slice(0, MAX_RECENT);

    return {
      recentScripts: recent,
      allScripts: filtered,
    };
  }, [query, recentPaths, sortedScripts, fuse]);

  const displayList = useMemo(() => {
    return [...recentScripts, ...allScripts];
  }, [recentScripts, allScripts]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedIndex(0);
  }, [displayList]);

  const handleSelect = (script: ScriptModel) => {
    const newRecents = [script.path, ...recentPaths.filter((p) => p !== script.path)].slice(
      0,
      MAX_RECENT
    );
    setRecentPaths(newRecents);
    localStorage.setItem(RECENT_SCRIPTS_KEY, JSON.stringify(newRecents));

    onSelect(script);
    onClose();
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
      setSelectedIndex((i) => Math.min(i + 1, displayList.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (displayList[selectedIndex]) {
        handleSelect(displayList[selectedIndex]);
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
        <div className="command-palette-header">
          <input
            ref={inputRef}
            className="command-input"
            placeholder="Search scripts..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="close-btn" onClick={onClose} title="Close palette">
            ×
          </button>
        </div>
        <ul className="command-list">
          {recentScripts.length > 0 && (
            <>
              <div className="list-section-header">RECENT</div>
              {recentScripts.map((script, index) => (
                <CommandItem
                  key={`recent-${script.path}`}
                  script={script}
                  active={index === selectedIndex}
                  onSelect={() => handleSelect(script)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  onRemove={(e) => handleRemoveRecent(e, script.path)}
                  showRemove
                />
              ))}
            </>
          )}

          <div className="list-section-header">ALL SCRIPTS</div>
          {allScripts.length === 0 ? (
            <div className="no-results">No scripts found</div>
          ) : (
            allScripts.map((script, index) => {
              const globalIndex = recentScripts.length + index;
              return (
                <CommandItem
                  key={`all-${script.path}`}
                  script={script}
                  active={globalIndex === selectedIndex}
                  onSelect={() => handleSelect(script)}
                  onMouseEnter={() => setSelectedIndex(globalIndex)}
                />
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}

interface CommandItemProps {
  script: ScriptModel;
  active: boolean;
  onSelect: () => void;
  onMouseEnter: () => void;
  onRemove?: (e: React.MouseEvent) => void;
  showRemove?: boolean;
}

function CommandItem({
  script,
  active,
  onSelect,
  onMouseEnter,
  onRemove,
  showRemove,
}: CommandItemProps) {
  return (
    <li
      className={`command-item ${active ? 'active' : ''}`}
      onClick={onSelect}
      onMouseEnter={onMouseEnter}
    >
      <div className="item-content">
        <span className="command-name">{script.name || 'Untitled'}</span>
        <span className="command-desc">{script.description}</span>
      </div>
      <div className="item-actions">
        {showRemove && onRemove && (
          <button className="remove-recent-btn" onClick={onRemove} title="Remove from recent">
            ×
          </button>
        )}
      </div>
    </li>
  );
}
