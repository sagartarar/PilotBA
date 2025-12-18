/**
 * Error Toast Hook
 * 
 * Subscribes to ErrorService and displays toast notifications
 * for error and critical severity events.
 */

import { useEffect } from 'react';
import { errorService, PilotBAError } from '../services';
import { useUIStore } from '../store';

/**
 * Hook to display error notifications as toasts
 * Should be used once at the app root level
 */
export function useErrorToast(): void {
  const addNotification = useUIStore((state) => state.addNotification);

  useEffect(() => {
    const unsubscribe = errorService.subscribe((error: PilotBAError) => {
      // Map severity to notification type
      const type = error.severity === 'critical' ? 'error' : 'warning';

      addNotification({
        type,
        title: error.message,
        message: error.userAction || 'Please try again',
      });
    });

    return unsubscribe;
  }, [addNotification]);
}

/**
 * Hook to get error logs
 */
export function useErrorLogs() {
  // Import dynamically to avoid circular dependency
  const { useLogStore } = require('../store/logStore');
  
  const logs = useLogStore((state: { logs: PilotBAError[] }) => state.logs);
  const clearLogs = useLogStore((state: { clearLogs: () => void }) => state.clearLogs);
  const exportLogs = useLogStore((state: { exportLogs: () => string }) => state.exportLogs);
  const exportLogsAsCSV = useLogStore((state: { exportLogsAsCSV: () => string }) => state.exportLogsAsCSV);

  return {
    logs,
    clearLogs,
    exportLogs,
    exportLogsAsCSV,
  };
}

