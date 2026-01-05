import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { FindPanelProps } from '../types/find';
import './FindPanel.css';

export function FindPanel({
  isOpen,
  onClose,
  onSearch,
  onReplace,
  onNext,
  onPrevious,
  onReplaceCurrent,
  onReplaceAll,
  matchCount,
  activeIndex,
  hasNoMatches,
  replaceTerm,
}: FindPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [localReplaceTerm, setLocalReplaceTerm] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevIsOpenRef = useRef(isOpen);

  // Sync local replace term with prop
  useEffect(() => {
    setLocalReplaceTerm(replaceTerm);
  }, [replaceTerm]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen]);

  // Handle search input change
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const term = e.target.value;
      setSearchTerm(term);
      onSearch(term);
    },
    [onSearch]
  );

  // Handle replace input change
  const handleReplaceChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const term = e.target.value;
      setLocalReplaceTerm(term);
      onReplace(term);
    },
    [onReplace]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) {
          onPrevious();
        } else {
          onNext();
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        onNext();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        onPrevious();
      } else if (e.key === 'ArrowRight' && e.metaKey) {
        // Cmd+ArrowRight to expand
        e.preventDefault();
        setIsExpanded(true);
      }
    },
    [onClose, onNext, onPrevious]
  );

  // Format match count display
  const matchDisplay =
    matchCount === 0 ? (hasNoMatches ? 'No results' : '') : `${activeIndex + 1} of ${matchCount}`;

  if (!isOpen) return null;

  return (
    <div className="find-bar-overlay" onMouseDown={onClose}>
      <div className="find-bar" onMouseDown={(e) => e.stopPropagation()}>
        <div className="find-bar-row">
          <div className="find-icon">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </div>

          <input
            ref={inputRef}
            type="text"
            className="find-input"
            placeholder="Search"
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
          />

          {searchTerm && (
            <span className={`find-match-count ${hasNoMatches && searchTerm ? 'no-results' : ''}`}>
              {matchDisplay}
            </span>
          )}

          <div className="find-nav-btns">
            <button
              type="button"
              className="find-nav-btn"
              onClick={onPrevious}
              title="Previous (Shift+Enter)"
              disabled={matchCount === 0}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              className="find-nav-btn"
              onClick={onNext}
              title="Next (Enter)"
              disabled={matchCount === 0}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>

          <button
            type="button"
            className={`find-expand-btn ${isExpanded ? 'expanded' : ''}`}
            onClick={() => setIsExpanded(!isExpanded)}
            title="Expand"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </button>

          <button type="button" className="find-close-btn" onClick={onClose} title="Close (Esc)">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isExpanded && (
          <div className="find-bar-row find-replace-row">
            <div className="find-icon replace-icon">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.66 0 3-4 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4-3-9s1.34-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>

            <input
              type="text"
              className="find-input replace-input"
              placeholder="Replace"
              value={localReplaceTerm}
              onChange={handleReplaceChange}
              onKeyDown={handleKeyDown}
            />

            <div className="find-replace-btns">
              <button
                type="button"
                className="find-replace-btn"
                onClick={onReplaceCurrent}
                disabled={matchCount === 0}
              >
                Replace
              </button>
              <button
                type="button"
                className="find-replace-btn"
                onClick={onReplaceAll}
                disabled={matchCount === 0}
              >
                All
              </button>
            </div>
          </div>
        )}

        {searchTerm && matchCount > 0 && !isExpanded && (
          <div className="find-bar-footer">
            <span className="find-shortcuts">
              <kbd>Enter</kbd> Next • <kbd>Shift+Enter</kbd> Previous • <kbd>Cmd+→</kbd> Replace
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
