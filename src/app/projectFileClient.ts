import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import type { ProjectFileClient, ProjectFileNode } from './projectFileTypes';

export interface BackendProjectFileNode {
  id: string;
  name: string;
  path: string;
  kind: 'folder' | 'file';
  extension?: string;
  children_loaded?: boolean;
}

export const normalizeBackendProjectFileNode = (node: BackendProjectFileNode): ProjectFileNode => ({
  id: node.id,
  name: node.name,
  path: node.path,
  kind: node.kind,
  extension: node.extension,
  childrenLoaded: node.children_loaded ?? false,
});

export const projectFileClient: ProjectFileClient = {
  async chooseProjectDirectory() {
    const selected = await open({ directory: true, multiple: false });
    return typeof selected === 'string' ? selected : null;
  },
  async listProjectDirectory(path) {
    const nodes = await invoke<BackendProjectFileNode[]>('list_project_directory', { path });
    return nodes.map(normalizeBackendProjectFileNode);
  },
  async readProjectFile(path) {
    return invoke<string>('read_project_file', { path });
  },
  async createProjectFile(parentPath) {
    const node = await invoke<BackendProjectFileNode>('create_project_file', { parentPath });
    return normalizeBackendProjectFileNode(node);
  },
  async createProjectFolder(parentPath) {
    const node = await invoke<BackendProjectFileNode>('create_project_folder', { parentPath });
    return normalizeBackendProjectFileNode(node);
  },
  async moveProjectEntry(sourcePath, destinationFolderPath) {
    const node = await invoke<BackendProjectFileNode>('move_project_entry', {
      sourcePath,
      destinationFolderPath,
    });
    return normalizeBackendProjectFileNode(node);
  },
  async renameProjectEntry(sourcePath, newName) {
    const node = await invoke<BackendProjectFileNode>('rename_project_entry', {
      sourcePath,
      newName,
    });
    return normalizeBackendProjectFileNode(node);
  },
  async deleteProjectEntry(path) {
    await invoke('delete_project_entry', { path });
  },
};
