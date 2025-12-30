import './SettingsPopover.css';

export interface Settings {
  enableSessionRestore: boolean;
  autoRestoreLastSession: boolean;
  openNewTabOnRestore: boolean;
  enableClipboardHistory: boolean;
  enableAutoUpdate: boolean;
}

interface Props {
  settings: Settings;
  onUpdate: (settings: Settings) => void;
  onClose: () => void;
}

export function SettingsPopover({ settings, onUpdate, onClose }: Props) {
  const handleToggle = (key: keyof Settings) => {
    const newSettings = { ...settings, [key]: !settings[key] };

    // 하위 옵션 활성화 시 상위 옵션도 자동 활성화
    if (key === 'autoRestoreLastSession' && !settings[key]) {
      newSettings.enableSessionRestore = true;
    }
    if (key === 'openNewTabOnRestore' && !settings[key]) {
      newSettings.enableSessionRestore = true;
    }

    onUpdate(newSettings);
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-popover" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h3>Settings</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="settings-content">
          <div className="settings-section">
            <h4>세션 관리</h4>

            <label className="settings-item">
              <input
                type="checkbox"
                checked={settings.enableSessionRestore}
                onChange={() => handleToggle('enableSessionRestore')}
              />
              <span>세션 복원 기능 사용</span>
            </label>

            <label className={`settings-item ${!settings.enableSessionRestore ? 'disabled' : ''}`}>
              <input
                type="checkbox"
                checked={settings.autoRestoreLastSession}
                onChange={() => handleToggle('autoRestoreLastSession')}
                disabled={!settings.enableSessionRestore}
              />
              <span>마지막 세션 자동 복원</span>
            </label>

            <label className={`settings-item ${!settings.enableSessionRestore ? 'disabled' : ''}`}>
              <input
                type="checkbox"
                checked={settings.openNewTabOnRestore}
                onChange={() => handleToggle('openNewTabOnRestore')}
                disabled={!settings.enableSessionRestore}
              />
              <span>항상 새로운 탭</span>
            </label>
          </div>

          <div className="settings-section">
            <h4>클립보드</h4>

            <label className="settings-item">
              <input
                type="checkbox"
                checked={settings.enableClipboardHistory}
                onChange={() => handleToggle('enableClipboardHistory')}
              />
              <span>클립보드 히스토리 사용</span>
            </label>
          </div>

          <div className="settings-section">
            <h4>업데이트</h4>

            <label className="settings-item">
              <input
                type="checkbox"
                checked={settings.enableAutoUpdate}
                onChange={() => handleToggle('enableAutoUpdate')}
              />
              <span>자동 업데이트 확인</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
