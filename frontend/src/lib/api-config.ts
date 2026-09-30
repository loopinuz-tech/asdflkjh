/**
 * Foxford Backend API Configuration
 * Supports VITE_API_URL environment variable or defaults to the production Render backend URL.
 */
const envApiUrl = (import.meta as any).env?.VITE_API_URL

export const API_BASE_URL: string =
  envApiUrl !== undefined && envApiUrl !== null && envApiUrl !== ''
    ? String(envApiUrl).replace(/\/$/, '')
    : 'https://edufox-backend.onrender.com'

/**
 * Returns the absolute or formatted URL for an API or upload endpoint.
 * e.g. apiUrl('/api/auth/google') => 'https://edufox-backend.onrender.com/api/auth/google'
 */
export function apiUrl(path: string): string {
  if (!path) return API_BASE_URL
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  if (!API_BASE_URL) return cleanPath
  return `${API_BASE_URL}${cleanPath}`
}

/**
 * Installs global fetch interceptor to guarantee that relative '/api/' and '/uploads/'
 * requests made from anywhere in the frontend automatically route to API_BASE_URL.
 */
export function setupApiInterceptor() {
  if (typeof window === 'undefined') return
  if ((window as any).__foxford_fetch_intercepted__) return
  ;(window as any).__foxford_fetch_intercepted__ = true

  const originalFetch = window.fetch.bind(window)

  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    try {
      if (typeof input === 'string') {
        if (input.startsWith('/api') || input.startsWith('/uploads')) {
          return originalFetch(apiUrl(input), init)
        }
      } else if (input instanceof URL) {
        if (input.pathname.startsWith('/api') || input.pathname.startsWith('/uploads')) {
          return originalFetch(apiUrl(`${input.pathname}${input.search}`), init)
        }
      }
    } catch (e) {
      console.warn('API interceptor warning:', e)
    }
    return originalFetch(input, init)
  }
}
