import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "asf-notification-state";

interface NotificationState {
  readIds: string[];
  dismissedIds: string[];
}

function loadState(): NotificationState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { readIds: [], dismissedIds: [] };
}

function saveState(state: NotificationState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useNotificationState() {
  const [state, setState] = useState<NotificationState>(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const markAsRead = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      readIds: prev.readIds.includes(id) ? prev.readIds : [...prev.readIds, id],
    }));
  }, []);

  const markAllAsRead = useCallback((ids: string[]) => {
    setState(prev => ({
      ...prev,
      readIds: [...new Set([...prev.readIds, ...ids])],
    }));
  }, []);

  const dismiss = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      dismissedIds: prev.dismissedIds.includes(id) ? prev.dismissedIds : [...prev.dismissedIds, id],
    }));
  }, []);

  const dismissAll = useCallback((ids: string[]) => {
    setState(prev => ({
      ...prev,
      dismissedIds: [...new Set([...prev.dismissedIds, ...ids])],
    }));
  }, []);

  const restoreAll = useCallback(() => {
    setState({ readIds: [], dismissedIds: [] });
  }, []);

  const isRead = useCallback((id: string) => state.readIds.includes(id), [state.readIds]);
  const isDismissed = useCallback((id: string) => state.dismissedIds.includes(id), [state.dismissedIds]);

  return {
    markAsRead,
    markAllAsRead,
    dismiss,
    dismissAll,
    restoreAll,
    isRead,
    isDismissed,
    readIds: state.readIds,
    dismissedIds: state.dismissedIds,
  };
}
