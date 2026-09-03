import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { projectFileClient } from './projectFileClient';
import type {
  OpenFileTab,
  ProjectEntry,
  ProjectFileClient,
  ProjectFileNode,
} from './projectFileTypes';
import { createProjectId, getDefaultProjectName, normalizeProjectPath } from './projectPathUtils';

const STORAGE_KEY_PROJECTS = 'boop_projects_v1';

interface ProjectWorkspaceStorage {
  projects: ProjectEntry[];
  activeProjectId?: string;
}

export interface UseProjectWorkspaceInput {
  client?: ProjectFileClient;
}

export interface UseProjectWorkspaceResult {
  projects: ProjectEntry[];
  activeProject?: ProjectEntry;
  activeProjectId?: string;
  fileTree: ProjectFileNode[];
  expandedPaths: Set<string>;
  selectedFilePath?: string;
  selectedFolderPath?: string;
  openTabs: OpenFileTab[];
  activeTabId?: string;
  activeTab?: OpenFileTab;
  addProject: () => Promise<void>;
  selectProject: (projectId: string) => Promise<void>;
  toggleFolder: (node: ProjectFileNode) => Promise<void>;
  openFile: (path: string, title: string) => Promise<void>;
  createFile: (parentPath?: string) => Promise<ProjectFileNode | undefined>;
  createFolder: (parentPath?: string) => Promise<ProjectFileNode | undefined>;
  moveEntry: (
    source: ProjectFileNode,
    destinationFolderPath?: string
  ) => Promise<ProjectFileNode | undefined>;
  renameEntry: (node: ProjectFileNode, newName: string) => Promise<ProjectFileNode | undefined>;
  deleteEntry: (node: ProjectFileNode) => Promise<void>;
  closeTab: (tabId: string) => void;
  selectTab: (tabId: string) => void;
  updateActiveTabContent: (content: string) => void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isProjectEntry(value: unknown): value is ProjectEntry {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.rootPath === 'string'
  );
}

function loadStoredProjects(): ProjectWorkspaceStorage {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PROJECTS);
    if (!saved) return { projects: [] };

    const parsed: unknown = JSON.parse(saved);
    if (!isRecord(parsed) || !Array.isArray(parsed.projects)) return { projects: [] };

    return {
      projects: parsed.projects.filter(isProjectEntry),
      activeProjectId:
        typeof parsed.activeProjectId === 'string' ? parsed.activeProjectId : undefined,
    };
  } catch {
    return { projects: [] };
  }
}

function saveStoredProjects(storage: ProjectWorkspaceStorage): void {
  try {
    localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(storage));
  } catch {
    // Project recents should never block the shell.
  }
}

function replaceTreeNode(
  nodes: ProjectFileNode[],
  path: string,
  update: (node: ProjectFileNode) => ProjectFileNode
): ProjectFileNode[] {
  return nodes.map((node) => {
    if (node.path === path) return update(node);
    if (!node.children) return node;
    return { ...node, children: replaceTreeNode(node.children, path, update) };
  });
}

function isSameOrDescendantPath(candidatePath: string, parentPath: string): boolean {
  const candidate = normalizeProjectPath(candidatePath);
  const parent = normalizeProjectPath(parentPath);

  return (
    candidate === parent ||
    candidate.startsWith(`${parent}/`) ||
    candidate.startsWith(`${parent}\\`)
  );
}

function getMovedPath(candidatePath: string, sourcePath: string, movedPath: string): string {
  if (!isSameOrDescendantPath(candidatePath, sourcePath)) return candidatePath;

  const candidate = normalizeProjectPath(candidatePath);
  const source = normalizeProjectPath(sourcePath);
  const moved = normalizeProjectPath(movedPath);

  return candidate === source ? moved : `${moved}${candidate.slice(source.length)}`;
}

function getParentPath(path: string): string {
  const normalized = normalizeProjectPath(path);
  const lastSlash = normalized.lastIndexOf('/');
  return lastSlash <= 0 ? normalized : normalized.slice(0, lastSlash);
}

export function useProjectWorkspace({
  client = projectFileClient,
}: UseProjectWorkspaceInput = {}): UseProjectWorkspaceResult {
  const initialStorage = useMemo(() => loadStoredProjects(), []);
  const [projects, setProjects] = useState<ProjectEntry[]>(initialStorage.projects);
  const [activeProjectId, setActiveProjectId] = useState<string | undefined>(
    initialStorage.activeProjectId
  );
  const [fileTree, setFileTree] = useState<ProjectFileNode[]>([]);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => new Set());
  const [selectedFilePath, setSelectedFilePath] = useState<string | undefined>();
  const [selectedFolderPath, setSelectedFolderPath] = useState<string | undefined>();
  const [openTabs, setOpenTabs] = useState<OpenFileTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | undefined>();
  const didLoadInitialProjectRef = useRef(false);

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId),
    [activeProjectId, projects]
  );
  const activeTab = useMemo(
    () => openTabs.find((tab) => tab.id === activeTabId),
    [activeTabId, openTabs]
  );

  useEffect(() => {
    saveStoredProjects({ projects, activeProjectId });
  }, [activeProjectId, projects]);

  const loadProjectRoot = useCallback(
    async (project: ProjectEntry) => {
      const nodes = await client.listProjectDirectory(project.rootPath);
      setFileTree(nodes);
      setExpandedPaths(new Set());
      setSelectedFilePath(undefined);
      setSelectedFolderPath(undefined);
    },
    [client]
  );

  useEffect(() => {
    if (didLoadInitialProjectRef.current) return;
    didLoadInitialProjectRef.current = true;
    if (!activeProject) return;

    // Initial async project load; state updates happen in promise callbacks.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProjectRoot(activeProject).catch(() => {
      setFileTree([]);
    });
  }, [activeProject, loadProjectRoot]);

  const activateProject = useCallback(
    async (project: ProjectEntry) => {
      setActiveProjectId(project.id);
      await loadProjectRoot(project);
    },
    [loadProjectRoot]
  );

  const addProject = useCallback(async () => {
    const selectedPath = await client.chooseProjectDirectory();
    if (!selectedPath) return;

    const rootPath = normalizeProjectPath(selectedPath);
    const project: ProjectEntry = {
      id: createProjectId(rootPath),
      name: getDefaultProjectName(rootPath),
      rootPath,
    };

    setProjects((currentProjects) =>
      currentProjects.some((currentProject) => currentProject.id === project.id)
        ? currentProjects
        : [...currentProjects, project]
    );
    await activateProject(project);
  }, [activateProject, client]);

  const selectProject = useCallback(
    async (projectId: string) => {
      const project = projects.find((candidate) => candidate.id === projectId);
      if (!project) return;
      await activateProject(project);
    },
    [activateProject, projects]
  );

  const toggleFolder = useCallback(
    async (node: ProjectFileNode) => {
      if (node.kind !== 'folder') return;

      setSelectedFilePath(undefined);
      setSelectedFolderPath(node.path);

      if (expandedPaths.has(node.path)) {
        setExpandedPaths((currentPaths) => {
          const nextPaths = new Set(currentPaths);
          nextPaths.delete(node.path);
          return nextPaths;
        });
        return;
      }

      setExpandedPaths((currentPaths) => new Set(currentPaths).add(node.path));
      if (node.childrenLoaded) return;

      const children = await client.listProjectDirectory(node.path);
      setFileTree((currentTree) =>
        replaceTreeNode(currentTree, node.path, (currentNode) => ({
          ...currentNode,
          children,
          childrenLoaded: true,
        }))
      );
    },
    [client, expandedPaths]
  );

  const openFile = useCallback(
    async (path: string, title: string) => {
      setSelectedFilePath(path);
      setSelectedFolderPath(undefined);
      const existingTab = openTabs.find((tab) => tab.path === path);
      if (existingTab) {
        setActiveTabId(existingTab.id);
        return;
      }

      const content = await client.readProjectFile(path);
      const nextTab: OpenFileTab = {
        id: path,
        path,
        title,
        content,
      };
      setOpenTabs((currentTabs) =>
        currentTabs.some((tab) => tab.path === path) ? currentTabs : [...currentTabs, nextTab]
      );
      setActiveTabId(nextTab.id);
    },
    [client, openTabs]
  );

  const refreshActiveProjectRoot = useCallback(
    async (options?: { collapse?: boolean }) => {
      if (!activeProject) return;
      const nodes = await client.listProjectDirectory(activeProject.rootPath);
      setFileTree(nodes);
      if (options?.collapse) {
        setExpandedPaths(new Set());
      }
    },
    [activeProject, client]
  );

  const getCreationParentPath = useCallback(
    (parentPath?: string) => {
      if (parentPath) return parentPath;
      if (!activeProject) return undefined;
      return selectedFolderPath ?? activeProject.rootPath;
    },
    [activeProject, selectedFolderPath]
  );

  const refreshCreationParent = useCallback(
    async (parentPath: string) => {
      if (!activeProject) return;

      if (normalizeProjectPath(parentPath) === normalizeProjectPath(activeProject.rootPath)) {
        await refreshActiveProjectRoot();
        return;
      }

      const children = await client.listProjectDirectory(parentPath);
      setFileTree((currentTree) =>
        replaceTreeNode(currentTree, parentPath, (currentNode) => ({
          ...currentNode,
          children,
          childrenLoaded: true,
        }))
      );
      setExpandedPaths((currentPaths) => new Set(currentPaths).add(parentPath));
    },
    [activeProject, client, refreshActiveProjectRoot]
  );

  const createFile = useCallback(
    async (requestedParentPath?: string) => {
      const parentPath = getCreationParentPath(requestedParentPath);
      if (!parentPath) return undefined;

      const node = await client.createProjectFile(parentPath);
      await refreshCreationParent(parentPath);
      setSelectedFilePath(node.path);
      setSelectedFolderPath(undefined);
      setOpenTabs((currentTabs) =>
        currentTabs.some((tab) => tab.path === node.path)
          ? currentTabs
          : [...currentTabs, { id: node.path, path: node.path, title: node.name, content: '' }]
      );
      setActiveTabId(node.path);

      return node;
    },
    [client, getCreationParentPath, refreshCreationParent]
  );

  const createFolder = useCallback(
    async (requestedParentPath?: string) => {
      const parentPath = getCreationParentPath(requestedParentPath);
      if (!parentPath) return undefined;

      const node = await client.createProjectFolder(parentPath);
      await refreshCreationParent(parentPath);

      return node;
    },
    [client, getCreationParentPath, refreshCreationParent]
  );

  const moveEntry = useCallback(
    async (source: ProjectFileNode, destinationFolderPath?: string) => {
      if (!activeProject) return undefined;

      const destination = destinationFolderPath ?? activeProject.rootPath;
      const movedNode = await client.moveProjectEntry(source.path, destination);
      await refreshActiveProjectRoot({ collapse: true });

      setOpenTabs((currentTabs) =>
        currentTabs.map((tab) => {
          const nextPath = getMovedPath(tab.path, source.path, movedNode.path);
          return nextPath === tab.path
            ? tab
            : {
                ...tab,
                id: nextPath,
                path: nextPath,
                title: getDefaultProjectName(nextPath),
              };
        })
      );
      setSelectedFilePath((currentPath) =>
        currentPath ? getMovedPath(currentPath, source.path, movedNode.path) : currentPath
      );
      setSelectedFolderPath((currentPath) =>
        currentPath ? getMovedPath(currentPath, source.path, movedNode.path) : currentPath
      );
      setActiveTabId((currentTabId) =>
        currentTabId ? getMovedPath(currentTabId, source.path, movedNode.path) : currentTabId
      );

      return movedNode;
    },
    [activeProject, client, refreshActiveProjectRoot]
  );

  const renameEntry = useCallback(
    async (node: ProjectFileNode, newName: string) => {
      if (!activeProject) return undefined;

      const renamedNode = await client.renameProjectEntry(node.path, newName);
      await refreshCreationParent(getParentPath(node.path));

      setOpenTabs((currentTabs) =>
        currentTabs.map((tab) => {
          const nextPath = getMovedPath(tab.path, node.path, renamedNode.path);
          return nextPath === tab.path
            ? tab
            : {
                ...tab,
                id: nextPath,
                path: nextPath,
                title: getDefaultProjectName(nextPath),
              };
        })
      );
      setSelectedFilePath((currentPath) =>
        currentPath ? getMovedPath(currentPath, node.path, renamedNode.path) : currentPath
      );
      setSelectedFolderPath((currentPath) =>
        currentPath ? getMovedPath(currentPath, node.path, renamedNode.path) : currentPath
      );
      setActiveTabId((currentTabId) =>
        currentTabId ? getMovedPath(currentTabId, node.path, renamedNode.path) : currentTabId
      );

      return renamedNode;
    },
    [activeProject, client, refreshCreationParent]
  );

  const deleteEntry = useCallback(
    async (node: ProjectFileNode) => {
      if (!activeProject) return;

      await client.deleteProjectEntry(node.path);
      await refreshCreationParent(getParentPath(node.path));

      setOpenTabs((currentTabs) => {
        const remaining = currentTabs.filter((tab) => !isSameOrDescendantPath(tab.path, node.path));
        if (remaining.length !== currentTabs.length) {
          setActiveTabId((currentTabId) =>
            currentTabId && isSameOrDescendantPath(currentTabId, node.path)
              ? remaining[remaining.length - 1]?.id
              : currentTabId
          );
        }
        return remaining;
      });
      setSelectedFilePath((currentPath) =>
        currentPath && isSameOrDescendantPath(currentPath, node.path) ? undefined : currentPath
      );
      setSelectedFolderPath((currentPath) =>
        currentPath && isSameOrDescendantPath(currentPath, node.path) ? undefined : currentPath
      );
    },
    [activeProject, client, refreshCreationParent]
  );

  const closeTab = useCallback(
    (tabId: string) => {
      setOpenTabs((currentTabs) => {
        const tabIndex = currentTabs.findIndex((tab) => tab.id === tabId);
        if (tabIndex === -1) return currentTabs;

        const nextTabs = currentTabs.filter((tab) => tab.id !== tabId);
        if (activeTabId === tabId) {
          const nextActiveTab = nextTabs[tabIndex] ?? nextTabs[tabIndex - 1];
          setActiveTabId(nextActiveTab?.id);
          setSelectedFilePath(nextActiveTab?.path);
        }

        return nextTabs;
      });
    },
    [activeTabId]
  );

  const selectTab = useCallback(
    (tabId: string) => {
      const tab = openTabs.find((candidate) => candidate.id === tabId);
      setActiveTabId(tabId);
      setSelectedFilePath(tab?.path);
      setSelectedFolderPath(undefined);
    },
    [openTabs]
  );

  const updateActiveTabContent = useCallback(
    (content: string) => {
      if (!activeTabId) return;
      setOpenTabs((currentTabs) =>
        currentTabs.map((tab) => (tab.id === activeTabId ? { ...tab, content } : tab))
      );
    },
    [activeTabId]
  );

  return {
    projects,
    activeProject,
    activeProjectId,
    fileTree,
    expandedPaths,
    selectedFilePath,
    selectedFolderPath,
    openTabs,
    activeTabId,
    activeTab,
    addProject,
    selectProject,
    toggleFolder,
    openFile,
    createFile,
    createFolder,
    moveEntry,
    renameEntry,
    deleteEntry,
    closeTab,
    selectTab,
    updateActiveTabContent,
  };
}
