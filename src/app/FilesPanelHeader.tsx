import { useEffect, useRef, useState } from 'react';

interface FilesPanelHeaderProps {
  disabled?: boolean;
  onCreateFile: () => void;
  onCreateFolder: () => void;
}

export const FilesPanelHeader = ({
  disabled = false,
  onCreateFile,
  onCreateFolder,
}: FilesPanelHeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  const handleCreateFile = () => {
    setIsMenuOpen(false);
    onCreateFile();
  };

  const handleCreateFolder = () => {
    setIsMenuOpen(false);
    onCreateFolder();
  };

  return (
    <div className="files-panel__header" data-testid="files-panel-header">
      <span>Files</span>
      <div className="files-panel__add-wrap" ref={menuRef}>
        <button
          type="button"
          className="files-panel__add"
          data-testid="files-panel-add"
          aria-label="Add file or folder"
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          disabled={disabled}
          onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
        >
          +
        </button>
        {isMenuOpen && !disabled && (
          <div className="files-panel__add-menu" role="menu" aria-label="Create in Files">
            <button type="button" role="menuitem" onClick={handleCreateFile}>
              New File
            </button>
            <button type="button" role="menuitem" onClick={handleCreateFolder}>
              New Folder
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
