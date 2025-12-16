// MSW request handlers for API mocking
import { http, HttpResponse } from 'msw'

const API_BASE = 'http://localhost:8080/api'

export const handlers = [
  // Health check endpoint
  http.get(`${API_BASE}/health`, () => {
    return HttpResponse.json({
      status: 'healthy',
      service: 'pilotba-backend',
    })
  }),

  // Status endpoint
  http.get(`${API_BASE}/status`, () => {
    return HttpResponse.json({
      status: 'running',
      version: '0.1.0',
      service: 'pilotba-backend',
    })
  }),

  // User endpoints (examples for future use)
  http.get(`${API_BASE}/users/:id`, ({ params }) => {
    const { id } = params
    return HttpResponse.json({
      id,
      email: 'test@example.com',
      name: 'Test User',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  }),

  // Dashboard endpoints
  http.get(`${API_BASE}/dashboards`, () => {
    return HttpResponse.json({
      dashboards: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Test Dashboard',
          description: 'A test dashboard',
          user_id: '123e4567-e89b-12d3-a456-426614174001',
          layout: { widgets: [], columns: 12 },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
    })
  }),

  http.post(`${API_BASE}/dashboards`, async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json(
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        ...body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { status: 201 }
    )
  }),

  // Query endpoints
  http.post(`${API_BASE}/query`, async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      columns: ['id', 'name', 'value'],
      data: [
        { id: 1, name: 'Test 1', value: 100 },
        { id: 2, name: 'Test 2', value: 200 },
      ],
      row_count: 2,
      execution_time_ms: 45,
    })
  }),

  // Error handling examples
  http.get(`${API_BASE}/error`, () => {
    return HttpResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Something went wrong',
      },
      { status: 500 }
    )
  }),

  http.get(`${API_BASE}/not-found`, () => {
    return HttpResponse.json(
      {
        error: 'Not Found',
        message: 'Resource not found',
      },
      { status: 404 }
    )
  }),
]

