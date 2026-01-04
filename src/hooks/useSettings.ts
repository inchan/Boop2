import { useState, useCallback } from 'react';

const STORAGE_KEY_SETTINGS = 'boop_settings_v1';

export interface Settings {
  enableSessionRestore: boolean;
  autoRestoreLastSession: boolean;
  openNewTabOnRestore: boolean;
  enableClipboardHistory: boolean;
  enableAutoUpdate: boolean;
  opacity: number;
}

export const DEFAULT_SETTINGS: Settings = {
  enableSessionRestore: true,
  autoRestoreLastSession: false,
  openNewTabOnRestore: false,
  enableClipboardHistory: true,
  enableAutoUpdate: true,
  opacity: 100,
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
    return DEFAULT_SETTINGS;
  });

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
    updateSettings,
    updateSetting,
  };
}
