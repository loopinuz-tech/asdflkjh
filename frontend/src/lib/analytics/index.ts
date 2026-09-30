// ===========================================
// EduFox — Analytics Utility
// ===========================================
// Centralized event tracking abstraction.
// All analytics calls go through this utility
// to keep the codebase clean and avoid scattering
// raw analytics calls throughout the application.

declare global {
  interface Window {
    ym?: (counterId: number, action: string, ...args: unknown[]) => void
  }
}

const METRICA_ID = import.meta.env.VITE_YANDEX_METRICA_ID
  ? parseInt(import.meta.env.VITE_YANDEX_METRICA_ID, 10)
  : null

/**
 * Sanitize event data to remove sensitive information.
 * Never send passwords, payment details, private content, or auth secrets.
 */
function sanitizeData(data?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!data) return undefined

  const sensitiveKeys = [
    'password', 'token', 'secret', 'key', 'auth',
    'credit_card', 'card_number', 'cvv', 'ssn',
    'content', 'essay', 'writing', 'audio', 'recording',
  ]

  const sanitized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase()
    if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
      continue // Skip sensitive fields
    }
    sanitized[key] = value
  }

  return sanitized
}

/**
 * Track a custom analytics event.
 *
 * @param name - Event name (e.g., "test_started", "signup_completed")
 * @param data - Optional event data (automatically sanitized)
 */
export function trackEvent(name: string, data?: Record<string, unknown>) {
  const sanitizedData = sanitizeData(data)

  // Yandex Metrica
  if (typeof window !== 'undefined' && window.ym && METRICA_ID) {
    window.ym(METRICA_ID, 'reachGoal', name, sanitizedData)
  }

  // Development logging
  if (import.meta.env.DEV) {
    console.log(`[Analytics] ${name}`, sanitizedData || '')
  }
}

/**
 * Track a page view. Called automatically by the YandexMetrica component
 * on route changes.
 */
export function trackPageView(url: string) {
  if (typeof window !== 'undefined' && window.ym && METRICA_ID) {
    window.ym(METRICA_ID, 'hit', url)
  }
}
