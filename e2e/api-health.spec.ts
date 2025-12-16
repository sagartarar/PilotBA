import { test, expect } from '@playwright/test'

const API_BASE = 'http://localhost:8080/api'

test.describe('API Health Checks', () => {
  test('backend health endpoint is accessible', async ({ request }) => {
    const response = await request.get(`${API_BASE}/health`)
    
    expect(response.ok()).toBeTruthy()
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data.status).toBe('healthy')
    expect(data.service).toBe('pilotba-backend')
  })

  test('backend status endpoint is accessible', async ({ request }) => {
    const response = await request.get(`${API_BASE}/status`)
    
    expect(response.ok()).toBeTruthy()
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data.status).toBe('running')
    expect(data.version).toBeDefined()
    expect(data.service).toBe('pilotba-backend')
  })

  test('API returns proper CORS headers', async ({ request }) => {
    const response = await request.get(`${API_BASE}/health`, {
      headers: {
        'Origin': 'http://localhost:3000',
      },
    })
    
    expect(response.ok()).toBeTruthy()
    
    const headers = response.headers()
    // CORS headers should be present
    expect(headers['access-control-allow-origin']).toBeDefined()
  })

  test('API responds to OPTIONS preflight requests', async ({ request }) => {
    const response = await request.fetch(`${API_BASE}/health`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET',
      },
    })
    
    expect(response.status()).toBeLessThan(300)
  })
})

test.describe('API Error Handling', () => {
  test('returns 404 for non-existent endpoints', async ({ request }) => {
    const response = await request.get(`${API_BASE}/nonexistent-endpoint`)
    
    expect(response.status()).toBe(404)
  })

  test('handles malformed requests gracefully', async ({ request }) => {
    const response = await request.post(`${API_BASE}/query`, {
      data: {
        // Invalid/incomplete data
        invalid: 'data',
      },
    })
    
    // Should return an error status, not crash
    expect(response.status()).toBeGreaterThanOrEqual(400)
  })
})

test.describe('API Performance', () => {
  test('health check responds quickly', async ({ request }) => {
    const startTime = Date.now()
    const response = await request.get(`${API_BASE}/health`)
    const responseTime = Date.now() - startTime
    
    expect(response.ok()).toBeTruthy()
    // Should respond within 500ms
    expect(responseTime).toBeLessThan(500)
  })

  test('handles concurrent requests', async ({ request }) => {
    const requests = Array.from({ length: 10 }, () =>
      request.get(`${API_BASE}/health`)
    )
    
    const responses = await Promise.all(requests)
    
    // All requests should succeed
    responses.forEach(response => {
      expect(response.ok()).toBeTruthy()
    })
  })
})

