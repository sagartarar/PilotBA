import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';
export type View = 'dashboard' | 'data' | 'query' | 'settings';

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsed: number;
  renderTime: number;
  dataLoadTime: number;
  drawCalls: number;
}

interface UIState {
  theme: Theme;
  sidebarOpen: boolean;
  sidebarWidth: number;
  currentView: View;
  showPerformanceMonitor: boolean;
  performanceMetrics: PerformanceMetrics;
  notifications: Notification[];
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  createdAt: Date;
}

interface UIActions {
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setSidebarWidth: (width: number) => void;
  setCurrentView: (view: View) => void;
  togglePerformanceMonitor: () => void;
  updatePerformanceMetrics: (metrics: Partial<PerformanceMetrics>) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

type UIStore = UIState & UIActions;

const defaultMetrics: PerformanceMetrics = {
  fps: 0,
  frameTime: 0,
  memoryUsed: 0,
  renderTime: 0,
  dataLoadTime: 0,
  drawCalls: 0,
};

function generateNotificationId(): string {
  return `notif_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (theme === 'dark' || (theme === 'system' && systemDark)) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      theme: 'system',
      sidebarOpen: true,
      sidebarWidth: 280,
      currentView: 'dashboard',
      showPerformanceMonitor: false,
      performanceMetrics: defaultMetrics,
      notifications: [],

      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },

      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }));
      },

      setSidebarWidth: (width) => {
        set({ sidebarWidth: Math.max(200, Math.min(400, width)) });
      },

      setCurrentView: (view) => {
        set({ currentView: view });
      },

      togglePerformanceMonitor: () => {
        set((state) => ({ showPerformanceMonitor: !state.showPerformanceMonitor }));
      },

      updatePerformanceMetrics: (metrics) => {
        set((state) => ({
          performanceMetrics: { ...state.performanceMetrics, ...metrics },
        }));
      },

      addNotification: (notification) => {
        const id = generateNotificationId();
        const newNotification: Notification = {
          ...notification,
          id,
          createdAt: new Date(),
        };

        set((state) => ({
          notifications: [...state.notifications, newNotification],
        }));

        // Auto-remove after duration
        const duration = notification.duration ?? 5000;
        if (duration > 0) {
          setTimeout(() => {
            get().removeNotification(id);
          }, duration);
        }
      },

      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      },

      clearNotifications: () => {
        set({ notifications: [] });
      },
    }),
    {
      name: 'pilotba-ui-store',
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        sidebarWidth: state.sidebarWidth,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.theme) {
          applyTheme(state.theme);
        }
      },
    }
  )
);

// Listen for system theme changes
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const { theme } = useUIStore.getState();
    if (theme === 'system') {
      applyTheme('system');
    }
  });
}

