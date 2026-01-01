import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY_SETTINGS = 'boop_settings_v1';

export interface Settings {
  enableSessionRestore: boolean;
  autoRestoreLastSession: boolean;
  openNewTabOnRestore: boolean;
  enableClipboardHistory: boolean;
  enableAutoUpdate: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  enableSessionRestore: true,
  autoRestoreLastSession: false,
  openNewTabOnRestore: false,
  enableClipboardHistory: true,
  enableAutoUpdate: true,
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // 초기 로드
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
    setIsLoaded(true);
  }, []);

  const updateSettings = useCallback((newSettings: Settings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(newSettings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }, []);

  const updateSetting = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => {
      const updated = { ...prev, [key]: value };
      try {
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save settings:', e);
      }
      return updated;
    });
  }, []);

  return {
    settings,
    isLoaded,
    updateSettings,
    updateSetting,
  };
}
