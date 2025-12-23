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
}

export function TabBar({ tabs, activeTabId, onSelect, onClose, onAdd, onRename }: Props) {
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
            </div>
            <div className="add-tab-btn" onClick={onAdd} title="New Tab (Cmd+T)">
                +
            </div>
        </div>
    );
}