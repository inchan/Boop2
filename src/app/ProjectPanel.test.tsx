import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, type ReactElement } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { ProjectPanel, ProjectPanelHeader } from './ProjectPanel';
import type { ProjectEntry } from './projectFileTypes';

let root: Root | null = null;
let container: HTMLDivElement | null = null;

const projects: ProjectEntry[] = [
  { id: 'project:/tmp/Boop2', name: 'Boop2', rootPath: '/tmp/Boop2' },
  { id: 'project:/tmp/Scripts', name: 'Scripts', rootPath: '/tmp/Scripts' },
];

const render = (element: ReactElement) => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);

  act(() => {
    root?.render(element);
  });

  return container;
};

afterEach(() => {
  if (root) {
    act(() => {
      root?.unmount();
    });
  }
  container?.remove();
  root = null;
  container = null;
});

describe('ProjectPanel', () => {
  it('renders the Project header with add action at the end', () => {
    const host = render(<ProjectPanelHeader onAddProject={vi.fn()} />);

    const header = host.querySelector('[data-testid="project-panel-header"]');
    const addButton = host.querySelector<HTMLButtonElement>('[data-testid="project-panel-add"]');

    expect(header?.textContent).toContain('Project');
    expect(addButton?.textContent?.trim()).toBe('+');
    expect(addButton?.getAttribute('aria-label')).toBe('Add Project');
  });

  it('selects Project rows', () => {
    const onSelectProject = vi.fn();
    const host = render(
      <ProjectPanel
        projects={projects}
        activeProjectId="project:/tmp/Boop2"
        onSelectProject={onSelectProject}
      />
    );

    act(() => {
      host
        .querySelector<HTMLButtonElement>('[data-testid="project-row-project:/tmp/Scripts"]')
        ?.click();
    });

    expect(onSelectProject).toHaveBeenCalledWith('project:/tmp/Scripts');
  });

  it('opens a Project context menu from the row menu trigger', () => {
    const onOpenProjectMenu = vi.fn();
    const host = render(
      <ProjectPanel
        projects={projects}
        activeProjectId="project:/tmp/Boop2"
        onSelectProject={vi.fn()}
        onOpenProjectMenu={onOpenProjectMenu}
      />
    );

    act(() => {
      host
        .querySelector<HTMLElement>('[data-testid="project-row-menu-project:/tmp/Boop2"]')
        ?.click();
    });

    expect(onOpenProjectMenu).toHaveBeenCalledWith(
      projects[0],
      expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) })
    );
  });
});
