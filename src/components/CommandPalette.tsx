import React, { useState, useEffect, useMemo, useRef } from 'react';
import Fuse from 'fuse.js';
import { ScriptModel } from '../lib/ScriptRunner';
import { useFavorites } from '../hooks';
import type { FavoriteScript } from '../types';
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
  const [hoveredFavorite, setHoveredFavorite] = useState<FavoriteScript | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    favorites,
    isFavorite,
    addToFavorites,
    removeFromFavorites,
    reassignFavoriteNumber,
    getFavoriteByNumber,
  } = useFavorites();

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

  const displayList = useMemo(() => {
    if (query) return filteredResults;
    const favs = favorites.filter((f) => sortedScripts.some((s) => s.path === f.scriptPath));
    return [...favs, ...recentScripts, ...sortedScripts];
  }, [query, favorites, recentScripts, sortedScripts, filteredResults]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedIndex(0);
  }, [displayList]);

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

  const handleToggleFavorite = (e: React.MouseEvent, script: ScriptModel) => {
    e.stopPropagation();
    if (isFavorite(script.path)) {
      removeFromFavorites(script.path);
    } else {
      addToFavorites(script.path);
    }
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
        const item = displayList[selectedIndex];
        const scriptPath = 'scriptPath' in item ? item.scriptPath : item.path;
        const script = sortedScripts.find((s) => s.path === scriptPath);
        if (script) handleSelect(script);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (/^[1-5]$/.test(e.key)) {
      // Hover된 favorite이 있으면 번호 재할당
      if (hoveredFavorite) {
        e.preventDefault();
        const number = parseInt(e.key);
        reassignFavoriteNumber(hoveredFavorite.scriptPath, number);
      }
    }
  };

  if (!isOpen) return null;

  const hasFavorites = favorites.length > 0 && !query;
  const favoritesInList = favorites.filter((f) =>
    sortedScripts.some((s) => s.path === f.scriptPath)
  );

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
          {hasFavorites && favoritesInList.length > 0 && (
            <>
              <div className="list-section-header">
                <span className="star-icon">★</span> FAVORITES
              </div>
              {favoritesInList.map((fav, index) => {
                const script = sortedScripts.find((s) => s.path === fav.scriptPath);
                if (!script) return null;
                return (
                  <li
                    key={`fav-${script.path}`}
                    className={`command-item favorite-item ${index === selectedIndex ? 'active' : ''}`}
                    onClick={() => handleSelect(script)}
                    onMouseEnter={() => {
                      setSelectedIndex(index);
                      setHoveredFavorite(fav);
                    }}
                    onMouseLeave={() => setHoveredFavorite(null)}
                  >
                    <span className="command-name">{script.name || 'Untitled'}</span>
                    <span className="shortcut-badge">Cmd+{fav.assignedNumber}</span>
                    <button
                      className={`favorite-star active`}
                      onClick={(e) => handleToggleFavorite(e, script)}
                      title="Remove from favorites"
                    >
                      ★
                    </button>
                    <div className="shortcut-tooltip">Press Cmd+{fav.assignedNumber}</div>
                    {hoveredFavorite?.scriptPath === fav.scriptPath && (
                      <div className="number-picker">
                        {[1, 2, 3, 4, 5].map((num) => {
                          const existing = getFavoriteByNumber(num);
                          const isUsed = existing && existing.scriptPath !== fav.scriptPath;
                          return (
                            <button
                              key={num}
                              className={`number-btn ${fav.assignedNumber === num ? 'current' : ''} ${isUsed ? 'occupied' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                reassignFavoriteNumber(fav.scriptPath, num);
                              }}
                              disabled={isUsed || undefined}
                            >
                              {num}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </li>
                );
              })}
            </>
          )}

          {hasFavorites && <div className="list-section-header">RECENT</div>}
          {!hasFavorites && <div className="list-section-header">RECENT</div>}

          {recentScripts.map((script, index) => {
            const isRecent = !query;
            const listIndex = favoritesInList.length + index;
            const globalIndex = listIndex;
            return (
              <React.Fragment key={`recent-${script.path}`}>
                {index === 0 && hasFavorites && (
                  <div className="list-section-header">ALL SCRIPTS</div>
                )}
                {!hasFavorites && index === 0 && (
                  <div className="list-section-header">ALL SCRIPTS</div>
                )}
                <li
                  className={`command-item ${globalIndex === selectedIndex ? 'active' : ''}`}
                  onClick={() => handleSelect(script)}
                  onMouseEnter={() => setSelectedIndex(globalIndex)}
                >
                  <span className="command-name">{script.name || 'Untitled'}</span>
                  <span className="command-desc">{script.description}</span>
                  <div className="command-actions">
                    {isFavorite(script.path) && (
                      <span className="favorite-star active" title="In favorites">
                        ★
                      </span>
                    )}
                    {!isFavorite(script.path) && (
                      <button
                        className="favorite-star"
                        onClick={(e) => handleToggleFavorite(e, script)}
                        title="Add to favorites"
                      >
                        ★
                      </button>
                    )}
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
                  </div>
                </li>
              </React.Fragment>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
