/**
 * Foxford PostgreSQL Client Adapter
 * Replaces Supabase Cloud SDK with direct connection to our PostgreSQL Node.js Backend API.
 * Preserves the exact same interface so that all existing components, hooks and actions work seamlessly!
 */

import { apiUrl } from '@/lib/api-config'

export interface User {
  id: string
  email?: string
  role?: string
  first_name?: string
  last_name?: string
  avatar_url?: string
  onboarding_completed?: boolean
  [key: string]: any
}

const TOKEN_KEY = 'foxford_token'

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token: string | null) {
  if (typeof window === 'undefined') return
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

type AuthListener = (event: 'SIGNED_IN' | 'SIGNED_OUT', session: any) => void
const authListeners: Set<AuthListener> = new Set()

export function notifyAuthChange(event: 'SIGNED_IN' | 'SIGNED_OUT', session: any) {
  authListeners.forEach((listener) => {
    try {
      listener(event, session)
    } catch (e) {
      console.error('Auth listener error:', e)
    }
  })
}

// Fluent Query Builder for .from('table')
class QueryBuilder {
  private table: string
  private selects: string = '*'
  private isCount: boolean = false
  private isSingle: boolean = false
  private isMaybeSingle: boolean = false
  private filters: Record<string, string> = {}
  private orClause: string | null = null
  private orderClause: string | null = null
  private limitNum: number | null = null
  private op: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select'
  private payload: any = null

  constructor(table: string) {
    this.table = table
  }

  select(columns: string = '*', options?: { count?: string; head?: boolean }) {
    this.selects = columns
    if (options?.count) {
      this.isCount = true
    }
    return this
  }

  or(clause: string) {
    this.orClause = clause
    return this
  }

  eq(column: string, value: any) {
    this.filters[column] = `eq.${value}`
    return this
  }

  neq(column: string, value: any) {
    this.filters[column] = `neq.${value}`
    return this
  }

  in(column: string, values: any[]) {
    this.filters[column] = `in.(${values.join(',')})`
    return this
  }

  lte(column: string, value: any) {
    this.filters[column] = `lte.${value}`
    return this
  }

  gte(column: string, value: any) {
    this.filters[column] = `gte.${value}`
    return this
  }

  lt(column: string, value: any) {
    this.filters[column] = `lt.${value}`
    return this
  }

  gt(column: string, value: any) {
    this.filters[column] = `gt.${value}`
    return this
  }

  like(column: string, pattern: string) {
    this.filters[column] = `like.${pattern}`
    return this
  }

  ilike(column: string, pattern: string) {
    this.filters[column] = `ilike.${pattern}`
    return this
  }

  is(column: string, value: any) {
    this.filters[column] = `is.${value}`
    return this
  }

  order(column: string, options: { ascending?: boolean } = {}) {
    const dir = options.ascending === false ? 'desc' : 'asc'
    this.orderClause = `${column}.${dir}`
    return this
  }

  limit(count: number) {
    this.limitNum = count
    return this
  }

  single() {
    this.isSingle = true
    this.limitNum = 1
    return this
  }

  maybeSingle() {
    this.isMaybeSingle = true
    this.limitNum = 1
    return this
  }

  insert(data: any) {
    this.op = 'insert'
    this.payload = data
    return this
  }

  update(data: any) {
    this.op = 'update'
    this.payload = data
    return this
  }

  delete() {
    this.op = 'delete'
    return this
  }

  upsert(data: any, _options?: any) {
    this.op = 'upsert'
    this.payload = data
    return this
  }

  async execute(): Promise<{ data: any; error: any; count?: number }> {
    try {
      const token = getStoredToken()
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      if (this.op === 'select') {
        const queryParams = new URLSearchParams()
        if (this.selects !== '*') queryParams.set('select', this.selects)
        if (this.isCount) queryParams.set('count', 'exact')
        if (this.orderClause) queryParams.set('order', this.orderClause)
        if (this.limitNum !== null) queryParams.set('limit', String(this.limitNum))
        if (this.orClause) queryParams.set('or', this.orClause)

        for (const [k, v] of Object.entries(this.filters)) {
          queryParams.set(k, v)
        }

        const res = await fetch(apiUrl(`/api/data/${this.table}?${queryParams.toString()}`), { headers })
        const json = await res.json()

        if (!res.ok) {
          return { data: null, error: { message: json.error || 'Query failed' } }
        }

        let data = json.data
        if (this.isSingle) {
          data = data && data.length > 0 ? data[0] : null
          if (!data) return { data: null, error: { message: 'Row not found' } }
        } else if (this.isMaybeSingle) {
          data = data && data.length > 0 ? data[0] : null
        }

        return { data, error: null, count: json.count }
      }

      if (this.op === 'insert' || this.op === 'upsert') {
        const res = await fetch(apiUrl(`/api/data/${this.table}`), {
          method: 'POST',
          headers,
          body: JSON.stringify(this.payload),
        })
        const json = await res.json()
        if (!res.ok) return { data: null, error: { message: json.error || 'Insert failed' } }
        return { data: json.data, error: null }
      }

      if (this.op === 'update') {
        // If an eq filter on id or user_id exists
        const idVal = this.filters['id']?.replace('eq.', '') || this.filters['user_id']?.replace('eq.', '')
        const endpoint = idVal ? `/api/data/${this.table}/${idVal}` : `/api/data/${this.table}`

        const res = await fetch(apiUrl(endpoint), {
          method: 'PUT',
          headers,
          body: JSON.stringify(this.payload),
        })
        const json = await res.json()
        if (!res.ok) return { data: null, error: { message: json.error || 'Update failed' } }
        return { data: json.data, error: null }
      }

      if (this.op === 'delete') {
        const idVal = this.filters['id']?.replace('eq.', '')
        const queryParams = new URLSearchParams()
        for (const [k, v] of Object.entries(this.filters)) {
          queryParams.set(k, v)
        }
        const qs = queryParams.toString()
        const endpoint = idVal && Object.keys(this.filters).length === 1
          ? `/api/data/${this.table}/${idVal}`
          : `/api/data/${this.table}${qs ? `?${qs}` : ''}`

        const res = await fetch(apiUrl(endpoint), { method: 'DELETE', headers })
        const json = await res.json()
        if (!res.ok) return { data: null, error: { message: json.error || 'Delete failed' } }
        return { data: true, error: null }
      }

      return { data: null, error: { message: 'Unsupported operation' } }
    } catch (err: any) {
      return { data: null, error: { message: err.message || 'Network error' } }
    }
  }

  // Promise-like then for await support
  then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    return this.execute().then(onfulfilled, onrejected)
  }
}

// Client Singleton
class FoxfordClient {
  auth = {
    getUser: async () => {
      const token = getStoredToken()
      if (!token) return { data: { user: null }, error: null }

      try {
        const res = await fetch(apiUrl('/api/auth/me'), {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) {
          setStoredToken(null)
          return { data: { user: null }, error: { message: 'Session expired' } }
        }
        const json = await res.json()
        return { data: { user: json.user }, error: null }
      } catch (err: any) {
        return { data: { user: null }, error: { message: err.message } }
      }
    },

    getSession: async () => {
      const token = getStoredToken()
      if (!token) return { data: { session: null }, error: null }

      const { data, error } = await this.auth.getUser()
      if (!data.user) {
        return { data: { session: null }, error }
      }
      return {
        data: {
          session: {
            access_token: token,
            user: data.user,
          },
        },
        error: null,
      }
    },

    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      try {
        const res = await fetch(apiUrl('/api/auth/login'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        const json = await res.json()
        if (!res.ok) {
          return { data: { user: null, session: null }, error: { message: json.error || 'Login failed' } }
        }

        setStoredToken(json.token)
        notifyAuthChange('SIGNED_IN', { access_token: json.token, user: json.user })
        return {
          data: { user: json.user, session: { access_token: json.token, user: json.user } },
          error: null,
        }
      } catch (err: any) {
        return { data: { user: null, session: null }, error: { message: err.message } }
      }
    },

    signUp: async ({ email, password, options }: { email: string; password: string; options?: any }) => {
      try {
        const res = await fetch(apiUrl('/api/auth/register'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            firstName: options?.data?.first_name || 'Student',
            lastName: options?.data?.last_name || '',
          }),
        })
        const json = await res.json()
        if (!res.ok) {
          return { data: { user: null, session: null }, error: { message: json.error || 'Registration failed' } }
        }

        setStoredToken(json.token)
        notifyAuthChange('SIGNED_IN', { access_token: json.token, user: json.user })
        return {
          data: { user: json.user, session: { access_token: json.token, user: json.user } },
          error: null,
        }
      } catch (err: any) {
        return { data: { user: null, session: null }, error: { message: err.message } }
      }
    },

    signOut: async () => {
      setStoredToken(null)
      notifyAuthChange('SIGNED_OUT', null)
      return { error: null }
    },

    signInWithOAuth: async ({ provider }: { provider: string }) => {
      if (provider === 'google') {
        const clientId =
          (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
          '157173720336-mmu0o0uitfvenmjmhcrurq6bph7l8hdn.apps.googleusercontent.com'

        return new Promise<{ data: any; error: any }>(async (resolve) => {
          // Helper to dynamically load and ensure Google Identity script
          const ensureLoaded = (): Promise<boolean> => {
            if (typeof window === 'undefined') return Promise.resolve(false)
            if ((window as any).google?.accounts?.oauth2) return Promise.resolve(true)

            return new Promise<boolean>((res) => {
              let script = document.querySelector<HTMLScriptElement>('script[src*="accounts.google.com/gsi/client"]')
              if (!script) {
                script = document.createElement('script')
                script.src = 'https://accounts.google.com/gsi/client'
                script.async = true
                script.defer = true
                document.head.appendChild(script)
              }

              let attempts = 0
              const interval = setInterval(() => {
                attempts++
                if ((window as any).google?.accounts?.oauth2) {
                  clearInterval(interval)
                  res(true)
                } else if (attempts >= 60) {
                  clearInterval(interval)
                  res(false)
                }
              }, 100)
            })
          }

          const isLoaded = await ensureLoaded()
          const google = (window as any).google

          if (!isLoaded || !google?.accounts?.oauth2) {
            resolve({
              data: null,
              error: { message: 'Google Sign-In failed to load. Please check your network or ad blocker.' },
            })
            return
          }

          try {
            const tokenClient = google.accounts.oauth2.initTokenClient({
              client_id: clientId,
              scope: 'email profile openid',
              error_callback: (err: any) => {
                resolve({
                  data: null,
                  error: {
                    message: err?.message || 'Google authorization was closed or cancelled.',
                  },
                })
              },
              callback: async (tokenResponse: any) => {
                if (tokenResponse.error) {
                  resolve({
                    data: null,
                    error: {
                      message: tokenResponse.error_description || tokenResponse.error || 'Google authorization failed',
                    },
                  })
                  return
                }

                try {
                  const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                  })

                  if (!userRes.ok) {
                    throw new Error('Could not retrieve user info from Google')
                  }

                  const profile = await userRes.json()

                  const backendRes = await fetch(apiUrl('/api/auth/google'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      email: profile.email,
                      name: profile.name,
                      picture: profile.picture,
                      sub: profile.sub,
                    }),
                  })

                  const data = await backendRes.json()
                  if (!backendRes.ok) {
                    throw new Error(data.error || 'Google login failed on server')
                  }

                  setStoredToken(data.token)
                  notifyAuthChange('SIGNED_IN', {
                    access_token: data.token,
                    user: data.user,
                  })

                  window.location.href = data.redirectUrl || '/dashboard'
                  resolve({ data, error: null })
                } catch (err: any) {
                  resolve({
                    data: null,
                    error: { message: err.message || 'Authentication error' },
                  })
                }
              },
            })

            tokenClient.requestAccessToken({ prompt: 'select_account' })
          } catch (initErr: any) {
            resolve({
              data: null,
              error: {
                message: initErr?.message || 'Failed to initialize Google Sign-In',
              },
            })
          }
        })
      }
      return { data: null, error: { message: `Unsupported provider: ${provider}` } }
    },

    signInWithTelegram: async (telegramData: any) => {
      try {
        const res = await fetch(apiUrl('/api/auth/telegram'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(telegramData),
        })
        const json = await res.json()
        if (!res.ok || !json.success) {
          return { data: { user: null, session: null }, error: { message: json.error || 'Telegram authentication failed' } }
        }

        setStoredToken(json.token)
        notifyAuthChange('SIGNED_IN', { access_token: json.token, user: json.user })
        return {
          data: {
            user: json.user,
            session: { access_token: json.token, user: json.user },
            redirectUrl: json.redirectUrl || '/dashboard',
          },
          error: null,
        }
      } catch (err: any) {
        return { data: { user: null, session: null }, error: { message: err.message || 'Telegram network error' } }
      }
    },

    initTelegramSession: async () => {
      try {
        const res = await fetch(apiUrl('/api/auth/telegram/init-session'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
        const json = await res.json()
        if (!res.ok || !json.success) {
          return { data: null, error: { message: json.error || 'Failed to initialize session' } }
        }
        return { data: json, error: null }
      } catch (err: any) {
        return { data: null, error: { message: err.message || 'Network error' } }
      }
    },

    checkTelegramSession: async (sessionId: string) => {
      try {
        const res = await fetch(apiUrl(`/api/auth/telegram/check-session?sessionId=${encodeURIComponent(sessionId)}`))
        const json = await res.json()
        if (!res.ok) {
          return { data: null, error: { message: json.error || 'Session check failed' } }
        }

        if (json.status === 'confirmed' && json.token) {
          setStoredToken(json.token)
          notifyAuthChange('SIGNED_IN', { access_token: json.token, user: json.user })
        }

        return { data: json, error: null }
      } catch (err: any) {
        return { data: null, error: { message: err.message || 'Network error' } }
      }
    },

    directTelegramLogin: async (credentials: { username?: string; id?: number; first_name?: string; last_name?: string }) => {
      try {
        const res = await fetch(apiUrl('/api/auth/telegram/direct'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
        })
        const json = await res.json()
        if (!res.ok || !json.success) {
          return { data: { user: null, session: null }, error: { message: json.error || 'Direct login failed' } }
        }

        setStoredToken(json.token)
        notifyAuthChange('SIGNED_IN', { access_token: json.token, user: json.user })
        return {
          data: {
            user: json.user,
            session: { access_token: json.token, user: json.user },
            redirectUrl: json.redirectUrl || '/dashboard',
          },
          error: null,
        }
      } catch (err: any) {
        return { data: { user: null, session: null }, error: { message: err.message || 'Network error' } }
      }
    },


    onAuthStateChange: (callback: AuthListener) => {
      authListeners.add(callback)
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              authListeners.delete(callback)
            },
          },
        },
      }
    },
  }

  from(table: string): QueryBuilder {
    return new QueryBuilder(table)
  }
}

let clientInstance: FoxfordClient | null = null

export function createClient(): any {
  if (!clientInstance) {
    clientInstance = new FoxfordClient()
  }
  return clientInstance
}
