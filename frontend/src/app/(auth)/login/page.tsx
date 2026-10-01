import { Suspense, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSearchParams } from 'react-router-dom'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, Lock } from 'lucide-react'
import { TelegramLoginButton } from '@/components/auth/telegram-login-button'

function AuthErrorBanner() {
  const [searchParams] = useSearchParams()
  const errorParam = searchParams.get('error')

  if (!errorParam) return null

  return (
    <Alert variant="destructive">
      <AlertDescription>{decodeURIComponent(errorParam)}</AlertDescription>
    </Alert>
  )
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const supabase = createClient()

  const redirectUrl = searchParams.get('redirect') || searchParams.get('next') || '/dashboard'

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw new Error(error.message)
      }

      if (data?.user?.role === 'admin') {
        navigate('/admin')
      } else {
        navigate(redirectUrl)
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      })
      if (error) throw error
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate with Google')
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground">
          Sign in to your Foxford account
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Suspense fallback={null}>
          <AuthErrorBanner />
        </Suspense>

        {/* Email & Password Form */}
        <form onSubmit={handleEmailLogin} className="flex flex-col gap-3">
          <div className="relative">
            <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="Email address (e.g. xudayberganovbackend@gmail.com)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-11 pl-10 pr-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full h-11 pl-10 pr-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="h-11 w-full font-medium text-sm mt-1 cursor-pointer"
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Sign In
          </Button>
        </form>

        <div className="relative my-1">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground font-medium">
              Or continue with
            </span>
          </div>
        </div>

        {/* Google Login */}
        <Button
          variant="outline"
          type="button"
          disabled={isLoading}
          onClick={handleGoogleLogin}
          className="h-11 w-full cursor-pointer hover:bg-muted/80 transition-colors font-medium text-sm"
        >
          <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
            <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
          </svg>
          Continue with Google
        </Button>

        {/* Telegram Login */}
        <TelegramLoginButton text="Continue with Telegram" />
      </div>

      <p className="px-8 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link to="/signup" className="underline underline-offset-4 hover:text-primary font-medium">
          Sign up
        </Link>
      </p>
    </div>
  )
}
