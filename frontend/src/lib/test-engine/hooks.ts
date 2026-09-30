import { useState, useEffect, useCallback, useRef } from 'react'
import { saveAnswer, toggleMarkForReview, submitTest } from '@/actions/tests'
import { Test, TestSection } from './types'
import { debounce } from 'lodash'

export function useTestSession(
  test: Test, 
  attemptId: string, 
  initialAnswers: Record<string, any> = {},
  initialMarked: string[] = []
) {
  const storageKey = `foxford_test_draft_${attemptId || test.id}`

  const [answers, setAnswers] = useState<Record<string, any>>(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed?.answers && typeof parsed.answers === 'object') {
          return { ...initialAnswers, ...parsed.answers }
        }
      }
    } catch (e) {}
    return initialAnswers || {}
  })

  const [markedQuestions, setMarkedQuestions] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed?.marked)) {
          return new Set([...(initialMarked || []), ...parsed.marked])
        }
      }
    } catch (e) {}
    return new Set(initialMarked || [])
  })

  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const resultStorageKey = `foxford_test_result_${attemptId || test.id}`
  const [submissionResult, setSubmissionResult] = useState<any | null>(() => {
    try {
      const saved = localStorage.getItem(resultStorageKey) || (attemptId ? localStorage.getItem(`foxford_test_result_${test.id}`) : null)
      if (saved) return JSON.parse(saved)
    } catch (e) {}
    return null
  })
  const [isSubmitted, setIsSubmitted] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(resultStorageKey) || (attemptId ? localStorage.getItem(`foxford_test_result_${test.id}`) : null)
      if (saved) return true
    } catch (e) {}
    return false
  })
  
  const currentSection = test.sections[currentSectionIndex]

  const saveToStorage = (updatedAnswers: Record<string, any>, updatedMarked: Set<string>) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        answers: updatedAnswers,
        marked: Array.from(updatedMarked),
        updatedAt: Date.now()
      }))
    } catch (e) {}
  }
  
  // Debounced auto-save function
  // We use a ref to persist the debounced function across re-renders
  const autoSaveRef = useRef(
    debounce(async (attemptId: string, questionId: string, answer: any) => {
      await saveAnswer(attemptId, questionId, answer)
    }, 1000)
  )

  const handleAnswerChange = useCallback((questionId: string, answer: any) => {
    setAnswers(prev => {
      const next = { ...prev, [questionId]: answer }
      saveToStorage(next, markedQuestions)
      return next
    })
    autoSaveRef.current(attemptId, questionId, answer)
  }, [attemptId, markedQuestions, storageKey])

  const handleToggleMark = useCallback(async (questionId: string) => {
    setMarkedQuestions(prev => {
      const next = new Set(prev)
      const isMarked = !next.has(questionId)
      if (isMarked) next.add(questionId)
      else next.delete(questionId)
      
      saveToStorage(answers, next)
      // Save mark status to DB asynchronously
      toggleMarkForReview(attemptId, questionId, isMarked, answers[questionId])
      
      return next
    })
  }, [attemptId, answers, storageKey])

  const nextSection = useCallback(() => {
    if (currentSectionIndex < test.sections.length - 1) {
      setCurrentSectionIndex(prev => prev + 1)
    }
  }, [currentSectionIndex, test.sections.length])

  const prevSection = useCallback(() => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(prev => prev - 1)
    }
  }, [currentSectionIndex])

  const startTimeRef = useRef<number>(Date.now())

  const submit = useCallback(async () => {
    setIsSubmitting(true)
    try {
      autoSaveRef.current.flush()
      const elapsedSeconds = Math.max(10, Math.round((Date.now() - startTimeRef.current) / 1000))
      const res = await submitTest(attemptId, answers, elapsedSeconds)
      if (res?.success) {
        try {
          localStorage.removeItem(storageKey)
          localStorage.setItem(resultStorageKey, JSON.stringify(res))
        } catch (e) {}
        setSubmissionResult(res)
        setIsSubmitted(true)
        return res
      }
      return null
    } catch (error) {
      console.error('Failed to submit test', error)
      return null
    } finally {
      setIsSubmitting(false)
    }
  }, [attemptId, storageKey, answers])

  // Get flat array of all question IDs to calculate progress
  const allQuestionIds = test.sections.flatMap(s => 
    s.groups.flatMap(g => g.questions.map(q => q.id))
  )
  
  const answeredCount = Object.keys(answers).filter(k => 
    answers[k] !== undefined && answers[k] !== null && answers[k] !== ''
  ).length
  
  const progress = allQuestionIds.length > 0 
    ? (answeredCount / allQuestionIds.length) * 100 
    : 0

  return {
    answers,
    markedQuestions,
    currentSection,
    currentSectionIndex,
    isFirstSection: currentSectionIndex === 0,
    isLastSection: currentSectionIndex === test.sections.length - 1,
    isSubmitting,
    isSubmitted,
    submissionResult,
    progress,
    totalQuestions: allQuestionIds.length,
    answeredCount,
    handleAnswerChange,
    handleToggleMark,
    nextSection,
    prevSection,
    submit,
    setCurrentSectionIndex
  }
}
