import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-primary-600">
              PilotBA
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Lightning-Fast Business Intelligence
            </p>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold mb-4">Welcome to PilotBA</h2>
            <p className="text-gray-700">
              Building the next generation of BI tools with performance at its core.
            </p>
          </div>
        </main>
      </div>
    </QueryClientProvider>
  )
}

export default App


