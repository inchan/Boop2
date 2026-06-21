export interface ProjectEntry {
  id: string;
  name: string;
  rootPath: string;
}

export interface ProjectFileNode {
  id: string;
  name: string;
  path: string;
  kind: 'folder' | 'file';
  extension?: string;
  children?: ProjectFileNode[];
  childrenLoaded?: boolean;
}

export interface OpenFileTab {
  id: string;
  path: string;
  title: string;
  content: string;
}

export interface ProjectFileClient {
  chooseProjectDirectory: () => Promise<string | null>;
  listProjectDirectory: (path: string) => Promise<ProjectFileNode[]>;
  readProjectFile: (path: string) => Promise<string>;
  createProjectFile: (parentPath: string) => Promise<ProjectFileNode>;
  createProjectFolder: (parentPath: string) => Promise<ProjectFileNode>;
  moveProjectEntry: (sourcePath: string, destinationFolderPath: string) => Promise<ProjectFileNode>;
}
