import { useState, useCallback, useEffect } from 'react';
import { Tab } from '../components/TabBar';

const STORAGE_KEY_SESSIONS = 'boop_sessions_stack_v3';
const STORAGE_KEY_CURRENT_TMP = 'boop_current_session_tmp_v3';
const MAX_SESSIONS = 50;

export interface Session {
  id: string;
  timestamp: number;
  tabs: Tab[];
}

const generateId = () => {
  try {
    return crypto.randomUUID();
  } catch {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
};

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>(() => {
    try {
      const savedStack = localStorage.getItem(STORAGE_KEY_SESSIONS);
      return savedStack ? JSON.parse(savedStack) : [];
    } catch (error) {
      console.error('Failed to load sessions:', error);
      return [];
    }
  });

  // 임시 세션 복원 및 로드 완료 처리
  useEffect(() => {
    try {
      // 임시 세션 복원
      const tmpSession = localStorage.getItem(STORAGE_KEY_CURRENT_TMP);
      if (tmpSession) {
        const parsedTmp = JSON.parse(tmpSession);
        if (
          Array.isArray(parsedTmp) &&
          parsedTmp.length > 0 &&
          parsedTmp.some((t: Tab) => t.content.trim() !== '')
        ) {
          // 비동기 업데이트로 렌더링 루프 방지
          setTimeout(() => {
            setSessions((prevStack) => {
              const newStack = [
                { id: generateId(), timestamp: Date.now(), tabs: parsedTmp },
                ...prevStack,
              ].slice(0, MAX_SESSIONS);
              try {
                localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(newStack));
              } catch (e) {
                console.error('Failed to save session:', e);
              }
              return newStack;
            });
          }, 0);
        }
        localStorage.removeItem(STORAGE_KEY_CURRENT_TMP);
      }
    } catch (error) {
      console.error('Failed to process temp session:', error);
    }
  }, []);

  const saveSnapshot = useCallback((tabs: Tab[]) => {
    if (tabs.length === 0 || tabs.every((t) => t.content.trim() === '')) return;

    const snapshot: Session = {
      id: generateId(),
      timestamp: Date.now(),
      tabs: [...tabs],
    };

    setSessions((prev) => {
      const updated = [snapshot, ...prev].slice(0, MAX_SESSIONS);
      try {
        localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save session:', e);
      }
      return updated;
    });

    return snapshot;
  }, []);

  const restoreSession = useCallback((session: Session, currentTabs: Tab[]): Tab[] => {
    // 현재 상태를 스냅샷으로 저장
    if (currentTabs.length > 0 && currentTabs.some((t) => t.content.trim() !== '')) {
      const currentSnapshot: Session = {
        id: generateId(),
        timestamp: Date.now(),
        tabs: [...currentTabs],
      };

      setSessions((prev) => {
        const updated = [currentSnapshot, ...prev.filter((s) => s.id !== session.id)].slice(
          0,
          MAX_SESSIONS
        );
        try {
          localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(updated));
        } catch (e) {
          console.error('Failed to save session:', e);
        }
        return updated;
      });
    }

    return session.tabs;
  }, []);

  const clearSessions = useCallback(() => {
    setSessions([]);
    localStorage.removeItem(STORAGE_KEY_SESSIONS);
  }, []);

  return {
    sessions,
    hasSessions: sessions.length > 0,
    saveSnapshot,
    restoreSession,
    clearSessions,
  };
}
