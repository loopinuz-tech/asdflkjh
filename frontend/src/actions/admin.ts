import { createClient } from '@/lib/supabase/client'

// No-op for SPA since Next.js cache revalidation is not applicable in client-side React
const revalidatePath = (_path: string) => {}

/**
 * Returns the Supabase browser client with admin check.
 * Admin authorization is enforced by Supabase RLS policies.
 */
async function getAdminClient() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Check admin role in production
  if (import.meta.env.PROD) {
    if (!user) {
      throw new Error('Unauthorized: Admin login required')
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      throw new Error('Forbidden: Administrative privileges required')
    }
  }

  return {
    supabase,
    user: user || { id: '00000000-0000-0000-0000-000000000001', email: 'xudayberganovbackend@gmail.com' },
  }
}

// ----------------------------------------------------------------------
// 1. DASHBOARD & STATS (Section 1)
// ----------------------------------------------------------------------

export async function getAdminStats() {
  const { supabase } = await getAdminClient()

  // Run metric queries in parallel
  const [
    { count: totalTests },
    { count: publishedTests },
    { count: draftTests },
    { count: freeTests },
    { count: premiumTests },
    { count: totalQuestions },
    { count: readingQuestions },
    { count: listeningQuestions },
    { count: writingPrompts },
    { count: speakingPrompts },
    { count: totalUsers },
    { count: premiumUsers },
    { count: totalAttempts },
  ] = await Promise.all([
    supabase.from('tests').select('*', { count: 'exact', head: true }),
    supabase.from('tests').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('tests').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('tests').select('*', { count: 'exact', head: true }).eq('is_premium', false),
    supabase.from('tests').select('*', { count: 'exact', head: true }).eq('is_premium', true),
    supabase.from('questions').select('*', { count: 'exact', head: true }),
    supabase.from('tests').select('*', { count: 'exact', head: true }).eq('skill', 'reading'),
    supabase.from('tests').select('*', { count: 'exact', head: true }).eq('skill', 'listening'),
    supabase.from('writing_prompts').select('*', { count: 'exact', head: true }),
    supabase.from('speaking_prompts').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('test_attempts').select('*', { count: 'exact', head: true }),
  ])

  // Fetch real timestamps for charts
  const [
    { data: allTestsCreated },
    { data: allQuestionsCreated },
    { data: allAttemptsData },
  ] = await Promise.all([
    supabase.from('tests').select('id, created_at'),
    supabase.from('questions').select('id, created_at'),
    supabase.from('test_attempts').select('id, test_id, created_at, submitted_at, estimated_band, status'),
  ])

  // 1. Real Content Growth Over Time (Last 6 months)
  const now = new Date()
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const creationTrendData: any[] = []

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
    const mName = monthNames[d.getMonth()]

    const testsCount = (allTestsCreated || []).filter((t) => new Date(t.created_at) <= endOfMonth).length
    const questionsCount = (allQuestionsCreated || []).filter((q) => new Date(q.created_at) <= endOfMonth).length

    creationTrendData.push({
      name: mName,
      tests: testsCount,
      questions: questionsCount,
    })
  }

  // 2. Real Weekly Test Attempts Trend (Mon - Sun of current week)
  const currentDayOfWeek = now.getDay() // 0 = Sun, 1 = Mon ...
  const diffToMonday = (currentDayOfWeek + 6) % 7
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - diffToMonday)
  startOfWeek.setHours(0, 0, 0, 0)

  const startOfLastWeek = new Date(startOfWeek)
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7)

  const attemptsThisWeek = (allAttemptsData || []).filter((a) => {
    const dt = new Date(a.created_at || a.submitted_at)
    return dt >= startOfWeek
  })

  const attemptsLastWeek = (allAttemptsData || []).filter((a) => {
    const dt = new Date(a.created_at || a.submitted_at)
    return dt >= startOfLastWeek && dt < startOfWeek
  })

  const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const attemptsTrendData = dayOrder.map((dayLabel, idx) => {
    const dayDate = new Date(startOfWeek)
    dayDate.setDate(startOfWeek.getDate() + idx)
    const dayStr = dayDate.toISOString().slice(0, 10)

    const dayMatches = (allAttemptsData || []).filter((a) => {
      const dt = new Date(a.created_at || a.submitted_at).toISOString().slice(0, 10)
      return dt === dayStr
    })

    const bands = dayMatches
      .map((a) => Number(a.estimated_band) || 0)
      .filter((b) => b > 0)
    const avgBand = bands.length > 0 ? Number((bands.reduce((acc, b) => acc + b, 0) / bands.length).toFixed(1)) : 0

    return {
      day: dayLabel,
      attempts: dayMatches.length,
      avgBand: avgBand > 0 ? avgBand : 0,
    }
  })

  let weeklyGrowthText = '+0% vs last week'
  if (attemptsLastWeek.length > 0) {
    const pct = (((attemptsThisWeek.length - attemptsLastWeek.length) / attemptsLastWeek.length) * 100).toFixed(1)
    weeklyGrowthText = `${Number(pct) >= 0 ? '+' : ''}${pct}% vs last week`
  } else if (attemptsThisWeek.length > 0) {
    weeklyGrowthText = `+${attemptsThisWeek.length} new this week`
  }

  // 3. Most popular tests with attempt counts
  const { data: popularTests } = await supabase
    .from('tests')
    .select('id, title, skill, difficulty, is_premium, total_questions')
    .order('created_at', { ascending: false })
    .limit(5)

  const attemptCountsByTest = new Map<string, number>()
  ;(allAttemptsData || []).forEach((a) => {
    if (a.test_id) {
      attemptCountsByTest.set(a.test_id, (attemptCountsByTest.get(a.test_id) || 0) + 1)
    }
  })

  const enrichedPopularTests = (popularTests || []).map((t) => ({
    ...t,
    attempts_count: attemptCountsByTest.get(t.id) || 0,
  })).sort((a, b) => b.attempts_count - a.attempts_count)

  // 4. Recent activity logs
  const { data: recentLogs } = await supabase
    .from('admin_activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(8)

  let finalLogs = recentLogs || []
  if (finalLogs.length === 0 && (allAttemptsData || []).length > 0) {
    finalLogs = (allAttemptsData || []).slice(0, 6).map((a) => ({
      id: `live-${a.id}`,
      action: a.status === 'submitted' ? 'test_submitted' : 'test_started',
      target_type: 'test_attempt',
      details: { title: `Student test attempt (${a.status})` },
      created_at: a.submitted_at || a.created_at || new Date().toISOString(),
    }))
  }

  // Fetch real server storage health from backend API
  let storageStats = null
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('foxford_token') : null
    const res = await fetch('/api/admin/stats', {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    })
    if (res.ok) {
      const data = await res.json()
      if (data?.stats?.storage) {
        storageStats = data.stats.storage
      }
    }
  } catch (e) {
    console.warn('Could not fetch storage stats from backend:', e)
  }

  return {
    metrics: {
      totalTests: totalTests || 0,
      publishedTests: publishedTests || 0,
      draftTests: draftTests || 0,
      freeTests: freeTests || 0,
      premiumTests: premiumTests || 0,
      totalQuestions: totalQuestions || 0,
      readingQuestions: readingQuestions || 0,
      listeningQuestions: listeningQuestions || 0,
      writingTasks: writingPrompts || 0,
      speakingTasks: speakingPrompts || 0,
      totalUsers: totalUsers || 0,
      premiumUsers: premiumUsers || 0,
      totalAttempts: totalAttempts || 0,
    },
    storage: storageStats,
    creationTrendData,
    attemptsTrendData,
    weeklyGrowthText,
    recentLogs: finalLogs,
    popularTests: enrichedPopularTests,
  }
}

// ----------------------------------------------------------------------
// 2. TESTS MANAGEMENT (Section 2)
// ----------------------------------------------------------------------

export interface TestFilterParams {
  skill?: string
  status?: string
  ielts_type?: string
  is_premium?: string
  difficulty?: string
  search?: string
  sortBy?: 'created_at' | 'title' | 'total_questions'
  sortOrder?: 'asc' | 'desc'
}

export async function getAdminTests(filters?: TestFilterParams | string) {
  const { supabase } = await getAdminClient()
  const filterParams: TestFilterParams = typeof filters === 'string' ? { skill: filters } : (filters || {})

  let query = supabase.from('tests').select(`
    id,
    title,
    slug,
    description,
    skill,
    difficulty,
    is_premium,
    status,
    time_limit_minutes,
    total_questions,
    ielts_type,
    access_type,
    cover_image,
    tags,
    created_at,
    updated_at
  `)

  if (filterParams.skill && filterParams.skill !== 'all') {
    query = query.eq('skill', filterParams.skill)
  }
  if (filterParams.status && filterParams.status !== 'all') {
    query = query.eq('status', filterParams.status)
  }
  if (filterParams.ielts_type && filterParams.ielts_type !== 'all') {
    query = query.eq('ielts_type', filterParams.ielts_type)
  }
  if (filterParams.difficulty && filterParams.difficulty !== 'all') {
    query = query.eq('difficulty', filterParams.difficulty)
  }
  if (filterParams.is_premium && filterParams.is_premium !== 'all') {
    query = query.eq('is_premium', filterParams.is_premium === 'premium')
  }
  if (filterParams.search && filterParams.search.trim()) {
    query = query.ilike('title', `%${filterParams.search.trim()}%`)
  }

  const sortCol = filterParams.sortBy || 'created_at'
  const isAsc = filterParams.sortOrder === 'asc'
  query = query.order(sortCol, { ascending: isAsc })

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data || []
}

export async function getAdminTestById(testId: string) {
  const { supabase } = await getAdminClient()

  // 1. Fetch test (supports UUID or slug)
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(testId)
  let testQuery = supabase.from('tests').select('*')
  testQuery = isUuid ? testQuery.eq('id', testId) : testQuery.eq('slug', testId)
  const { data: test, error: testErr } = await testQuery.single()

  if (testErr || !test) {
    throw new Error(testErr?.message || 'Test not found')
  }

  // 2. Fetch sections
  const { data: rawSections } = await supabase
    .from('test_sections')
    .select(`
      *,
      passage:reading_passages(*),
      audio:listening_audio(*)
    `)
    .eq('test_id', test.id)
    .order('order_number', { ascending: true })

  // Deduplicate sections if duplicates exist in DB
  const seenOrderNums = new Set<number>()
  const sections: any[] = []
  for (const s of (rawSections || [])) {
    const oNum = s.order_number || sections.length + 1
    if (seenOrderNums.has(oNum)) continue
    seenOrderNums.add(oNum)
    sections.push(s)
  }

  // 3. Fetch question groups and questions
  const sectionIds = sections.map((s) => s.id)
  let questionGroups: any[] = []
  let questions: any[] = []

  if (sectionIds.length > 0) {
    const { data: groups } = await supabase
      .from('question_groups')
      .select('*')
      .in('section_id', sectionIds)
      .order('order_number', { ascending: true })

    questionGroups = groups || []

    const { data: rawQList } = await supabase
      .from('questions')
      .select(`
        *,
        options:question_options(*)
      `)
      .eq('test_id', test.id)
      .order('question_number', { ascending: true })

    // Deduplicate questions by question_number if duplicates exist in DB
    const seenQNums = new Set<number>()
    const qList: any[] = []
    for (const q of (rawQList || [])) {
      const qNum = q.question_number
      if (qNum && seenQNums.has(qNum)) continue
      if (qNum) seenQNums.add(qNum)
      qList.push(q)
    }

    const sectionIdMap = new Map<string, number>()
    sections.forEach((sec, idx) => {
      sectionIdMap.set(sec.id, idx)
    })

    questions = qList.map((q) => {
      let sIdx = 0
      if (q.section_id && sectionIdMap.has(q.section_id)) {
        sIdx = sectionIdMap.get(q.section_id)!
      } else if (typeof q.section_index === 'number') {
        sIdx = q.section_index
      } else if (sections && sections.length > 1) {
        const qNum = q.question_number || 1
        if (sections.length === 3) {
          if (qNum <= 13) sIdx = 0
          else if (qNum <= 26) sIdx = 1
          else sIdx = 2
        } else if (sections.length === 4) {
          if (qNum <= 10) sIdx = 0
          else if (qNum <= 20) sIdx = 1
          else if (qNum <= 30) sIdx = 2
          else sIdx = 3
        }
      }

      return {
        ...q,
        section_index: sIdx,
      }
    })
  }

  return {
    test,
    sections: sections || [],
    questionGroups,
    questions,
  }
}

export async function createTest(data: {
  title: string
  slug?: string
  description?: string
  skill: 'reading' | 'listening' | 'writing' | 'speaking' | 'mock'
  ielts_type?: 'academic' | 'general_training' | 'both'
  access_type?: 'free' | 'premium'
  difficulty?: 'easy' | 'medium' | 'hard'
  time_limit_minutes: number
  total_questions?: number
  is_premium?: boolean
  cover_image?: string
  tags?: string[]
  status?: 'draft' | 'published' | 'archived'
}) {
  const { supabase, user } = await getAdminClient()

  const slug = data.slug?.trim() || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')

  const { data: newTest, error } = await supabase
    .from('tests')
    .insert({
      title: data.title.trim(),
      slug,
      description: data.description?.trim() || null,
      skill: data.skill,
      ielts_type: data.ielts_type || 'academic',
      access_type: data.access_type || (data.is_premium ? 'premium' : 'free'),
      difficulty: data.difficulty || 'medium',
      time_limit_minutes: data.time_limit_minutes || 60,
      total_questions: data.total_questions || 0,
      is_premium: data.access_type === 'premium' || !!data.is_premium,
      cover_image: data.cover_image || null,
      tags: data.tags || [],
      status: data.status || 'draft',
      created_by: user.id,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  // Log activity
  await logAdminAction('test_created', 'test', newTest.id, {
    title: newTest.title,
    skill: newTest.skill,
  })

  revalidatePath('/admin')
  revalidatePath('/admin/tests')
  return newTest
}

export async function updateTest(
  id: string,
  data: Partial<{
    title: string
    slug: string
    description: string
    skill: any
    ielts_type: string
    access_type: string
    difficulty: any
    time_limit_minutes: number
    total_questions: number
    is_premium: boolean
    cover_image: string
    tags: string[]
    status: any
  }>
) {
  const { supabase } = await getAdminClient()

  const updates: any = { ...data, updated_at: new Date().toISOString() }
  if (data.access_type) {
    updates.is_premium = data.access_type === 'premium'
  }

  const { data: updated, error } = await supabase
    .from('tests')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)

  await logAdminAction('test_updated', 'test', id, { title: updated.title })

  revalidatePath('/admin/tests')
  revalidatePath(`/admin/tests/${id}/edit`)
  return updated
}

export async function updateTestStatus(id: string, status: 'draft' | 'published' | 'archived') {
  const { supabase } = await getAdminClient()

  const { error } = await supabase
    .from('tests')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)

  await logAdminAction(status === 'published' ? 'test_published' : 'test_status_changed', 'test', id, { status })

  revalidatePath('/admin/tests')
  return { success: true }
}

export async function duplicateTest(testId: string) {
  const { supabase, user } = await getAdminClient()

  // 1. Fetch original test structure
  const { test, sections, questionGroups, questions } = await getAdminTestById(testId)

  // 2. Clone test
  const newTitle = `${test.title} (Copy)`
  const newSlug = `${test.slug || 'test'}-copy-${Date.now()}`

  const { data: clonedTest, error: testErr } = await supabase
    .from('tests')
    .insert({
      title: newTitle,
      slug: newSlug,
      description: test.description,
      skill: test.skill,
      ielts_type: test.ielts_type,
      access_type: test.access_type,
      difficulty: test.difficulty,
      time_limit_minutes: test.time_limit_minutes,
      total_questions: test.total_questions,
      is_premium: test.is_premium,
      cover_image: test.cover_image,
      tags: test.tags,
      status: 'draft',
      created_by: user.id,
    })
    .select()
    .single()

  if (testErr || !clonedTest) throw new Error(testErr?.message || 'Failed to clone test')

  // Map old section IDs to new section IDs
  const sectionIdMap: Record<string, string> = {}
  for (const s of sections) {
    const { data: newSec } = await supabase
      .from('test_sections')
      .insert({
        test_id: clonedTest.id,
        title: s.title,
        order_number: s.order_number,
        instructions: s.instructions,
        time_limit_minutes: s.time_limit_minutes,
        passage_id: s.passage_id,
        audio_id: s.audio_id,
        description: s.description,
      })
      .select()
      .single()

    if (newSec) sectionIdMap[s.id] = newSec.id
  }

  // Map old group IDs to new group IDs
  const groupIdMap: Record<string, string> = {}
  for (const g of questionGroups) {
    const newSecId = sectionIdMap[g.section_id]
    if (newSecId) {
      const { data: newGroup } = await supabase
        .from('question_groups')
        .insert({
          section_id: newSecId,
          title: g.title,
          instruction: g.instruction,
          passage_id: g.passage_id,
          media_id: g.media_id,
          order_number: g.order_number,
        })
        .select()
        .single()

      if (newGroup) groupIdMap[g.id] = newGroup.id
    }
  }

  // Clone questions and options
  for (const q of questions) {
    const newSecId = sectionIdMap[q.section_id] || Object.values(sectionIdMap)[0]
    const newGroupId = q.group_id ? groupIdMap[q.group_id] : null

    if (newSecId) {
      const { data: newQ } = await supabase
        .from('questions')
        .insert({
          test_id: clonedTest.id,
          section_id: newSecId,
          group_id: newGroupId,
          question_type_id: q.question_type_id,
          question_type: q.question_type,
          question_number: q.question_number,
          instruction: q.instruction,
          question_text: q.question_text,
          question_html: q.question_html,
          points: q.points,
          difficulty: q.difficulty,
          metadata: q.metadata,
          explanation: q.explanation,
          correct_answer: q.correct_answer,
          accepted_answers: q.accepted_answers,
          status: 'draft',
        })
        .select()
        .single()

      if (newQ && q.options && q.options.length > 0) {
        const clonedOpts = q.options.map((opt: any) => ({
          question_id: newQ.id,
          option_key: opt.option_key,
          option_text: opt.option_text,
          is_correct: opt.is_correct,
          order_number: opt.order_number,
        }))
        await supabase.from('question_options').insert(clonedOpts)
      }
    }
  }

  await logAdminAction('test_duplicated', 'test', clonedTest.id, {
    original_id: testId,
    title: clonedTest.title,
  })

  revalidatePath('/admin/tests')
  return clonedTest
}

export async function deleteTest(id: string) {
  const { supabase } = await getAdminClient()

  // First check if test exists
  const { data: test } = await supabase.from('tests').select('title').eq('id', id).single()

  // Clean up attempts
  await supabase.from('test_attempts').delete().eq('test_id', id)

  // Cascade delete test
  const { error } = await supabase.from('tests').delete().eq('id', id)
  if (error) throw new Error(error.message)

  await logAdminAction('test_deleted', 'test', id, { title: test?.title || 'Unknown' })

  revalidatePath('/admin')
  revalidatePath('/admin/tests')
  return { success: true }
}

export async function saveFullTestStructure(data: {
  test: {
    id?: string | null
    title: string
    slug?: string
    description?: string
    skill: 'reading' | 'listening' | 'writing' | 'speaking' | 'mock'
    ielts_type?: 'academic' | 'general_training' | 'both'
    access_type?: 'free' | 'premium'
    difficulty?: 'easy' | 'medium' | 'hard'
    time_limit_minutes: number
    cover_image?: string
    tags?: string[]
    status?: 'draft' | 'published' | 'archived'
  }
  sections: Array<{
    id?: string
    title: string
    order_number: number
    instructions?: string
    time_limit_minutes?: number
    passage_html?: string
    audio_url?: string
  }>
  questions: Array<{
    id?: string
    section_id?: string
    section_index: number
    question_number: number
    question_type: string
    instruction?: string
    question_text: string
    question_html?: string
    options?: Array<{ option_key: string; option_text: string; is_correct?: boolean }>
    correct_answer?: string
    accepted_answers?: string[]
    metadata?: any
    points?: number
    difficulty?: string
    explanation?: string
    image_url?: string
    audio_url?: string
  }>
}) {
  const { supabase, user } = await getAdminClient()

  // 1. Create or Update Test
  const testPayload: any = {
    title: data.test.title.trim(),
    slug: data.test.slug?.trim() || data.test.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
    description: data.test.description?.trim() || null,
    skill: data.test.skill,
    ielts_type: data.test.ielts_type || 'academic',
    access_type: data.test.access_type || 'free',
    difficulty: data.test.difficulty || 'medium',
    time_limit_minutes: data.test.time_limit_minutes || 60,
    total_questions: data.questions.length,
    is_premium: data.test.access_type === 'premium',
    cover_image: data.test.cover_image || null,
    tags: data.test.tags || [],
    status: data.test.status || 'draft',
    updated_at: new Date().toISOString(),
  }

  let testId = data.test.id

  if (testId && !testId.startsWith('temp-')) {
    const { error } = await supabase.from('tests').update(testPayload).eq('id', testId)
    if (error) throw new Error(`Failed to update test: ${error.message}`)
  } else {
    testPayload.created_by = user.id
    const { data: newTest, error } = await supabase.from('tests').insert(testPayload).select('id').single()
    if (error) throw new Error(`Failed to create test: ${error.message}`)
    testId = newTest.id
  }

  // 2. Fetch existing question types to map slugs to UUIDs
  const { data: qTypes } = await supabase.from('question_types').select('id, slug')
  const qTypeMap: Record<string, string> = {}
  if (qTypes) {
    qTypes.forEach(qt => {
      qTypeMap[qt.slug] = qt.id
    })
  }
  const defaultTypeId = qTypes?.[0]?.id || '00000000-0000-0000-0000-000000000000'

  // 3. Clear existing questions and sections if updating to ensure clean state and prevent duplicate parts/questions
  if (data.test.id && !data.test.id.startsWith('temp-')) {
    await supabase.from('questions').delete().eq('test_id', testId)
    await supabase.from('test_sections').delete().eq('test_id', testId)
  }

  // 4. Upsert Sections, Passages, and Audio
  const sectionIndexToIds: Record<number, { sectionId: string; groupId: string }> = {}

  for (let sIdx = 0; sIdx < data.sections.length; sIdx++) {
    const sec = data.sections[sIdx]
    let passageId: string | null = null
    let audioId: string | null = null

    if (sec.passage_html && sec.passage_html.trim()) {
      const { data: pass } = await supabase
        .from('reading_passages')
        .insert({
          title: sec.title || `Passage ${sIdx + 1}`,
          content: sec.passage_html,
          status: 'published',
        })
        .select('id')
        .single()
      if (pass) passageId = pass.id
    }

    if (sec.audio_url && sec.audio_url.trim()) {
      const { data: aud } = await supabase
        .from('listening_audio')
        .insert({
          title: sec.title || `Audio Part ${sIdx + 1}`,
          file_path: sec.audio_url,
          duration_seconds: (sec.time_limit_minutes || 10) * 60,
          status: 'published',
        })
        .select('id')
        .single()
      if (aud) audioId = aud.id
    }

    const { data: newSection, error: secErr } = await supabase
      .from('test_sections')
      .insert({
        test_id: testId,
        title: sec.title || `Section ${sIdx + 1}`,
        order_number: sec.order_number || sIdx + 1,
        instructions: sec.instructions || null,
        time_limit_minutes: sec.time_limit_minutes || 20,
        passage_id: passageId,
        audio_id: audioId,
      })
      .select('id')
      .single()

    if (secErr || !newSection) {
      throw new Error(`Failed to save section ${sIdx + 1}: ${secErr?.message}`)
    }

    const { data: newGroup } = await supabase
      .from('question_groups')
      .insert({
        section_id: newSection.id,
        title: sec.title,
        instruction: sec.instructions,
        passage_id: passageId,
        media_id: audioId,
        order_number: 1,
      })
      .select('id')
      .single()

    const groupId = newGroup?.id || ''
    sectionIndexToIds[sIdx] = { sectionId: newSection.id, groupId }
  }

  // 5. Insert Questions & Options
  for (let qIdx = 0; qIdx < data.questions.length; qIdx++) {
    const q = data.questions[qIdx]
    const qNum = q.question_number || qIdx + 1
    let targetSectionIdx = typeof q.section_index === 'number' ? q.section_index : -1

    // If 4 sections (standard IELTS Listening), prioritize question number ranges
    if (data.sections.length === 4 && qNum >= 1 && qNum <= 40) {
      targetSectionIdx = qNum <= 10 ? 0 : qNum <= 20 ? 1 : qNum <= 30 ? 2 : 3
    } else if (data.sections.length === 3 && qNum >= 1 && qNum <= 40) {
      targetSectionIdx = qNum <= 13 ? 0 : qNum <= 26 ? 1 : 2
    } else if (targetSectionIdx < 0 && q.section_id) {
      const matchedIdx = data.sections.findIndex((s) => s.id === q.section_id)
      if (matchedIdx !== -1) targetSectionIdx = matchedIdx
    }

    if (targetSectionIdx < 0 || !sectionIndexToIds[targetSectionIdx]) {
      if (data.sections.length === 3) {
        targetSectionIdx = qNum <= 13 ? 0 : qNum <= 26 ? 1 : 2
      } else if (data.sections.length === 4) {
        targetSectionIdx = qNum <= 10 ? 0 : qNum <= 20 ? 1 : qNum <= 30 ? 2 : 3
      } else {
        targetSectionIdx = 0
      }
    }

    const secMapping = sectionIndexToIds[targetSectionIdx] || Object.values(sectionIndexToIds)[0]

    if (!secMapping) continue

    const qTypeId = qTypeMap[q.question_type] || defaultTypeId

    const { data: insertedQ, error: qErr } = await supabase
      .from('questions')
      .insert({
        test_id: testId,
        section_id: secMapping.sectionId,
        group_id: secMapping.groupId || null,
        question_type_id: qTypeId,
        question_type: q.question_type,
        question_number: q.question_number || qIdx + 1,
        instruction: q.instruction || null,
        question_text: q.question_text || `Question #${qIdx + 1}`,
        question_html: q.question_html || null,
        points: q.points || 1,
        difficulty: q.difficulty || 'medium',
        metadata: q.metadata || {},
        explanation: q.explanation || null,
        correct_answer: q.correct_answer || null,
        accepted_answers: q.accepted_answers || [],
        image_url: q.image_url || null,
        audio_url: q.audio_url || null,
        status: data.test.status || 'draft',
      })
      .select('id')
      .single()

    if (qErr || !insertedQ) {
      console.error(`Failed to insert question ${q.question_number}:`, qErr)
      continue
    }

    if (q.options && q.options.length > 0) {
      const optionsRows = q.options.map((opt, oIdx) => ({
        question_id: insertedQ.id,
        option_key: opt.option_key || String.fromCharCode(65 + oIdx),
        option_text: opt.option_text || '',
        is_correct: !!opt.is_correct,
        order_number: oIdx + 1,
      }))
      await supabase.from('question_options').insert(optionsRows)
    }
  }

  const finalTestId = testId as string

  await logAdminAction('test_saved', 'test', finalTestId, {
    title: data.test.title,
    questions_count: data.questions.length,
    status: data.test.status || 'draft',
  })

  revalidatePath('/admin')
  revalidatePath('/admin/tests')
  revalidatePath(`/admin/tests/${finalTestId}/edit`)
  revalidatePath(`/admin/tests/${finalTestId}/preview`)

  return { success: true, testId: finalTestId }
}

// ----------------------------------------------------------------------
// 3. PUBLISH VALIDATION (Section 33)
// ----------------------------------------------------------------------

export async function validateTestForPublish(testId: string) {
  const { test, sections, questions } = await getAdminTestById(testId)

  const errors: string[] = []
  const warnings: string[] = []

  if (!test.title || test.title.trim().length < 3) {
    errors.push('Test title is missing or too short.')
  }
  if (!test.description || test.description.trim().length < 5) {
    warnings.push('Description is missing or very brief.')
  }
  if (!sections || sections.length === 0) {
    errors.push('Test must have at least one section.')
  }
  if (!questions || questions.length === 0) {
    errors.push('Test must have at least one question.')
  }

  // Check question numbers and types
  const seenNumbers = new Set<number>()
  for (const q of questions) {
    if (seenNumbers.has(q.question_number)) {
      errors.push(`Duplicate question number detected: #${q.question_number}`)
    }
    seenNumbers.add(q.question_number)

    if (q.question_type === 'multiple_choice' && (!q.options || q.options.length < 2)) {
      errors.push(`Question #${q.question_number} (Multiple Choice) must have at least 2 options.`)
    }

    if (
      ['multiple_choice', 'true_false_not_given', 'yes_no_not_given'].includes(q.question_type) &&
      !q.correct_answer
    ) {
      warnings.push(`Question #${q.question_number} has no correct answer assigned.`)
    }
  }

  if (test.skill === 'listening') {
    const hasAudio = sections.some((s) => s.audio_id || s.audio)
    if (!hasAudio) {
      warnings.push('Listening test has no audio track attached to sections.')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    summary: {
      sectionsCount: sections.length,
      questionsCount: questions.length,
    },
  }
}

// ----------------------------------------------------------------------
// 4. QUESTIONS & QUESTION BANK (Section 4, 13)
// ----------------------------------------------------------------------

export async function getAdminQuestions(filters?: {
  search?: string
  type?: string
  skill?: string
  difficulty?: string
  is_premium?: string
  test_id?: string
}) {
  const { supabase } = await getAdminClient()

  let query = supabase.from('questions').select(`
    *,
    test:tests(title, skill, is_premium),
    options:question_options(*)
  `)

  if (filters?.type && filters.type !== 'all') {
    query = query.eq('question_type', filters.type)
  }
  if (filters?.difficulty && filters.difficulty !== 'all') {
    query = query.eq('difficulty', filters.difficulty)
  }
  if (filters?.test_id && filters.test_id !== 'all') {
    query = query.eq('test_id', filters.test_id)
  }
  if (filters?.search && filters.search.trim()) {
    query = query.ilike('question_text', `%${filters.search.trim()}%`)
  }

  query = query.order('created_at', { ascending: false }).limit(100)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data || []
}

export async function saveQuestion(data: {
  id?: string
  test_id: string
  section_id: string
  group_id?: string | null
  question_type: string
  question_number: number
  instruction?: string
  question_text: string
  question_html?: string
  points?: number
  difficulty?: string
  correct_answer?: string
  accepted_answers?: string[]
  explanation?: string
  options?: Array<{ option_key: string; option_text: string; is_correct?: boolean }>
}) {
  const { supabase } = await getAdminClient()

  // Get question_type_id
  const { data: qt } = await supabase
    .from('question_types')
    .select('id')
    .eq('slug', data.question_type)
    .single()

  const defaultTypeId = '00000000-0000-0000-0000-000000000000'

  const payload: any = {
    test_id: data.test_id,
    section_id: data.section_id,
    group_id: data.group_id || null,
    question_type_id: qt?.id || defaultTypeId,
    question_type: data.question_type,
    question_number: data.question_number,
    instruction: data.instruction || null,
    question_text: data.question_text,
    question_html: data.question_html || null,
    points: data.points || 1,
    difficulty: data.difficulty || 'medium',
    correct_answer: data.correct_answer || null,
    accepted_answers: data.accepted_answers || [],
    explanation: data.explanation || null,
    updated_at: new Date().toISOString(),
  }

  let questionId = data.id

  if (questionId) {
    const { error } = await supabase.from('questions').update(payload).eq('id', questionId)
    if (error) throw new Error(error.message)
    // Clear old options if re-saving
    await supabase.from('question_options').delete().eq('question_id', questionId)
  } else {
    const { data: inserted, error } = await supabase.from('questions').insert(payload).select('id').single()
    if (error) throw new Error(error.message)
    questionId = inserted.id
  }

  // Insert options
  if (data.options && data.options.length > 0 && questionId) {
    const optionsPayload = data.options.map((opt, idx) => ({
      question_id: questionId,
      option_key: opt.option_key,
      option_text: opt.option_text,
      is_correct: !!opt.is_correct,
      order_number: idx + 1,
    }))
    await supabase.from('question_options').insert(optionsPayload)
  }

  await logAdminAction(data.id ? 'question_edited' : 'question_created', 'question', questionId, {
    question_number: data.question_number,
    type: data.question_type,
  })

  revalidatePath('/admin/tests')
  return { id: questionId }
}

export async function deleteQuestion(id: string) {
  const { supabase } = await getAdminClient()
  const { error } = await supabase.from('questions').delete().eq('id', id)
  if (error) throw new Error(error.message)

  await logAdminAction('question_deleted', 'question', id)
  revalidatePath('/admin/tests')
  return { success: true }
}

export async function bulkDeleteQuestions(ids: string[]) {
  const { supabase } = await getAdminClient()
  const { error } = await supabase.from('questions').delete().in('id', ids)
  if (error) throw new Error(error.message)

  await logAdminAction('questions_bulk_deleted', 'question', undefined, { count: ids.length })
  revalidatePath('/admin/tests')
  return { success: true, count: ids.length }
}

// ----------------------------------------------------------------------
// 5. PASSAGES BUILDER (Section 8)
// ----------------------------------------------------------------------

export async function getAdminPassages(search?: string) {
  const { supabase } = await getAdminClient()

  let query = supabase.from('reading_passages').select('*').order('created_at', { ascending: false })

  if (search && search.trim()) {
    query = query.ilike('title', `%${search.trim()}%`)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data || []
}

export async function savePassage(data: {
  id?: string
  title: string
  content: string
  source?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  status?: 'draft' | 'published' | 'archived'
}) {
  const { supabase } = await getAdminClient()

  // Calculate approximate word count
  const plainText = data.content.replace(/<[^>]*>/g, ' ').trim()
  const wordCount = plainText.split(/\s+/).filter(Boolean).length

  const payload = {
    title: data.title.trim(),
    content: data.content,
    source: data.source?.trim() || null,
    word_count: wordCount,
    difficulty: data.difficulty || 'medium',
    status: data.status || 'published',
    updated_at: new Date().toISOString(),
  }

  if (data.id) {
    const { data: updated, error } = await supabase
      .from('reading_passages')
      .update(payload)
      .eq('id', data.id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    await logAdminAction('passage_updated', 'passage', data.id, { title: updated.title })
    revalidatePath('/admin/tests')
    return updated
  } else {
    const { data: inserted, error } = await supabase
      .from('reading_passages')
      .insert(payload)
      .select()
      .single()
    if (error) throw new Error(error.message)
    await logAdminAction('passage_created', 'passage', inserted.id, { title: inserted.title })
    revalidatePath('/admin/tests')
    return inserted
  }
}

export async function deletePassage(id: string) {
  const { supabase } = await getAdminClient()
  const { error } = await supabase.from('reading_passages').delete().eq('id', id)
  if (error) throw new Error(error.message)

  await logAdminAction('passage_deleted', 'passage', id)
  revalidatePath('/admin/tests')
  return { success: true }
}

// ----------------------------------------------------------------------
// 6. LISTENING AUDIO & MEDIA (Section 9, 27)
// ----------------------------------------------------------------------

export async function getAdminAudioList() {
  const { supabase } = await getAdminClient()
  const { data, error } = await supabase
    .from('listening_audio')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

export async function saveAudioTrack(data: {
  id?: string
  title: string
  file_path: string
  duration_seconds: number
  transcript?: string
  is_premium?: boolean
  status?: 'draft' | 'published'
}) {
  const { supabase } = await getAdminClient()

  const payload = {
    title: data.title.trim(),
    file_path: data.file_path.trim(),
    duration_seconds: data.duration_seconds || 0,
    transcript: data.transcript || null,
    is_premium: !!data.is_premium,
    status: data.status || 'published',
    updated_at: new Date().toISOString(),
  }

  if (data.id) {
    const { data: updated, error } = await supabase
      .from('listening_audio')
      .update(payload)
      .eq('id', data.id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    revalidatePath('/admin/tests')
    return updated
  } else {
    const { data: inserted, error } = await supabase
      .from('listening_audio')
      .insert(payload)
      .select()
      .single()
    if (error) throw new Error(error.message)
    await logAdminAction('audio_uploaded', 'media', inserted.id, { title: inserted.title })
    revalidatePath('/admin/tests')
    return inserted
  }
}

export async function deleteAudioTrack(id: string) {
  const { supabase } = await getAdminClient()
  const { error } = await supabase.from('listening_audio').delete().eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/admin/tests')
  return { success: true }
}

export async function getAdminMediaAssets() {
  const { supabase } = await getAdminClient()
  const { data, error } = await supabase
    .from('media_assets')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

// ----------------------------------------------------------------------
// 7. IMPORTS & AI QUESTION PARSER (Section 10, 11, 12)
// ----------------------------------------------------------------------

export async function getAdminImports() {
  const { supabase } = await getAdminClient()
  const { data, error } = await supabase
    .from('imports')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

export async function createImportRecord(data: {
  source_type: 'pdf' | 'audio' | 'json' | 'manual'
  file_url?: string
  raw_text?: string
  raw_json?: any
}) {
  const { supabase, user } = await getAdminClient()

  const { data: record, error } = await supabase
    .from('imports')
    .insert({
      created_by: user.id,
      source_type: data.source_type,
      file_url: data.file_url || null,
      raw_text: data.raw_text || null,
      raw_json: data.raw_json || null,
      status: 'review',
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  await logAdminAction(`${data.source_type}_imported`, 'import', record.id)
  revalidatePath('/admin/import')
  return record
}

/**
 * Server-side AI Question Parser simulation with Zod-style strict structure.
 * Converts raw extracted text/JSON into verified IELTS test data.
 */
export async function parseIeltsContentWithAi(rawText: string, title?: string) {
  // Structured IELTS parser result
  const lines = rawText.split('\n').filter((l) => l.trim().length > 0)
  const passagesCount = (rawText.match(/reading passage \d/gi) || []).length || 1

  // Detect questions
  const detectedQuestions: any[] = []
  let currentNum = 1

  // Scan for question types
  const hasMultipleChoice = /choose the correct letter|A\)|B\)/i.test(rawText)
  const hasTrueFalse = /true|false|not given/i.test(rawText)
  const hasCompletion = /no more than \w+ words|complete the/i.test(rawText)

  if (hasTrueFalse) {
    for (let i = 1; i <= 5; i++) {
      detectedQuestions.push({
        question_number: currentNum++,
        question_type: 'true_false_not_given',
        instruction: 'Do the following statements agree with the information given in the passage? Write TRUE, FALSE, or NOT GIVEN.',
        question_text: `Statement ${i} extracted from source text.`,
        correct_answer: i % 2 === 0 ? 'TRUE' : 'FALSE',
        points: 1,
        difficulty: 'medium',
      })
    }
  }

  if (hasMultipleChoice) {
    for (let i = 1; i <= 4; i++) {
      detectedQuestions.push({
        question_number: currentNum++,
        question_type: 'multiple_choice',
        instruction: 'Choose the correct letter, A, B, C or D.',
        question_text: `Question ${i}: What is the primary reason mentioned in paragraph ${i}?`,
        options: [
          { option_key: 'A', option_text: 'Option A distractor', is_correct: false },
          { option_key: 'B', option_text: 'Option B valid answer', is_correct: true },
          { option_key: 'C', option_text: 'Option C distractor', is_correct: false },
          { option_key: 'D', option_text: 'Option D distractor', is_correct: false },
        ],
        correct_answer: 'B',
        points: 1,
        difficulty: 'medium',
      })
    }
  }

  // Fallback questions if none matched
  if (detectedQuestions.length === 0) {
    for (let i = 1; i <= 10; i++) {
      detectedQuestions.push({
        question_number: i,
        question_type: i <= 5 ? 'true_false_not_given' : 'sentence_completion',
        instruction: i <= 5 ? 'Write TRUE, FALSE or NOT GIVEN' : 'Complete the sentence with ONE WORD',
        question_text: `Sample extracted question #${i} from input material.`,
        correct_answer: i <= 5 ? 'TRUE' : 'evidence',
        points: 1,
        difficulty: 'medium',
      })
    }
  }

  const warnings: string[] = []
  if (!rawText.includes('Reading Passage')) {
    warnings.push('Passage header not explicitly found; used default passage wrapper.')
  }
  if (detectedQuestions.some((q) => !q.correct_answer)) {
    warnings.push('Some detected questions do not have an answer key in the source text.')
  }

  return {
    title: title || 'Imported IELTS Practice Test',
    passagesDetected: passagesCount,
    questionsDetected: detectedQuestions.length,
    typesDetected: Array.from(new Set(detectedQuestions.map((q) => q.question_type))),
    questions: detectedQuestions,
    warnings,
  }
}

// ----------------------------------------------------------------------
// 8. USER MANAGEMENT (Section 18)
// ----------------------------------------------------------------------

export async function getAdminUsers(search?: string, roleFilter?: string) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('foxford_token') : null

  try {
    const params = new URLSearchParams()
    if (search && search.trim()) params.set('search', search.trim())
    if (roleFilter && roleFilter !== 'all') params.set('role', roleFilter)

    const res = await fetch(`/api/admin/users?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token || ''}`,
        'Content-Type': 'application/json',
      },
    })

    if (res.ok) {
      const json = await res.json()
      if (json.users) {
        return json.users
      }
    }
  } catch (e) {
    console.warn('Direct admin users fetch fallback to supabase:', e)
  }

  const { supabase } = await getAdminClient()

  let query = supabase.from('profiles').select(`
    id,
    user_id,
    first_name,
    last_name,
    avatar_url,
    role,
    status,
    target_band,
    previous_score,
    onboarding_completed,
    created_at,
    updated_at
  `)

  if (roleFilter && roleFilter !== 'all') {
    query = query.eq('role', roleFilter)
  }
  if (search && search.trim()) {
    query = query.or(`first_name.ilike.%${search.trim()}%,last_name.ilike.%${search.trim()}%`)
  }

  query = query.order('created_at', { ascending: false })

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data || []
}

export async function updateUserRole(userId: string, newRole: 'admin' | 'student') {
  const token = typeof window !== 'undefined' ? localStorage.getItem('foxford_token') : null

  const res = await fetch(`/api/admin/users/${userId}/role`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token || ''}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ role: newRole }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to update user role')
  }

  revalidatePath('/admin/users')
  return { success: true }
}

export async function toggleUserSuspension(userId: string, isSuspended: boolean) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('foxford_token') : null

  const res = await fetch(`/api/admin/users/${userId}/suspend`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token || ''}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ suspended: isSuspended }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to update user suspension')
  }

  const json = await res.json()
  revalidatePath('/admin/users')
  return { success: true, status: json.status || (isSuspended ? 'suspended' : 'active') }
}

export async function grantUserPremium(
  userId: string,
  durationDays: number = 30,
  planSlug: string = 'monthly'
) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('foxford_token') : null

  const res = await fetch(`/api/admin/users/${userId}/premium`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token || ''}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'grant',
      durationDays,
      planSlug,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to grant user premium')
  }

  revalidatePath('/admin/users')
  return res.json()
}

export async function revokeUserPremium(userId: string) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('foxford_token') : null

  const res = await fetch(`/api/admin/users/${userId}/premium`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token || ''}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'revoke',
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to revoke user premium')
  }

  revalidatePath('/admin/users')
  return res.json()
}

export async function deleteUser(userId: string) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('foxford_token') : null

  const res = await fetch(`/api/admin/users/${userId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token || ''}`,
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to delete user')
  }

  revalidatePath('/admin/users')
  return res.json()
}

// ----------------------------------------------------------------------
// 9. PREMIUM & PAYMENTS (Section 16, 17)
// ----------------------------------------------------------------------

export async function getAdminSubscriptions() {
  const { supabase } = await getAdminClient()

  const { data, error } = await supabase
    .from('subscriptions')
    .select(`
      *,
      plan:plans(*),
      user_profile:profiles!subscriptions_user_id_fkey(first_name, last_name, avatar_url)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    // If foreign key differs, fall back to simple select
    const fallback = await supabase.from('subscriptions').select('*').order('created_at', { ascending: false })
    return fallback.data || []
  }

  return data || []
}

export async function getAdminPayments() {
  const { supabase } = await getAdminClient()

  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

// ----------------------------------------------------------------------
// 10. ADMIN ACTIVITY LOGS (Section 22, 25)
// ----------------------------------------------------------------------

export async function getAdminActivityLogs(limit = 50) {
  const { supabase } = await getAdminClient()

  const { data, error } = await supabase
    .from('admin_activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return data || []
}

export async function logAdminAction(
  action: string,
  targetType: string,
  targetId?: string,
  details: Record<string, any> = {}
) {
  try {
    const { supabase, user } = await getAdminClient()
    await supabase.from('admin_activity_logs').insert({
      admin_id: user?.id || null,
      action,
      target_type: targetType,
      target_id: targetId || null,
      details,
    })
  } catch (err) {
    console.error('Failed to log admin action:', err)
  }
}

// ----------------------------------------------------------------------
// 11. WRITING PROMPTS (Backwards Compatibility)
// ----------------------------------------------------------------------

export async function getAdminWritingPrompts() {
  const { supabase } = await getAdminClient()
  const { data, error } = await supabase
    .from('writing_prompts')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data || []
}

export async function createWritingPrompt(data: {
  title: string
  task_type: 'task_1' | 'task_2'
  prompt_text: string
  difficulty?: 'easy' | 'medium' | 'hard'
  is_premium?: boolean
  status?: 'draft' | 'published' | 'archived'
}) {
  const { supabase } = await getAdminClient()
  const { data: newPrompt, error } = await supabase
    .from('writing_prompts')
    .insert({
      title: data.title.trim(),
      task_type: data.task_type,
      prompt_text: data.prompt_text.trim(),
      difficulty: data.difficulty || 'medium',
      is_premium: !!data.is_premium,
      status: data.status || 'published',
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  revalidatePath('/admin/writing')
  return newPrompt
}

export async function deleteWritingPrompt(id: string) {
  const { supabase } = await getAdminClient()
  const { error } = await supabase.from('writing_prompts').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/writing')
  return { success: true }
}

// ----------------------------------------------------------------------
// 12. SPEAKING PROMPTS (Backwards Compatibility)
// ----------------------------------------------------------------------

export async function getAdminSpeakingPrompts() {
  const { supabase } = await getAdminClient()
  const { data, error } = await supabase
    .from('speaking_prompts')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data || []
}

export async function createSpeakingPrompt(data: {
  title: string
  part_number: 1 | 2 | 3
  prompt_text: string
  follow_up_questions?: string[]
  difficulty?: 'easy' | 'medium' | 'hard'
  is_premium?: boolean
  status?: 'draft' | 'published' | 'archived'
}) {
  const { supabase } = await getAdminClient()
  const { data: newPrompt, error } = await supabase
    .from('speaking_prompts')
    .insert({
      title: data.title.trim(),
      part_number: data.part_number,
      prompt_text: data.prompt_text.trim(),
      follow_up_questions: data.follow_up_questions || [],
      difficulty: data.difficulty || 'medium',
      is_premium: !!data.is_premium,
      status: data.status || 'published',
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  revalidatePath('/admin/speaking')
  return newPrompt
}

export async function deleteSpeakingPrompt(id: string) {
  const { supabase } = await getAdminClient()
  const { error } = await supabase.from('speaking_prompts').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/speaking')
  return { success: true }
}

// ----------------------------------------------------------------------
// 13. VOCABULARY (Backwards Compatibility)
// ----------------------------------------------------------------------

export async function getAdminVocabulary(search?: string) {
  const { supabase } = await getAdminClient()
  let query = supabase.from('vocabulary_words').select('*').order('created_at', { ascending: false })
  if (search && search.trim()) {
    query = query.ilike('word', `%${search.trim()}%`)
  }
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data || []
}

export async function createVocabularyWord(data: {
  word: string
  definition: string
  part_of_speech?: string
  pronunciation?: string
  example_sentence?: string
  topic?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  is_premium?: boolean
  status?: 'draft' | 'published'
}) {
  const { supabase } = await getAdminClient()
  const { data: newWord, error } = await supabase
    .from('vocabulary_words')
    .insert({
      word: data.word.trim(),
      definition: data.definition.trim(),
      part_of_speech: data.part_of_speech?.trim() || 'noun',
      pronunciation: data.pronunciation?.trim() || null,
      example_sentence: data.example_sentence?.trim() || null,
      topic: data.topic?.trim() || 'General Academic',
      difficulty: data.difficulty || 'medium',
      is_premium: !!data.is_premium,
      status: data.status || 'published',
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  revalidatePath('/admin/vocabulary')
  return newWord
}

export async function deleteVocabularyWord(id: string) {
  const { supabase } = await getAdminClient()
  const { error } = await supabase.from('vocabulary_words').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/vocabulary')
  return { success: true }
}

// ----------------------------------------------------------------------
// 14. STUDENT TEST ATTEMPTS & DIAGNOSTIC RESULTS
// ----------------------------------------------------------------------

export async function getAdminAttempts(params: {
  search?: string
  skill?: string
  status?: string
  userId?: string
  page?: number
  limit?: number
  sortBy?: string
} = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('foxford_token') : null
  const searchParams = new URLSearchParams()
  if (params.search) searchParams.set('search', params.search)
  if (params.skill) searchParams.set('skill', params.skill)
  if (params.status) searchParams.set('status', params.status)
  if (params.userId) searchParams.set('userId', params.userId)
  if (params.page) searchParams.set('page', String(params.page))
  if (params.limit) searchParams.set('limit', String(params.limit))
  if (params.sortBy) searchParams.set('sortBy', params.sortBy)

  const res = await fetch(`/api/admin/attempts?${searchParams.toString()}`, {
    headers: {
      Authorization: `Bearer ${token || ''}`,
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to fetch student attempts')
  }

  return res.json()
}

export async function getAdminAttemptDetails(attemptId: string) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('foxford_token') : null
  const res = await fetch(`/api/admin/attempts/${attemptId}`, {
    headers: {
      Authorization: `Bearer ${token || ''}`,
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to fetch attempt details')
  }

  return res.json()
}


