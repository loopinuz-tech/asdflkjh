import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { createClient } from '@/lib/supabase/client'
import { verifyUserTestAccess } from '@/lib/test-access'
import type { Test } from '@/lib/test-engine/types'

interface TestLoaderState {
  test: Test | null
  attemptId: string | null
  initialAnswers: Record<string, any>
  initialMarked: string[]
  loading: boolean
  error: string | null
}

/**
 * Generic hook to load test data and create/resume attempt.
 * Supports review mode via ?attemptId=... or ?review=true.
 */
export function useTestLoader(skill: string) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const targetAttemptId = searchParams.get('attemptId')
  const isReview = searchParams.get('review') === 'true'

  const [state, setState] = useState<TestLoaderState>({
    test: null,
    attemptId: null,
    initialAnswers: {},
    initialMarked: [],
    loading: true,
    error: null,
  })

  useEffect(() => {
    if (!id) return

    async function loadTest() {
      const supabase = createClient()

      // Get user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate(`/login?redirect=/tests/${skill}/${id}`)
        return
      }

      // 1. Load test first (supports either UUID or slug)
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id!)
      let testQuery = supabase
        .from('tests')
        .select(`
          id, title, description, skill, time_limit_minutes, is_premium, access_type, slug,
          sections:test_sections(
            id, title, order_number, instructions,
            groups:question_groups(
              id, title, instruction,
              passage:reading_passages(id, title, content),
              media:listening_audio(id, title, file_path),
              questions:questions(
                id, question_type, question_number, instruction, question_text, question_html, image_url, audio_url,
                options:question_options(id, option_key, option_text)
              )
            )
          )
        `)

      testQuery = isUuid ? testQuery.eq('id', id!) : testQuery.eq('slug', id!)
      const { data: testRaw, error } = await testQuery.single()
      const test = testRaw as any
      if (error || !test) {
        setState(prev => ({ ...prev, loading: false, error: 'Test not found' }))
        return
      }

      // 2. Check for in-progress attempt using test.id (always the UUID)
      const inProgressResult = await supabase
        .from('test_attempts')
        .select('id')
        .eq('user_id', user.id)
        .eq('test_id', test.id)
        .eq('status', 'in_progress')
        .maybeSingle()

      // Check access
      const access = await verifyUserTestAccess(user.id, test)
      if (!access.hasAccess) {
        navigate(`/premium?testId=${test.id}&reason=premium_required`)
        return
      }

      // Sort sections and questions
      if (test.sections) {
        test.sections.sort((a: any, b: any) => a.order_number - b.order_number)
        test.sections.forEach((s: any) => {
          if (s.groups) {
            s.groups.forEach((g: any) => {
              if (g.questions) {
                g.questions.sort((a: any, b: any) => a.question_number - b.question_number)
              }
            })
          }
        })
      }

      // Determine attemptId: target attempt from URL or review query or in-progress
      let attemptId: string | undefined = undefined

      if (targetAttemptId) {
        const { data: targetAtt } = await supabase
          .from('test_attempts')
          .select('id, status, raw_score, estimated_band, created_at')
          .eq('id', targetAttemptId)
          .maybeSingle()

        if (targetAtt) {
          attemptId = targetAtt.id
          if (targetAtt.status === 'submitted' || targetAtt.status === 'scored' || targetAtt.status === 'completed' || isReview) {
            const resObj = {
              rawScore: targetAtt.raw_score,
              estimatedBand: targetAtt.estimated_band,
              status: targetAtt.status,
              attemptId: targetAtt.id,
              submittedAt: (targetAtt as any).created_at
            }
            try {
              localStorage.setItem(`foxford_test_result_${attemptId}`, JSON.stringify(resObj))
              localStorage.setItem(`foxford_test_result_${test.id}`, JSON.stringify(resObj))
            } catch (e) {}
          }
        }
      } else if (isReview) {
        // Load latest submitted attempt for this user and test
        const { data: latestAtt } = await supabase
          .from('test_attempts')
          .select('id, status, raw_score, estimated_band, created_at')
          .eq('user_id', user.id)
          .eq('test_id', test.id)
          .in('status', ['submitted', 'scored', 'completed'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (latestAtt) {
          attemptId = latestAtt.id
          const resObj = {
            rawScore: latestAtt.raw_score,
            estimatedBand: latestAtt.estimated_band,
            status: latestAtt.status,
            attemptId: latestAtt.id,
            submittedAt: (latestAtt as any).created_at
          }
          try {
            localStorage.setItem(`foxford_test_result_${attemptId}`, JSON.stringify(resObj))
            localStorage.setItem(`foxford_test_result_${test.id}`, JSON.stringify(resObj))
          } catch (e) {}
        }
      }

      // If no attempt found and not reviewing, resume existing in-progress or create new
      if (!attemptId) {
        const existingId = (inProgressResult.data as any)?.id as string | undefined
        if (existingId) {
          attemptId = existingId
        } else if (!isReview) {
          const { data: newAttempt } = await supabase
            .from('test_attempts')
            .insert({
              user_id: user.id,
              test_id: (test as any).id,
              status: 'in_progress'
            } as any)
            .select('id')
            .single()
          attemptId = (newAttempt as any)?.id || ''
        }
      }

      // Load saved answers from DB if resuming attempt
      const initialAnswers: Record<string, any> = {}
      const initialMarked: string[] = []
      if (attemptId) {
        try {
          const { data: answersData } = await supabase
            .from('attempt_answers')
            .select('question_id, user_answer, marked_for_review')
            .eq('attempt_id', attemptId)
          if (answersData && Array.isArray(answersData)) {
            for (const ans of answersData) {
              let val = ans.user_answer
              if (typeof val === 'string') {
                try { val = JSON.parse(val) } catch {}
              }
              if (val !== undefined && val !== null) {
                initialAnswers[ans.question_id] = val
              }
              if (ans.marked_for_review) {
                initialMarked.push(ans.question_id)
              }
            }
          }
        } catch (e) {
          console.warn('Failed to load attempt answers from DB:', e)
        }
      }

      setState({
        test: test as any,
        attemptId: attemptId || null,
        initialAnswers,
        initialMarked,
        loading: false,
        error: null
      })
    }

    loadTest().catch(err => {
      console.error('Failed to load test:', err)
      setState(prev => ({ ...prev, loading: false, error: err.message }))
    })
  }, [id, skill])

  return state
}
