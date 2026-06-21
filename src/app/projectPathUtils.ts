export function normalizeProjectPath(rootPath: string): string {
  return rootPath.replace(/[\\/]+$/, '') || rootPath;
}

export function getDefaultProjectName(rootPath: string): string {
  const normalized = normalizeProjectPath(rootPath);
  const segments = normalized.split(/[\\/]/).filter(Boolean);
  return segments[segments.length - 1] ?? normalized;
}

export function createProjectId(rootPath: string): string {
  return `project:${normalizeProjectPath(rootPath)}`;
}

export function splitFileNameForDisplay(fileName: string): { stem: string; extension: string } {
  const extensionIndex = fileName.lastIndexOf('.');
  if (extensionIndex <= 0 || extensionIndex === fileName.length - 1) {
    return { stem: fileName, extension: '' };
  }

  return {
    stem: fileName.slice(0, extensionIndex),
    extension: fileName.slice(extensionIndex),
  };
}
