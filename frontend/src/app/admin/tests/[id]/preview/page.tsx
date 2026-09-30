import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getAdminTestById } from '@/actions/admin'
import { TestPreviewView } from './preview-view'

export default function TestPreviewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [testData, setTestData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!id) return
    getAdminTestById(id)
      .then(setTestData)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error || !testData) return (
    <div className="flex items-center justify-center h-64 flex-col gap-4">
      <p className="text-muted-foreground">Test not found.</p>
      <button onClick={() => navigate('/admin/tests')} className="text-primary underline text-sm">
        Back to tests
      </button>
    </div>
  )

  return (
    <TestPreviewView
      test={testData.test}
      sections={testData.sections}
      questions={testData.questions}
    />
  )
}
