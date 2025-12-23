import React, { useState, useRef, useEffect } from 'react';
import './TabBar.css';

export interface Tab {
    id: string;
    title: string;
    content: string;
}

interface Props {
    tabs: Tab[];
    activeTabId: string;
    onSelect: (id: string) => void;
    onClose: (id: string) => void;
    onAdd: () => void;
    onRename: (id: string, newTitle: string) => void;
    onToggleClipboard: () => void;
    onToggleSessions: () => void; // New
    hasHistory: boolean;
    hasSessions: boolean; // New
}

export function TabBar({ 
    tabs, 
    activeTabId, 
    onSelect, 
    onClose, 
    onAdd, 
    onRename, 
    onToggleClipboard, 
    onToggleSessions,
    hasHistory,
    hasSessions
}: Props) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [tempTitle, setTempTitle] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (editingId && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editingId]);

    const handleDoubleClick = (tab: Tab) => {
        setEditingId(tab.id);
        setTempTitle(tab.title);
    };

    const handleSave = () => {
        if (editingId) {
            onRename(editingId, tempTitle.trim() || "Untitled");
            setEditingId(null);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            setEditingId(null);
        }
    };

    return (
        <div className="tab-bar-container">
            <div className="tabs-list">
                {tabs.map(tab => (
                    <div 
                        key={tab.id}
                        className={`tab-item ${tab.id === activeTabId ? 'active' : ''}`}
                        onClick={() => onSelect(tab.id)}
                        onDoubleClick={() => handleDoubleClick(tab)}
                    >
                        {editingId === tab.id ? (
                            <input
                                ref={inputRef}
                                className="tab-edit-input"
                                value={tempTitle}
                                onChange={(e) => setTempTitle(e.target.value)}
                                onBlur={handleSave}
                                onKeyDown={handleKeyDown}
                            />
                        ) : (
                            <span className="tab-title">{tab.title}</span>
                        )}
                        
                        <span 
                            className="tab-close" 
                            onClick={(e) => {
                                e.stopPropagation();
                                onClose(tab.id);
                            }}
                        >
                            ×
                        </span>
                    </div>
                ))}
                <div className="add-tab-btn" onClick={onAdd} title="New Tab (Cmd+T)">
                    +
                </div>
            </div>
            
            <div className="tab-bar-actions">
                {hasHistory && (
                    <div className="action-btn clipboard-btn" onClick={onToggleClipboard} title="Clipboard History">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                        </svg>
                    </div>
                )}

                {hasSessions && (
                    <div className="action-btn session-btn" onClick={onToggleSessions} title="Restore Session">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                            <path d="M3 3v5h5"></path>
                            <path d="M12 7v5l4 2"></path>
                        </svg>
                    </div>
                )}
            </div>
        </div>
    );
}
