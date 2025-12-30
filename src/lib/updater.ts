import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

export interface UpdateInfo {
  available: boolean;
  version?: string;
  currentVersion?: string;
  releaseNotes?: string;
  date?: string;
}

export interface UpdateProgress {
  downloaded: number;
  total: number | null;
}

/**
 * Check for available updates
 * @param options - Optional configuration for the update check
 * @returns UpdateInfo object with update details, or null if check fails
 */
export async function checkForUpdates(options?: { timeout?: number }): Promise<UpdateInfo> {
  try {
    const update = await check({
      timeout: options?.timeout ?? 30000,
    });

    if (update) {
      return {
        available: true,
        version: update.version,
        currentVersion: update.currentVersion,
        releaseNotes: update.body ?? undefined,
        date: update.date ?? undefined,
      };
    }

    return { available: false };
  } catch (error) {
    console.error('[Updater] Check failed:', error);
    return { available: false };
  }
}

/**
 * Download and install the update
 * @param onProgress - Callback for download progress
 * @returns true if successful, false otherwise
 */
export async function downloadAndInstallUpdate(
  onProgress?: (progress: UpdateProgress) => void
): Promise<boolean> {
  try {
    const update = await check();
    if (!update) {
      console.log('[Updater] No update available');
      return false;
    }

    let downloaded = 0;

    await update.downloadAndInstall((event) => {
      if (event.event === 'Started') {
        console.log('[Updater] Download started, size:', event.data.contentLength);
      } else if (event.event === 'Progress') {
        downloaded += event.data.chunkLength;
        onProgress?.({
          downloaded,
          total: null, // contentLength is only in Started event
        });
      } else if (event.event === 'Finished') {
        console.log('[Updater] Download complete');
      }
    });

    return true;
  } catch (error) {
    console.error('[Updater] Download/install failed:', error);
    return false;
  }
}

/**
 * Restart the application to apply the update
 */
export async function restartApp(): Promise<void> {
  await relaunch();
}

// =============================================================================
// TODO: 아래 함수는 사용자의 업데이트 정책을 반영해야 합니다.
// 앱 시작 시 자동 체크, 주기적 체크, 또는 수동 체크만 할지 결정해주세요.
// =============================================================================

/**
 * Determines whether to check for updates on app startup
 *
 * @returns boolean - true if should check on startup
 *
 * TODO: Implement your update check policy here.
 * Consider:
 * - Check on every startup vs. once per day
 * - Respect user preferences (e.g., "Don't check automatically")
 * - Development mode handling
 */
export function shouldCheckOnStartup(): boolean {
  // TODO: Implement your policy
  // Example considerations:
  // - localStorage.getItem('autoUpdateEnabled') !== 'false'
  // - !import.meta.env.DEV
  // - Date.now() - lastCheckTime > 24 * 60 * 60 * 1000
  return true;
}
