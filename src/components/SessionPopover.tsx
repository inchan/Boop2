import './SessionPopover.css';
import { Tab } from './TabBar';

export interface Session {
  id: string;
  timestamp: number;
  tabs: Tab[];
}

interface Props {
  sessions: Session[];
  onSelect: (session: Session) => void;
  onClear: () => void;
  onClose: () => void;
}

export function SessionPopover({ sessions, onSelect, onClear, onClose }: Props) {
  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="session-popover-overlay" onClick={onClose}>
      <div className="session-popover" onClick={(e) => e.stopPropagation()}>
        <div className="popover-header">
          <span>SAVED SESSIONS</span>
          <button className="clear-btn" onClick={onClear}>
            Clear History
          </button>
        </div>
        <div className="popover-content">
          {sessions.length === 0 ? (
            <div className="empty-message">No saved sessions</div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className="session-item"
                onClick={() => {
                  onSelect(session);
                  onClose();
                }}
              >
                <div className="session-main">
                  <div className="session-time">{formatDate(session.timestamp)}</div>
                  <div className="session-info">{session.tabs.length} tabs</div>
                </div>
                <div className="session-preview">{session.tabs.map((t) => t.title).join(', ')}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
