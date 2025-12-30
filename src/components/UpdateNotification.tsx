import { useState } from 'react';
import type { UpdateInfo, UpdateProgress } from '../lib/updater';
import { downloadAndInstallUpdate, restartApp } from '../lib/updater';
import './UpdateNotification.css';

interface Props {
  updateInfo: UpdateInfo;
  onDismiss: () => void;
}

type UpdateState = 'available' | 'downloading' | 'ready' | 'error';

export function UpdateNotification({ updateInfo, onDismiss }: Props) {
  const [state, setState] = useState<UpdateState>('available');
  const [progress, setProgress] = useState<UpdateProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async () => {
    setState('downloading');
    setError(null);

    const success = await downloadAndInstallUpdate((p) => setProgress(p));

    if (success) {
      setState('ready');
    } else {
      setState('error');
      setError('업데이트 다운로드에 실패했습니다.');
    }
  };

  const handleRestart = async () => {
    await restartApp();
  };

  return (
    <div className="update-notification">
      <div className="update-content">
        <div className="update-icon">
          {state === 'downloading' ? '⏳' : state === 'ready' ? '✅' : state === 'error' ? '❌' : '🎉'}
        </div>

        <div className="update-info">
          {state === 'available' && (
            <>
              <div className="update-title">새 버전이 있습니다!</div>
              <div className="update-version">
                {updateInfo.currentVersion} → {updateInfo.version}
              </div>
            </>
          )}

          {state === 'downloading' && (
            <>
              <div className="update-title">다운로드 중...</div>
              {progress && (
                <div className="update-progress">
                  {Math.round(progress.downloaded / 1024)} KB 다운로드됨
                </div>
              )}
            </>
          )}

          {state === 'ready' && (
            <>
              <div className="update-title">업데이트 준비 완료</div>
              <div className="update-version">재시작하면 적용됩니다</div>
            </>
          )}

          {state === 'error' && (
            <>
              <div className="update-title">업데이트 실패</div>
              <div className="update-error">{error}</div>
            </>
          )}
        </div>

        <div className="update-actions">
          {state === 'available' && (
            <>
              <button className="update-btn primary" onClick={handleUpdate}>
                업데이트
              </button>
              <button className="update-btn secondary" onClick={onDismiss}>
                나중에
              </button>
            </>
          )}

          {state === 'ready' && (
            <>
              <button className="update-btn primary" onClick={handleRestart}>
                지금 재시작
              </button>
              <button className="update-btn secondary" onClick={onDismiss}>
                나중에
              </button>
            </>
          )}

          {state === 'error' && (
            <button className="update-btn secondary" onClick={onDismiss}>
              닫기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
