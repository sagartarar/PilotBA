import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { PerformanceMonitor } from './components/Debug';
import { ErrorBoundary } from './components/common';
import { useUIStore } from './store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

// View router component
const ViewRouter: React.FC = () => {
  const { currentView } = useUIStore();

  switch (currentView) {
    case 'dashboard':
      return <Dashboard />;
    case 'data':
      return <DataView />;
    case 'query':
      return <QueryView />;
    case 'settings':
      return <SettingsView />;
    default:
      return <Dashboard />;
  }
};

// Placeholder views for now
const DataView: React.FC = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold text-foreground">Data Management</h1>
    <p className="text-muted-foreground">
      Manage your datasets, view column statistics, and explore your data.
    </p>
    <div className="p-8 border-2 border-dashed border-border rounded-lg text-center">
      <p className="text-muted-foreground">
        Select a dataset from the sidebar to view its contents.
      </p>
    </div>
  </div>
);

const QueryView: React.FC = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold text-foreground">Query Builder</h1>
    <p className="text-muted-foreground">
      Build queries with filters, aggregations, and transformations.
    </p>
    <div className="p-8 border-2 border-dashed border-border rounded-lg text-center">
      <p className="text-muted-foreground">
        Query builder coming soon...
      </p>
    </div>
  </div>
);

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
