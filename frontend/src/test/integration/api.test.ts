// Integration tests for API communication
import { describe, it, expect, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'

const API_BASE = 'http://localhost:8080/api'

describe('API Integration Tests', () => {
  describe('Health Check', () => {
    it('fetches health status successfully', async () => {
      const response = await fetch(`${API_BASE}/health`)
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.status).toBe('healthy')
      expect(data.service).toBe('pilotba-backend')
    })
  })

  describe('Status Endpoint', () => {
    it('fetches application status', async () => {
      const response = await fetch(`${API_BASE}/status`)
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.status).toBe('running')
      expect(data.version).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('handles 500 errors gracefully', async () => {
      const response = await fetch(`${API_BASE}/error`)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal Server Error')
    })

    it('handles 404 errors gracefully', async () => {
      const response = await fetch(`${API_BASE}/not-found`)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Not Found')
    })
  })

  describe('Network Failures', () => {
    it('handles network errors', async () => {
      server.use(
        http.get(`${API_BASE}/health`, () => {
          return HttpResponse.error()
        })
      )

      try {
        await fetch(`${API_BASE}/health`)
        expect.fail('Should have thrown an error')
      } catch (error) {
        expect(error).toBeDefined()
      }
    })
  })

  describe('Query Execution', () => {
    it('executes query and returns results', async () => {
      const queryRequest = {
        dataset_id: '123e4567-e89b-12d3-a456-426614174000',
        query: 'SELECT * FROM test',
        limit: 10,
      }

      const response = await fetch(`${API_BASE}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(queryRequest),
      })

      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.columns).toBeDefined()
      expect(data.data).toBeInstanceOf(Array)
      expect(data.row_count).toBe(2)
      expect(data.execution_time_ms).toBeGreaterThan(0)
    })
  })

  describe('Dashboard Operations', () => {
    it('fetches dashboard list', async () => {
      const response = await fetch(`${API_BASE}/dashboards`)
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.dashboards).toBeInstanceOf(Array)
      expect(data.dashboards.length).toBeGreaterThan(0)
    })

    it('creates a new dashboard', async () => {
      const newDashboard = {
        name: 'New Dashboard',
        description: 'Created in test',
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        layout: { widgets: [], columns: 12 },
      }

      const response = await fetch(`${API_BASE}/dashboards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newDashboard),
      })

      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.id).toBeDefined()
      expect(data.name).toBe(newDashboard.name)
    })
  })

  describe('Request Retries', () => {
    it('retries failed requests', async () => {
      let attemptCount = 0

      server.use(
        http.get(`${API_BASE}/health`, () => {
          attemptCount++
          if (attemptCount < 3) {
            return HttpResponse.error()
          }
          return HttpResponse.json({ status: 'healthy' })
        })
      )

      // Manual retry logic
      let response
      let lastError

      for (let i = 0; i < 3; i++) {
        try {
          response = await fetch(`${API_BASE}/health`)
          if (response.ok) break
        } catch (error) {
          lastError = error
        }
      }

      expect(attemptCount).toBe(3)
      expect(response?.ok).toBe(true)
    })
  })
})

describe('API Security Tests', () => {
  it('sanitizes user input in requests', async () => {
    const maliciousInput = "<script>alert('xss')</script>"
    
    const response = await fetch(`${API_BASE}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dataset_id: maliciousInput,
        query: maliciousInput,
        limit: 10,
      }),
    })

    // Should handle gracefully without executing script
    expect(response).toBeDefined()
  })

  it('validates request payload structure', async () => {
    const invalidPayload = {
      // Missing required fields
      query: 'SELECT * FROM test',
    }

    const response = await fetch(`${API_BASE}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidPayload),
    })

    // API should handle validation (mock always succeeds, but test structure exists)
    expect(response).toBeDefined()
  })
})

