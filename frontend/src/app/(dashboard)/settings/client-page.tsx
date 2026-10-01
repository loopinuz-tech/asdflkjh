import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Settings as SettingsIcon, User, Target, Shield, Check, Loader2, Sparkles, Send, Sun, Moon, Laptop } from 'lucide-react'
import { updateUserSettings } from '@/actions/settings'
import { useTheme } from '@/components/theme/theme-provider'

function ThemeSelector() {
  const { theme, setTheme } = useTheme()

  const themes: { id: 'light' | 'dark' | 'system'; label: string; icon: any; desc: string }[] = [
    { id: 'light', label: 'Light', icon: Sun, desc: 'Clean white surfaces with high contrast' },
    { id: 'dark', label: 'Dark', icon: Moon, desc: 'Sleek dark theme, easy on the eyes' },
    { id: 'system', label: 'System', icon: Laptop, desc: 'Sync automatically with your device theme' },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {themes.map((t) => {
        const Icon = t.icon
        const isSelected = theme === t.id
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setTheme(t.id)}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              isSelected
                ? 'border-primary bg-primary/10 ring-2 ring-primary/20 shadow-xs'
                : 'border-border bg-card hover:bg-secondary text-foreground'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-primary text-black' : 'bg-secondary text-foreground'}`}>
                <Icon className="w-4 h-4" />
              </div>
              {isSelected && <span className="w-2 h-2 rounded-full bg-primary" />}
            </div>
            <div>
              <div className="font-bold text-sm text-foreground">{t.label}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{t.desc}</div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

interface SettingsClientProps {
  initialSettings: {
    email: string
    firstName: string
    lastName: string
    targetBand: number
    telegramId: number | null
    telegramUsername: string | null
    planName: string
    planStatus: string
  } | null
}

export function SettingsClientView({ initialSettings }: SettingsClientProps) {
  const [firstName, setFirstName] = useState(initialSettings?.firstName || '')
  const [lastName, setLastName] = useState(initialSettings?.lastName || '')
  const [targetBand, setTargetBand] = useState<number>(initialSettings?.targetBand || 7.0)
  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setSuccessMessage(null)
    setErrorMessage(null)

    try {
      await updateUserSettings({
        firstName,
        lastName,
        targetBand,
      })
      setSuccessMessage('Profile settings updated successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update settings')
    } finally {
      setIsSaving(false)
    }
  }

  const bandOptions = [5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0]

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
          <SettingsIcon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Account Settings</h1>
          <p className="text-muted-foreground">Manage your personal details, target band, and subscription.</p>
        </div>
      </div>

      {successMessage && (
        <Alert className="border-fox-success/30 bg-fox-success/10 text-fox-success py-2.5">
          <Check className="h-4 w-4" />
          <AlertDescription className="text-sm font-medium">{successMessage}</AlertDescription>
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="destructive" className="py-2.5">
          <AlertDescription className="text-sm">{errorMessage}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Personal Details */}
        <Card className="border-border fox-shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="w-4 h-4 text-primary" />
              <span>Personal Information</span>
            </CardTitle>
            <CardDescription>Your name and login credentials</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="settings-first-name" className="text-xs font-semibold text-foreground">First Name</label>
                <input
                  id="settings-first-name"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Your first name"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="settings-last-name" className="text-xs font-semibold text-foreground">Last Name</label>
                <input
                  id="settings-last-name"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Your last name"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="settings-email" className="text-xs font-semibold text-foreground">Email Address</label>
              <input
                id="settings-email"
                name="email"
                type="email"
                autoComplete="email"
                disabled
                value={initialSettings?.email || ''}
                className="w-full px-3 py-2 text-sm bg-muted/50 border border-border rounded-lg text-muted-foreground cursor-not-allowed"
              />
            </div>

            {/* Telegram Link Badge */}
            {initialSettings?.telegramUsername && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/40 border border-border text-xs">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-[#229ED9]" />
                  <span>Linked Telegram: <strong>@{initialSettings.telegramUsername}</strong></span>
                </div>
                <span className="text-fox-success font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Verified
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* IELTS Goals */}
        <Card className="border-border fox-shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="w-4 h-4 text-primary" />
              <span>Target Band Score</span>
            </CardTitle>
            <CardDescription>The IELTS band score you are aiming to achieve</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {bandOptions.map((band) => (
                <button
                  key={band}
                  type="button"
                  onClick={() => setTargetBand(band)}
                  className={`py-2 px-3 text-sm font-bold rounded-lg border transition-all ${
                    targetBand === band
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm scale-105'
                      : 'bg-background hover:bg-muted text-foreground border-border'
                  }`}
                >
                  {band.toFixed(1)}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Your study plan and analytics targets will be tailored to Band {targetBand.toFixed(1)}.
            </p>
          </CardContent>
        </Card>

        {/* Appearance & Theme */}
        <Card className="border-border fox-shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sun className="w-4 h-4 text-primary" />
              <span>Appearance & Theme</span>
            </CardTitle>
            <CardDescription>Customize the interface theme to your preference</CardDescription>
          </CardHeader>
          <CardContent>
            <ThemeSelector />
          </CardContent>
        </Card>

        {/* Subscription Plan */}
        <Card className="border-border fox-shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="w-4 h-4 text-primary" />
              <span>Subscription & Membership</span>
            </CardTitle>
            <CardDescription>Your current EduFox tier</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base text-foreground">{initialSettings?.planName || 'Free'} Plan</span>
                  <span className="px-2 py-0.5 rounded-full bg-fox-yellow/10 text-fox-yellow text-[11px] font-bold uppercase tracking-wider">
                    {initialSettings?.planStatus || 'Active'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Access to full practice tests, vocabulary training, and progress tracking.
                </p>
              </div>

              <Button type="button" variant="outline" size="sm">
                Manage Plan
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving} className="px-6 font-semibold">
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
}
