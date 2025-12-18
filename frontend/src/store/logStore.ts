/**
 * Log Store for PilotBA
 * 
 * Stores error and event logs with:
 * - Circular buffer (max 1000 entries)
 * - Export capability for debugging
 * - Severity filtering
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PilotBAError, ErrorSeverity } from '../services/errorCodes';
import { errorService } from '../services/ErrorService';

const MAX_LOGS = 1000;

interface LogState {
  logs: PilotBAError[];
  isEnabled: boolean;
}

interface LogActions {
  addLog: (error: PilotBAError) => void;
  clearLogs: () => void;
  setEnabled: (enabled: boolean) => void;
  getLogsBySeverity: (severity: ErrorSeverity) => PilotBAError[];
  getLogsByCategory: (category: string) => PilotBAError[];
  getRecentLogs: (count: number) => PilotBAError[];
  exportLogs: () => string;
  exportLogsAsCSV: () => string;
}

type LogStore = LogState & LogActions;

export const useLogStore = create<LogStore>()(
  persist(
    (set, get) => ({
      logs: [],
      isEnabled: true,

      addLog: (error: PilotBAError) => {
        if (!get().isEnabled) return;

        set((state) => ({
          logs: [error, ...state.logs].slice(0, MAX_LOGS),
        }));
      },

      clearLogs: () => {
        set({ logs: [] });
      },

      setEnabled: (enabled: boolean) => {
        set({ isEnabled: enabled });
      },

      getLogsBySeverity: (severity: ErrorSeverity) => {
        return get().logs.filter((log) => log.severity === severity);
      },

      getLogsByCategory: (category: string) => {
        return get().logs.filter((log) => log.category === category);
      },

      getRecentLogs: (count: number) => {
        return get().logs.slice(0, count);
      },

      exportLogs: () => {
        const { logs } = get();
        return JSON.stringify(
          {
            exportDate: new Date().toISOString(),
            appVersion: '0.1.0',
            environment: import.meta.env.MODE,
            totalLogs: logs.length,
            logs: logs.map((log) => ({
              ...log,
              timestamp: log.timestamp instanceof Date 
                ? log.timestamp.toISOString() 
                : log.timestamp,
            })),
          },
          null,
          2
        );
      },

      exportLogsAsCSV: () => {
        const { logs } = get();
        const headers = [
          'timestamp',
          'severity',
          'category',
          'code',
          'message',
          'userAction',
          'recoverable',
        ];

        const rows = logs.map((log) => [
          log.timestamp instanceof Date 
            ? log.timestamp.toISOString() 
            : String(log.timestamp),
          log.severity,
          log.category,
          log.code,
          `"${log.message.replace(/"/g, '""')}"`,
          `"${(log.userAction || '').replace(/"/g, '""')}"`,
          String(log.recoverable),
        ]);

        return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      },
    }),
    {
      name: 'pilotba-logs',
      partialize: (state) => ({
        // Only persist enabled state, not logs (they can get large)
        isEnabled: state.isEnabled,
      }),
    }
  )
);

// Initialize ErrorService with LogStore reference
errorService.setLogStore(useLogStore.getState().addLog);

// Re-connect when store updates
useLogStore.subscribe((state) => {
  errorService.setLogStore(state.addLog);
});

