import React, { Suspense, lazy } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './components/Layout';
import { PerformanceMonitor } from './components/Debug';
import { ErrorBoundary, LoadingSpinner } from './components/common';
import { useUIStore } from './store';

// Lazy load heavy components for code splitting
const Dashboard = lazy(() => import('./components/Dashboard/Dashboard'));
const DatasetManager = lazy(() => import('./components/Data/DatasetManager'));
const QueryBuilder = lazy(() => import('./components/Query/QueryBuilder'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

// Loading fallback component
const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
    <LoadingSpinner size="lg" label="Loading..." />
  </div>
);

// View router component with lazy loading
const ViewRouter: React.FC = () => {
  const { currentView } = useUIStore();

  return (
    <Suspense fallback={<PageLoader />}>
      {currentView === 'dashboard' && <Dashboard />}
      {currentView === 'data' && (
        <div className="h-[calc(100vh-8rem)]">
          <DatasetManager />
        </div>
      )}
      {currentView === 'query' && (
        <div className="h-[calc(100vh-8rem)]">
          <QueryBuilder />
        </div>
      )}
      {currentView === 'settings' && <SettingsView />}
    </Suspense>
  );
};

const SettingsView: React.FC = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold text-foreground">Settings</h1>
    <div className="max-w-md space-y-4">
      <ThemeSettings />
    </div>
  </div>
);

const ThemeSettings: React.FC = () => {
  const { theme, setTheme } = useUIStore();

  return (
    <div className="p-4 rounded-lg border border-border bg-card">
      <h3 className="font-semibold text-foreground mb-3">Appearance</h3>
      <div className="flex gap-2">
        {(['light', 'dark', 'system'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTheme(t)}
            aria-pressed={theme === t}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              theme === t
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppLayout>
          <ViewRouter />
        </AppLayout>
        <PerformanceMonitor />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
