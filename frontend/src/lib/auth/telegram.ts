// Telegram authentication validation.
// NOTE: In the Vite SPA, this validation runs through the /api/auth/telegram endpoint
// which should be deployed as a Supabase Edge Function or separate API.
// This file is kept for reference but is NOT imported by browser code.

export interface TelegramAuthData {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}

export {}
