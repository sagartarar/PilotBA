// Mock data for testing
export const mockUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'test@example.com',
  name: 'Test User',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

export const mockDashboard = {
  id: '123e4567-e89b-12d3-a456-426614174001',
  name: 'Test Dashboard',
  description: 'A test dashboard for unit testing',
  user_id: mockUser.id,
  layout: {
    widgets: [
      {
        id: 'widget-1',
        type: 'chart',
        position: { x: 0, y: 0, w: 6, h: 4 },
      },
    ],
    columns: 12,
  },
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

export const mockDataset = {
  id: '123e4567-e89b-12d3-a456-426614174002',
  name: 'Sales Data',
  source_type: 'csv',
  connection_info: {
    path: '/data/sales.csv',
  },
  user_id: mockUser.id,
  created_at: '2024-01-01T00:00:00Z',
}

export const mockQueryRequest = {
  dataset_id: mockDataset.id,
  query: 'SELECT * FROM sales WHERE year = 2024',
  limit: 100,
}

export const mockQueryResponse = {
  columns: ['id', 'product', 'amount', 'date'],
  data: [
    { id: 1, product: 'Product A', amount: 1000, date: '2024-01-01' },
    { id: 2, product: 'Product B', amount: 1500, date: '2024-01-02' },
    { id: 3, product: 'Product C', amount: 2000, date: '2024-01-03' },
  ],
  row_count: 3,
  execution_time_ms: 45,
}

export const mockChartData = [
  { x: 0, y: 10 },
  { x: 1, y: 20 },
  { x: 2, y: 15 },
  { x: 3, y: 30 },
  { x: 4, y: 25 },
]

export const mockLargeDataset = Array.from({ length: 10000 }, (_, i) => ({
  id: i,
  name: `Item ${i}`,
  value: Math.random() * 1000,
  category: ['A', 'B', 'C', 'D'][i % 4],
}))

