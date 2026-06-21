import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { splitFileNameForDisplay } from './projectPathUtils';
import type { ProjectFileNode } from './projectFileTypes';
import { useOverflowTitle } from './useOverflowTitle';

const POINTER_DRAG_THRESHOLD = 4;

interface FilesTreeProps {
  nodes: ProjectFileNode[];
  expandedPaths: Set<string>;
  activeFilePath?: string;
  activeFolderPath?: string;
  onToggleFolder: (node: ProjectFileNode) => void;
  onOpenFile: (node: ProjectFileNode) => void;
  onMoveEntry: (source: ProjectFileNode, destinationFolder?: ProjectFileNode) => void;
  renamingPath?: string;
  onOpenEntryMenu?: (node: ProjectFileNode, position: { x: number; y: number }) => void;
  onRenameSubmit?: (node: ProjectFileNode, newName: string) => void;
  onRenameCancel?: () => void;
}

interface TreeRowsProps extends FilesTreeProps {
  depth: number;
  dropTargetPath?: string;
  onPointerDragStart: (event: ReactPointerEvent<HTMLElement>, node: ProjectFileNode) => void;
  shouldSuppressClick: () => boolean;
}

type TreeDepthStyle = CSSProperties & {
  '--tree-depth': number;
};

type DragPreviewStyle = CSSProperties & {
  '--drag-preview-x': string;
  '--drag-preview-y': string;
};

interface PointerDragSession {
  source: ProjectFileNode;
  pointerId: number;
  startX: number;
  startY: number;
  isDragging: boolean;
}

interface DragPreviewState {
  node: ProjectFileNode;
  x: number;
  y: number;
}

const FolderName = ({ name }: { name: string }) => {
  const { ref, title } = useOverflowTitle<HTMLSpanElement>(name);

  return (
    <span
      ref={ref}
      className="files-tree__name"
      data-tree-part="name"
      data-testid="files-tree-folder-name"
      title={title}
    >
      {name}
    </span>
  );
};

const FileName = ({ name }: { name: string }) => {
  const { stem, extension } = splitFileNameForDisplay(name);
  const { ref, title } = useOverflowTitle<HTMLSpanElement>(name);

  return (
    <span className="files-tree__file-name" data-tree-part="name">
      <span
        ref={ref}
        className="files-tree__file-stem"
        data-testid="files-tree-file-stem"
        title={title}
      >
        {stem}
      </span>
      <span className="files-tree__file-ext" data-testid="files-tree-file-ext">
        {extension}
      </span>
    </span>
  );
};

const RenameInput = ({
  node,
  onSubmit,
  onCancel,
}: {
  node: ProjectFileNode;
  onSubmit: (node: ProjectFileNode, newName: string) => void;
  onCancel: () => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    const dotIndex = node.name.lastIndexOf('.');
    if (node.kind === 'file' && dotIndex > 0) {
      input.setSelectionRange(0, dotIndex);
    } else {
      input.select();
    }
  }, [node.kind, node.name]);

  return (
    <input
      ref={inputRef}
      className="files-tree__rename-input"
      data-testid="files-tree-rename-input"
      defaultValue={node.name}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      onBlur={(event) => onSubmit(node, event.currentTarget.value)}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === 'Enter') {
          event.preventDefault();
          onSubmit(node, event.currentTarget.value);
        } else if (event.key === 'Escape') {
          event.preventDefault();
          onCancel();
        }
      }}
    />
  );
};

const handleRowKeyDown = (event: KeyboardEvent<HTMLElement>, action: () => void) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    action();
  }
};

const handleRowClick = (
  event: MouseEvent<HTMLElement>,
  shouldSuppressClick: () => boolean,
  action: () => void
) => {
  if (shouldSuppressClick()) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }

  action();
};

function findNodeByPath(nodes: ProjectFileNode[], path: string): ProjectFileNode | undefined {
  for (const node of nodes) {
    if (node.path === path) return node;
    if (node.children) {
      const child = findNodeByPath(node.children, path);
      if (child) return child;
    }
  }

  return undefined;
}

const DragPreview = ({ node, x, y }: DragPreviewState) => (
  <div
    className="files-tree__drag-preview"
    data-testid="files-tree-drag-preview"
    style={
      {
        '--drag-preview-x': `${x}px`,
        '--drag-preview-y': `${y}px`,
      } as DragPreviewStyle
    }
  >
    <span
      className={`files-tree__icon${node.kind === 'folder' ? ' files-tree__icon--folder' : ''}`}
      aria-hidden="true"
    >
      {node.kind === 'file' ? (node.extension?.toUpperCase() ?? 'FILE') : ''}
    </span>
    <span className="files-tree__drag-preview-name">{node.name}</span>
  </div>
);

const TreeRows = ({
  nodes,
  expandedPaths,
  activeFilePath,
  activeFolderPath,
  onToggleFolder,
  onOpenFile,
  onMoveEntry,
  renamingPath,
  onOpenEntryMenu,
  onRenameSubmit,
  onRenameCancel,
  depth,
  dropTargetPath,
  onPointerDragStart,
  shouldSuppressClick,
}: TreeRowsProps) => (
  <>
    {nodes.map((node) => {
      if (node.kind === 'folder') {
        const isExpanded = expandedPaths.has(node.path);
        const isDropTarget = dropTargetPath === node.path;
        const isActive = activeFolderPath === node.path;

        return (
          <div key={node.id}>
            <div
              role="button"
              tabIndex={0}
              className={`files-tree__row files-tree__row--folder${
                isDropTarget ? ' files-tree__row--drop-target' : ''
              }${isActive ? ' files-tree__row--active' : ''}`}
              data-testid={`files-tree-row-${node.path}`}
              data-project-row="true"
              data-project-drop-path={node.path}
              aria-expanded={isExpanded}
              style={{ '--tree-depth': depth } as TreeDepthStyle}
              onPointerDown={(event) => onPointerDragStart(event, node)}
              onClick={(event) =>
                handleRowClick(event, shouldSuppressClick, () => onToggleFolder(node))
              }
              onKeyDown={(event) => handleRowKeyDown(event, () => onToggleFolder(node))}
              onContextMenu={(event) => {
                if (!onOpenEntryMenu) return;
                event.preventDefault();
                onOpenEntryMenu(node, { x: event.clientX, y: event.clientY });
              }}
            >
              <span
                className="files-tree__icon files-tree__icon--folder"
                data-tree-part="icon"
                aria-hidden="true"
              />
              {renamingPath === node.path && (onRenameSubmit || onRenameCancel) ? (
                <RenameInput
                  node={node}
                  onSubmit={onRenameSubmit ?? (() => {})}
                  onCancel={onRenameCancel ?? (() => {})}
                />
              ) : (
                <FolderName name={node.name} />
              )}
            </div>
            {isExpanded && node.children && (
              <TreeRows
                nodes={node.children}
                expandedPaths={expandedPaths}
                activeFilePath={activeFilePath}
                activeFolderPath={activeFolderPath}
                onToggleFolder={onToggleFolder}
                onOpenFile={onOpenFile}
                onMoveEntry={onMoveEntry}
                renamingPath={renamingPath}
                onOpenEntryMenu={onOpenEntryMenu}
                onRenameSubmit={onRenameSubmit}
                onRenameCancel={onRenameCancel}
                depth={depth + 1}
                dropTargetPath={dropTargetPath}
                onPointerDragStart={onPointerDragStart}
                shouldSuppressClick={shouldSuppressClick}
              />
            )}
          </div>
        );
      }

      return (
        <div
          key={node.id}
          role="button"
          tabIndex={0}
          className={`files-tree__row files-tree__row--file${
            node.path === activeFilePath ? ' files-tree__row--active' : ''
          }`}
          data-testid={`files-tree-row-${node.path}`}
          data-project-row="true"
          style={{ '--tree-depth': depth } as TreeDepthStyle}
          onPointerDown={(event) => onPointerDragStart(event, node)}
          onClick={(event) => handleRowClick(event, shouldSuppressClick, () => onOpenFile(node))}
          onKeyDown={(event) => handleRowKeyDown(event, () => onOpenFile(node))}
          onContextMenu={(event) => {
            if (!onOpenEntryMenu) return;
            event.preventDefault();
            onOpenEntryMenu(node, { x: event.clientX, y: event.clientY });
          }}
        >
          <span className="files-tree__icon" data-tree-part="icon" aria-hidden="true">
            {node.extension?.toUpperCase() ?? 'FILE'}
          </span>
          {renamingPath === node.path && (onRenameSubmit || onRenameCancel) ? (
            <RenameInput
              node={node}
              onSubmit={onRenameSubmit ?? (() => {})}
              onCancel={onRenameCancel ?? (() => {})}
            />
          ) : (
            <FileName name={node.name} />
          )}
        </div>
      );
    })}
  </>
);

export const FilesTree = ({
  nodes,
  expandedPaths,
  activeFilePath,
  activeFolderPath,
  onToggleFolder,
  onOpenFile,
  onMoveEntry,
  renamingPath,
  onOpenEntryMenu,
  onRenameSubmit,
  onRenameCancel,
}: FilesTreeProps) => {
  const [dropTargetPath, setDropTargetPath] = useState<string | undefined>();
  const [isPointerDragging, setIsPointerDragging] = useState(false);
  const [dragPreview, setDragPreview] = useState<DragPreviewState | undefined>();
  const treeRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef(nodes);
  const dragSessionRef = useRef<PointerDragSession | undefined>(undefined);
  const suppressClickRef = useRef(false);
  const cleanupPointerDragRef = useRef<(() => void) | undefined>(undefined);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  const getDropTargetPathAtPoint = useCallback((clientX: number, clientY: number) => {
    const tree = treeRef.current;
    const target = document.elementFromPoint(clientX, clientY);
    if (!tree || !target || !tree.contains(target)) return undefined;

    const folderTarget = target.closest<HTMLElement>('[data-project-drop-path]');
    if (folderTarget && tree.contains(folderTarget)) {
      return folderTarget.dataset.projectDropPath;
    }

    const rowTarget = target.closest<HTMLElement>('[data-project-row]');
    if (rowTarget && tree.contains(rowTarget)) {
      return undefined;
    }

    return 'root';
  }, []);

  const clearPointerDrag = useCallback(() => {
    dragSessionRef.current = undefined;
    setIsPointerDragging(false);
    setDropTargetPath(undefined);
    setDragPreview(undefined);
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);
  }, []);

  const handlePointerDragStart = useCallback(
    (event: ReactPointerEvent<HTMLElement>, node: ProjectFileNode) => {
      if (event.button !== 0) return;

      cleanupPointerDragRef.current?.();
      dragSessionRef.current = {
        source: node,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        isDragging: false,
      };

      const handlePointerMove = (pointerEvent: PointerEvent) => {
        const session = dragSessionRef.current;
        if (!session || session.pointerId !== pointerEvent.pointerId) return;

        const distance = Math.hypot(
          pointerEvent.clientX - session.startX,
          pointerEvent.clientY - session.startY
        );
        if (!session.isDragging && distance >= POINTER_DRAG_THRESHOLD) {
          session.isDragging = true;
          suppressClickRef.current = true;
          setIsPointerDragging(true);
        }

        if (!session.isDragging) return;

        pointerEvent.preventDefault();
        setDropTargetPath(getDropTargetPathAtPoint(pointerEvent.clientX, pointerEvent.clientY));
        setDragPreview({ node: session.source, x: pointerEvent.clientX, y: pointerEvent.clientY });
      };

      const handlePointerUp = (pointerEvent: PointerEvent) => {
        const session = dragSessionRef.current;
        if (!session || session.pointerId !== pointerEvent.pointerId) return;

        if (session.isDragging) {
          pointerEvent.preventDefault();
          const targetPath = getDropTargetPathAtPoint(pointerEvent.clientX, pointerEvent.clientY);
          if (targetPath === 'root') {
            onMoveEntry(session.source);
          } else if (targetPath) {
            const destination = findNodeByPath(nodesRef.current, targetPath);
            if (destination?.kind === 'folder') {
              onMoveEntry(session.source, destination);
            }
          }
        }

        cleanupPointerDragRef.current?.();
      };

      const handlePointerCancel = (pointerEvent: PointerEvent) => {
        const session = dragSessionRef.current;
        if (!session || session.pointerId !== pointerEvent.pointerId) return;
        cleanupPointerDragRef.current?.();
      };

      const cleanup = () => {
        document.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('pointerup', handlePointerUp);
        document.removeEventListener('pointercancel', handlePointerCancel);
        cleanupPointerDragRef.current = undefined;
        clearPointerDrag();
      };

      cleanupPointerDragRef.current = cleanup;
      document.addEventListener('pointermove', handlePointerMove, { passive: false });
      document.addEventListener('pointerup', handlePointerUp, { passive: false });
      document.addEventListener('pointercancel', handlePointerCancel);
    },
    [clearPointerDrag, getDropTargetPathAtPoint, onMoveEntry]
  );

  useEffect(() => () => cleanupPointerDragRef.current?.(), []);

  return (
    <div
      ref={treeRef}
      className={`files-tree${dropTargetPath === 'root' ? ' files-tree--root-drop-target' : ''}${
        isPointerDragging ? ' files-tree--dragging' : ''
      }`}
      data-testid="files-tree"
      aria-label="Project files"
    >
      {nodes.length ? (
        <TreeRows
          nodes={nodes}
          expandedPaths={expandedPaths}
          activeFilePath={activeFilePath}
          activeFolderPath={activeFolderPath}
          onToggleFolder={onToggleFolder}
          onOpenFile={onOpenFile}
          onMoveEntry={onMoveEntry}
          renamingPath={renamingPath}
          onOpenEntryMenu={onOpenEntryMenu}
          onRenameSubmit={onRenameSubmit}
          onRenameCancel={onRenameCancel}
          depth={0}
          dropTargetPath={dropTargetPath}
          onPointerDragStart={handlePointerDragStart}
          shouldSuppressClick={() => suppressClickRef.current}
        />
      ) : (
        <div className="files-tree__empty">No files</div>
      )}
      {dragPreview && <DragPreview {...dragPreview} />}
    </div>
  );
};
