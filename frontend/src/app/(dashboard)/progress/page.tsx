import { useEffect, useState } from 'react'
import { getUserProgress } from '@/actions/progress'
import { ProgressClientView } from './client-page'

export default function ProgressPage() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    getUserProgress().then(setData).catch(console.error)
  }, [])

  if (!data) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return <ProgressClientView data={data} />
}
