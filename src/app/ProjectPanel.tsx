import type { ProjectEntry } from './projectFileTypes';

interface MenuPosition {
  x: number;
  y: number;
}

interface ProjectPanelProps {
  projects: ProjectEntry[];
  activeProjectId?: string;
  onSelectProject: (projectId: string) => void;
  onOpenProjectMenu?: (project: ProjectEntry, position: MenuPosition) => void;
}

interface ProjectPanelHeaderProps {
  onAddProject: () => void;
}

export const ProjectPanelHeader = ({ onAddProject }: ProjectPanelHeaderProps) => (
  <div className="project-panel__header" data-testid="project-panel-header">
    <span>Project</span>
    <button
      type="button"
      className="project-panel__add"
      data-testid="project-panel-add"
      aria-label="Add Project"
      onClick={onAddProject}
    >
      +
    </button>
  </div>
);

function getMenuPosition(target: HTMLElement): MenuPosition {
  const rect = target.getBoundingClientRect();
  return { x: rect.right - 4, y: rect.bottom + 4 };
}

export const ProjectPanel = ({
  projects,
  activeProjectId,
  onSelectProject,
  onOpenProjectMenu,
}: ProjectPanelProps) => (
  <div className="project-panel">
    <div className="project-panel__body" aria-label="Projects">
      {projects.length ? (
        projects.map((project) => (
          <button
            key={project.id}
            type="button"
            className={`project-panel__row${
              project.id === activeProjectId ? ' project-panel__row--active' : ''
            }`}
            data-testid={`project-row-${project.id}`}
            aria-pressed={project.id === activeProjectId}
            title={project.rootPath}
            onClick={() => onSelectProject(project.id)}
            onContextMenu={(event) => {
              if (!onOpenProjectMenu) return;
              event.preventDefault();
              onOpenProjectMenu(project, { x: event.clientX, y: event.clientY });
            }}
          >
            <span className="project-panel__avatar" aria-hidden="true">
              {project.name.trim().charAt(0).toUpperCase() || '?'}
            </span>
            <span className="project-panel__name">{project.name}</span>
            {onOpenProjectMenu && (
              <span
                className="project-panel__context-trigger"
                data-testid={`project-row-menu-${project.id}`}
                aria-hidden="true"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenProjectMenu(project, getMenuPosition(event.currentTarget));
                }}
              >
                ...
              </span>
            )}
          </button>
        ))
      ) : (
        <div className="project-panel__empty">No Projects</div>
      )}
    </div>
  </div>
);
