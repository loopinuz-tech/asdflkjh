import { useEffect, useState } from 'react'
import { getUserSettings } from '@/actions/settings'
import { SettingsClientView } from './client-page'

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null)

  useEffect(() => {
    getUserSettings().then(setSettings).catch(console.error)
  }, [])

  if (!settings) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return <SettingsClientView initialSettings={settings} />
}
