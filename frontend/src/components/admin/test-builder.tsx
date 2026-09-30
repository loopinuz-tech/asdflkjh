import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Copy,
  Eye,
  Clock,
  ChevronUp,
  ChevronDown,
  Layers,
  Sparkles,
  HelpCircle,
  FileText,
  FileCode,
  Image as ImageIcon,
  Check,
  X,
  BookOpen,
  Upload,
  Download,
  FolderPlus,
  ClipboardPaste,
  ChevronRight as ChevronRightIcon,
} from 'lucide-react'
import { HtmlEditor } from '@/components/admin/html-editor'
import { QuestionRenderer } from '@/components/tests/question-renderer'
import { saveFullTestStructure, validateTestForPublish } from '@/actions/admin'
import { parseIeltsHtml } from '@/lib/parsers/html-test-parser'
import { cn } from '@/lib/utils'

interface TestBuilderProps {
  initialTest?: any
  initialSections?: any[]
  initialQuestions?: any[]
  isEditMode?: boolean
}

// Complete IELTS Question Types
const QUESTION_TYPES = [
  { value: 'multiple_choice', label: '1. Multiple Choice (Single)', category: 'choice' },
  { value: 'multiple_response', label: '2. Multiple Response (Choose Two/Three)', category: 'choice' },
  { value: 'true_false_not_given', label: '3. True / False / Not Given', category: 'reading' },
  { value: 'yes_no_not_given', label: '4. Yes / No / Not Given', category: 'reading' },
  { value: 'matching_headings', label: '5. Matching Headings (Roman i, ii, iii)', category: 'matching' },
  { value: 'matching_information', label: '6. Matching Information (Paragraphs A–G)', category: 'matching' },
  { value: 'matching_features', label: '7. Matching Features (Names / Dates)', category: 'matching' },
  { value: 'matching_sentence_endings', label: '8. Matching Sentence Endings', category: 'matching' },
  { value: 'sentence_completion', label: '9. Sentence Completion', category: 'completion' },
  { value: 'summary_completion', label: '10. Summary Completion', category: 'completion' },
  { value: 'note_completion', label: '11. Note Completion', category: 'completion' },
  { value: 'table_completion', label: '12. Table Completion', category: 'completion' },
  { value: 'flow_chart_completion', label: '13. Flow-chart Completion', category: 'completion' },
  { value: 'diagram_label_completion', label: '14. Diagram Label Completion', category: 'completion' },
  { value: 'plan_map_diagram', label: '15. Plan / Map / Diagram Labelling', category: 'completion' },
  { value: 'form_completion', label: '16. Form Completion', category: 'completion' },
  { value: 'short_answer', label: '17. Short Answer', category: 'completion' },
  { value: 'writing_task_1', label: '18. Writing Task 1 (Visual Report)', category: 'writing' },
  { value: 'writing_task_2', label: '19. Writing Task 2 (Essay)', category: 'writing' },
  { value: 'speaking_part_1', label: '20. Speaking Part 1 (Introduction)', category: 'speaking' },
  { value: 'speaking_part_2', label: '21. Speaking Part 2 (Cue Card)', category: 'speaking' },
  { value: 'speaking_part_3', label: '22. Speaking Part 3 (Discussion)', category: 'speaking' },
]

export function TestBuilder({
  initialTest,
  initialSections = [],
  initialQuestions = [],
  isEditMode = false,
}: TestBuilderProps) {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)

  // Step 1: Basic Information
  const [testId, setTestId] = useState<string | null>(initialTest?.id || null)
  const [title, setTitle] = useState(initialTest?.title || '')
  const [slug, setSlug] = useState(initialTest?.slug || '')
  const [description, setDescription] = useState(initialTest?.description || '')
  const [skill, setSkill] = useState<'reading' | 'listening' | 'writing' | 'speaking' | 'mock'>(
    initialTest?.skill || 'reading'
  )
  const [ieltsType, setIeltsType] = useState<'academic' | 'general_training' | 'both'>(
    initialTest?.ielts_type || 'academic'
  )
  const [accessType, setAccessType] = useState<'free' | 'premium'>(
    initialTest?.access_type || (initialTest?.is_premium ? 'premium' : 'free')
  )
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>(
    initialTest?.difficulty || 'medium'
  )
  // Part / Scope selection (Part 1, Part 2, Part 3, Part 4, or Full Test)
  const initialPart = useMemo(() => {
    const tags = Array.isArray(initialTest?.tags) ? initialTest.tags : []
    if (tags.some((t: string) => /part\s*1/i.test(t))) return 'part_1'
    if (tags.some((t: string) => /part\s*2/i.test(t))) return 'part_2'
    if (tags.some((t: string) => /part\s*3/i.test(t))) return 'part_3'
    if (tags.some((t: string) => /part\s*4/i.test(t))) return 'part_4'
    if (initialSections.length === 1) {
      const secTitle = initialSections[0]?.title || ''
      if (/part\s*1|passage\s*1/i.test(secTitle)) return 'part_1'
      if (/part\s*2|passage\s*2/i.test(secTitle)) return 'part_2'
      if (/part\s*3|passage\s*3/i.test(secTitle)) return 'part_3'
      if (/part\s*4/i.test(secTitle)) return 'part_4'
    }
    return 'full'
  }, [initialTest, initialSections])

  const initialDuration = useMemo(() => {
    if (initialTest?.time_limit_minutes && initialTest.time_limit_minutes !== 60) {
      return initialTest.time_limit_minutes
    }
    if (initialPart !== 'full') {
      return (initialTest?.skill || 'reading') === 'listening' ? 10 : 20
    }
    return initialTest?.time_limit_minutes || 60
  }, [initialTest, initialPart])

  const initialTagsString = useMemo(() => {
    const rawTags = Array.isArray(initialTest?.tags) ? [...initialTest.tags] : ['IELTS', 'Practice']
    if (initialPart === 'part_1' && !rawTags.some((t: string) => /part\s*1/i.test(t))) rawTags.push('Part 1')
    else if (initialPart === 'part_2' && !rawTags.some((t: string) => /part\s*2/i.test(t))) rawTags.push('Part 2')
    else if (initialPart === 'part_3' && !rawTags.some((t: string) => /part\s*3/i.test(t))) rawTags.push('Part 3')
    else if (initialPart === 'part_4' && !rawTags.some((t: string) => /part\s*4/i.test(t))) rawTags.push('Part 4')
    return rawTags.join(', ')
  }, [initialTest, initialPart])

  const [practicePart, setPracticePart] = useState<'full' | 'part_1' | 'part_2' | 'part_3' | 'part_4'>(initialPart)
  const [duration, setDuration] = useState<number>(initialDuration)
  const [coverImage, setCoverImage] = useState(initialTest?.cover_image || '')
  const [tagsInput, setTagsInput] = useState(initialTagsString)
  const [status, setStatus] = useState<'draft' | 'published'>(initialTest?.status || 'draft')

  const handlePracticePartChange = (newPart: 'full' | 'part_1' | 'part_2' | 'part_3' | 'part_4') => {
    setPracticePart(newPart)

    let partTag = ''
    let defaultTime = duration
    let sectionTitle = ''

    if (newPart === 'part_1') {
      partTag = 'Part 1'
      defaultTime = skill === 'reading' ? 20 : (skill === 'listening' ? 10 : duration)
      sectionTitle = skill === 'reading' ? 'Part 1 (Passage 1)' : 'Part 1 (Section 1)'
    } else if (newPart === 'part_2') {
      partTag = 'Part 2'
      defaultTime = skill === 'reading' ? 20 : (skill === 'listening' ? 10 : duration)
      sectionTitle = skill === 'reading' ? 'Part 2 (Passage 2)' : 'Part 2 (Section 2)'
    } else if (newPart === 'part_3') {
      partTag = 'Part 3'
      defaultTime = skill === 'reading' ? 20 : (skill === 'listening' ? 10 : duration)
      sectionTitle = skill === 'reading' ? 'Part 3 (Passage 3)' : 'Part 3 (Section 3)'
    } else if (newPart === 'part_4') {
      partTag = 'Part 4'
      defaultTime = 10
      sectionTitle = 'Part 4 (Section 4)'
    } else {
      partTag = 'Full Test'
      defaultTime = skill === 'reading' ? 60 : (skill === 'listening' ? 30 : duration)
      sectionTitle = 'Section 1 (Passage 1)'
    }

    setDuration(defaultTime)

    // Update tagsInput
    const currentTags = tagsInput.split(',').map(t => t.trim()).filter(Boolean)
    const filteredTags = currentTags.filter(t => !/^(part\s*[1-4]|full\s*test)$/i.test(t))
    if (partTag) {
      filteredTags.push(partTag)
    }
    setTagsInput(filteredTags.join(', '))

    // Auto-update section 1 if single section
    if (sections.length === 1 && sectionTitle) {
      setSections(prev => [
        {
          ...prev[0],
          title: sectionTitle,
          time_limit_minutes: defaultTime,
        }
      ])
    }
  }

  // Step 2: Sections & Passages
  const [sections, setSections] = useState<any[]>(
    initialSections.length > 0
      ? initialSections.map((s, idx) => ({
          id: s.id,
          title: s.title || `Section ${idx + 1}`,
          order_number: s.order_number || idx + 1,
          instructions: s.instructions || 'Answer questions based on the materials provided.',
          time_limit_minutes: s.time_limit_minutes || 20,
          passage_html: s.passage?.content || s.passage_html || '',
          audio_url: s.audio?.file_path || s.audio_url || '',
        }))
      : [
          {
            id: 'temp-sec-1',
            title: 'Section 1 (Passage 1)',
            order_number: 1,
            instructions: 'Answer questions based on the materials provided.',
            time_limit_minutes: 20,
            passage_html: '',
            audio_url: '',
          },
        ]
  )
  const [selectedSectionIndex, setSelectedSectionIndex] = useState(0)

  // Step 3: Questions
  const [questions, setQuestions] = useState<any[]>(() => {
    const secMap = new Map<string, number>()
    initialSections.forEach((s, idx) => {
      if (s.id) secMap.set(s.id, idx)
    })

    if (!initialQuestions || initialQuestions.length === 0) {
      return [
        {
          id: 'temp-q-1',
          section_index: 0,
          question_number: 1,
          question_type: 'multiple_choice',
          instruction: 'Choose the correct letter, A, B, C or D.',
          question_text: 'What is the main topic of this passage?',
          options: [
            { option_key: 'A', option_text: 'Option A', is_correct: false },
            { option_key: 'B', option_text: 'Option B', is_correct: true },
            { option_key: 'C', option_text: 'Option C', is_correct: false },
            { option_key: 'D', option_text: 'Option D', is_correct: false },
          ],
          correct_answer: 'B',
          accepted_answers: [],
          points: 1,
          difficulty: 'medium',
          explanation: 'Paragraph 1 clearly emphasizes the architectural discovery.',
          metadata: {},
          image_url: '',
          audio_url: '',
        },
      ]
    }

    return initialQuestions.map((q, idx) => {
      let sIdx = 0
      if (typeof q.section_index === 'number') {
        sIdx = q.section_index
      } else if (q.section_id && secMap.has(q.section_id)) {
        sIdx = secMap.get(q.section_id)!
      } else if (initialSections.length > 1) {
        const qNum = q.question_number || idx + 1
        if (initialSections.length === 3) {
          sIdx = qNum <= 13 ? 0 : qNum <= 26 ? 1 : 2
        } else if (initialSections.length === 4) {
          sIdx = qNum <= 10 ? 0 : qNum <= 20 ? 1 : qNum <= 30 ? 2 : 3
        }
      }

      return {
        ...q,
        id: q.id || `temp-q-${idx + 1}`,
        section_index: sIdx,
        question_number: q.question_number || idx + 1,
        question_type: q.question_type || 'multiple_choice',
        instruction: q.instruction || 'Choose the correct letter, A, B, C or D.',
        question_text: q.question_text || `Question #${idx + 1}`,
        options: q.options || [
          { option_key: 'A', option_text: 'Option A', is_correct: false },
          { option_key: 'B', option_text: 'Option B', is_correct: true },
          { option_key: 'C', option_text: 'Option C', is_correct: false },
          { option_key: 'D', option_text: 'Option D', is_correct: false },
        ],
        correct_answer: q.correct_answer || 'B',
        accepted_answers: Array.isArray(q.accepted_answers) ? q.accepted_answers : [],
        points: q.points || 1,
        difficulty: q.difficulty || 'medium',
        explanation: q.explanation || '',
        metadata: q.metadata || {},
        image_url: q.image_url || '',
        audio_url: q.audio_url || '',
      }
    })
  })

  useEffect(() => {
    if (initialQuestions && initialQuestions.length > 0) {
      const secMap = new Map<string, number>()
      initialSections.forEach((s, idx) => {
        if (s.id) secMap.set(s.id, idx)
      })

      setQuestions(
        initialQuestions.map((q, idx) => {
          let sIdx = 0
          if (typeof q.section_index === 'number') {
            sIdx = q.section_index
          } else if (q.section_id && secMap.has(q.section_id)) {
            sIdx = secMap.get(q.section_id)!
          } else if (initialSections.length > 1) {
            const qNum = q.question_number || idx + 1
            if (initialSections.length === 3) {
              sIdx = qNum <= 13 ? 0 : qNum <= 26 ? 1 : 2
            } else if (initialSections.length === 4) {
              sIdx = qNum <= 10 ? 0 : qNum <= 20 ? 1 : qNum <= 30 ? 2 : 3
            }
          }

          return {
            ...q,
            id: q.id || `temp-q-${idx + 1}`,
            section_index: sIdx,
            question_number: q.question_number || idx + 1,
            question_type: q.question_type || 'multiple_choice',
            instruction: q.instruction || 'Choose the correct letter, A, B, C or D.',
            question_text: q.question_text || `Question #${idx + 1}`,
            options: q.options || [
              { option_key: 'A', option_text: 'Option A', is_correct: false },
              { option_key: 'B', option_text: 'Option B', is_correct: true },
              { option_key: 'C', option_text: 'Option C', is_correct: false },
              { option_key: 'D', option_text: 'Option D', is_correct: false },
            ],
            correct_answer: q.correct_answer || 'B',
            accepted_answers: Array.isArray(q.accepted_answers) ? q.accepted_answers : [],
            points: q.points || 1,
            difficulty: q.difficulty || 'medium',
            explanation: q.explanation || '',
            metadata: q.metadata || {},
            image_url: q.image_url || '',
            audio_url: q.audio_url || '',
          }
        })
      )
    }
  }, [initialQuestions, initialSections])
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0)
  const [questionFilterSection, setQuestionFilterSection] = useState<number | 'all'>('all')

  // HTML Import Modal State inside TestBuilder
  const [showHtmlModal, setShowHtmlModal] = useState(false)
  const [htmlModalInput, setHtmlModalInput] = useState('')

  // Bulk Paste Modal State
  const [showBulkPasteModal, setShowBulkPasteModal] = useState(false)
  const [bulkPasteTab, setBulkPasteTab] = useState<'json' | 'text'>('json')
  const [bulkPasteInput, setBulkPasteInput] = useState('')
  const [bulkPasteSection, setBulkPasteSection] = useState(0)
  const [bulkPasteStartNum, setBulkPasteStartNum] = useState<number | null>(null)
  const [bulkPastePreview, setBulkPastePreview] = useState<any[] | null>(null)
  const [bulkPasteErrors, setBulkPasteErrors] = useState<string[]>([])

  // Auto-save & persistence states
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved')
  const [lastSavedTime, setLastSavedTime] = useState<string>('Just now')
  const [isSaving, setIsSaving] = useState(false)

  // Publish validation state
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [validationWarnings, setValidationWarnings] = useState<string[]>([])
  const [showValidationModal, setShowValidationModal] = useState(false)

  // Auto slug generation from title
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    if (!slug || slug === title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')) {
      setSlug(newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''))
    }
  }

  // Active Question reference
  const activeQ = questions[activeQuestionIndex] || questions[0]

  // Filtered question indices for navigator
  const filteredQuestionIndices = useMemo(() => {
    return questions
      .map((q, idx) => ({ ...q, originalIndex: idx }))
      .filter((q) => questionFilterSection === 'all' || q.section_index === questionFilterSection)
  }, [questions, questionFilterSection])

  // Save Complete Test Structure
  const handleSaveDraft = async () => {
    if (!title.trim()) {
      alert('Please provide a test title first.')
      setCurrentStep(1)
      return
    }

    try {
      setIsSaving(true)
      setAutoSaveStatus('saving')

      const tags = tagsInput
        .split(',')
        .map((t: string) => t.trim())
        .filter(Boolean)

      if (practicePart === 'part_1' && !tags.some((t: string) => /part\s*1/i.test(t))) tags.push('Part 1')
      else if (practicePart === 'part_2' && !tags.some((t: string) => /part\s*2/i.test(t))) tags.push('Part 2')
      else if (practicePart === 'part_3' && !tags.some((t: string) => /part\s*3/i.test(t))) tags.push('Part 3')
      else if (practicePart === 'part_4' && !tags.some((t: string) => /part\s*4/i.test(t))) tags.push('Part 4')
      else if (practicePart === 'full' && !tags.some((t: string) => /full\s*test/i.test(t))) tags.push('Full Test')

      const result = await saveFullTestStructure({
        test: {
          id: testId,
          title,
          slug,
          description,
          skill,
          ielts_type: ieltsType,
          access_type: accessType,
          difficulty,
          time_limit_minutes: duration,
          cover_image: coverImage,
          tags,
          status: 'draft',
        },
        sections,
        questions,
      })

      if (result.testId) {
        setTestId(result.testId)
      }

      setAutoSaveStatus('saved')
      setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
      alert('Test and all sections & questions saved successfully!')
    } catch (err: any) {
      console.error('Save error:', err)
      setAutoSaveStatus('error')
      alert(`Error saving test: ${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  // Publish with complete validation checks
  const handlePublish = async () => {
    const errors: string[] = []
    const warnings: string[] = []

    if (!title || title.trim().length < 3) errors.push('Test title is required (at least 3 characters).')
    if (!description || description.trim().length < 5) warnings.push('Description is missing or too short.')
    if (sections.length === 0) errors.push('At least one test section must be added.')
    if (questions.length === 0) errors.push('At least one question must be created.')

    // Check questions
    const seenNums = new Set<number>()
    questions.forEach((q) => {
      if (seenNums.has(q.question_number)) {
        errors.push(`Duplicate question number detected: #${q.question_number}`)
      }
      seenNums.add(q.question_number)

      if (q.question_type === 'multiple_choice' && (!q.options || q.options.length < 2)) {
        errors.push(`Question #${q.question_number} (Multiple Choice) must have at least 2 options.`)
      }
      if (q.question_type === 'multiple_response' && (!q.options || q.options.length < 3)) {
        errors.push(`Question #${q.question_number} (Multiple Response) must have at least 3 options to choose from.`)
      }
      if (
        ['multiple_choice', 'true_false_not_given', 'yes_no_not_given'].includes(q.question_type) &&
        !q.correct_answer
      ) {
        warnings.push(`Question #${q.question_number} has no correct answer selected.`)
      }
    })

    if (skill === 'reading' && !sections.some((s) => s.passage_html && s.passage_html.trim())) {
      warnings.push('Reading test does not have reading passages provided in sections.')
    }

    if (skill === 'listening' && !sections.some((s) => s.audio_url && s.audio_url.trim())) {
      warnings.push('Listening test does not have an audio URL assigned to sections.')
    }

    setValidationErrors(errors)
    setValidationWarnings(warnings)
    setShowValidationModal(true)

    if (errors.length === 0) {
      try {
        setIsSaving(true)
        const tags = tagsInput
          .split(',')
          .map((t: string) => t.trim())
          .filter(Boolean)

        if (practicePart === 'part_1' && !tags.some((t: string) => /part\s*1/i.test(t))) tags.push('Part 1')
        else if (practicePart === 'part_2' && !tags.some((t: string) => /part\s*2/i.test(t))) tags.push('Part 2')
        else if (practicePart === 'part_3' && !tags.some((t: string) => /part\s*3/i.test(t))) tags.push('Part 3')
        else if (practicePart === 'part_4' && !tags.some((t: string) => /part\s*4/i.test(t))) tags.push('Part 4')
        else if (practicePart === 'full' && !tags.some((t: string) => /full\s*test/i.test(t))) tags.push('Full Test')

        const res = await saveFullTestStructure({
          test: {
            id: testId,
            title,
            slug,
            description,
            skill,
            ielts_type: ieltsType,
            access_type: accessType,
            difficulty,
            time_limit_minutes: duration,
            cover_image: coverImage,
            tags,
            status: 'published',
          },
          sections,
          questions,
        })
        if (res.testId) setTestId(res.testId)
        setStatus('published')
      } catch (err: any) {
        alert(`Failed to publish: ${err.message}`)
      } finally {
        setIsSaving(false)
      }
    }
  }

  // Question Management Helpers - Add to Specific Section
  const addQuestionToSection = (targetSectionIndex: number, type = 'multiple_choice') => {
    const nextNum = questions.length + 1
    let defaultInstruction = 'Choose the correct answer'
    let defaultOptions: any[] = []
    let defaultCorrect = 'A'
    let defaultMetadata: any = {}

    switch (type) {
      case 'multiple_choice':
        defaultInstruction = 'Choose the correct letter, A, B, C or D.'
        defaultOptions = [
          { option_key: 'A', option_text: 'Option A', is_correct: false },
          { option_key: 'B', option_text: 'Option B', is_correct: true },
          { option_key: 'C', option_text: 'Option C', is_correct: false },
          { option_key: 'D', option_text: 'Option D', is_correct: false },
        ]
        defaultCorrect = 'B'
        break

      case 'multiple_response':
        defaultInstruction = 'Choose TWO letters, A–E.'
        defaultOptions = [
          { option_key: 'A', option_text: 'Option A', is_correct: true },
          { option_key: 'B', option_text: 'Option B', is_correct: false },
          { option_key: 'C', option_text: 'Option C', is_correct: true },
          { option_key: 'D', option_text: 'Option D', is_correct: false },
          { option_key: 'E', option_text: 'Option E', is_correct: false },
        ]
        defaultCorrect = 'A, C'
        break

      case 'true_false_not_given':
        defaultInstruction = 'Do the following statements agree with the information given in the Reading Passage? Write TRUE, FALSE or NOT GIVEN.'
        defaultCorrect = 'TRUE'
        break

      case 'yes_no_not_given':
        defaultInstruction = 'Do the following statements agree with the claims of the writer? Write YES, NO or NOT GIVEN.'
        defaultCorrect = 'YES'
        break

      case 'matching_headings':
        defaultInstruction = 'Choose the correct heading for each paragraph from the list of headings below.'
        defaultMetadata = {
          headings: [
            { key: 'i', text: 'The initial discovery and historical origins' },
            { key: 'ii', text: 'Structural evolution over centuries' },
            { key: 'iii', text: 'Modern preservation and restoration efforts' },
            { key: 'iv', text: 'Economic impact on regional commerce' },
            { key: 'v', text: 'Comparative analysis with neighboring structures' },
          ],
        }
        defaultCorrect = 'i'
        break

      case 'matching_information':
        defaultInstruction = 'Which paragraph contains the following information? Write the correct letter, A–G.'
        defaultOptions = [
          { option_key: 'A', option_text: 'Paragraph A', is_correct: true },
          { option_key: 'B', option_text: 'Paragraph B', is_correct: false },
          { option_key: 'C', option_text: 'Paragraph C', is_correct: false },
          { option_key: 'D', option_text: 'Paragraph D', is_correct: false },
          { option_key: 'E', option_text: 'Paragraph E', is_correct: false },
          { option_key: 'F', option_text: 'Paragraph F', is_correct: false },
          { option_key: 'G', option_text: 'Paragraph G', is_correct: false },
        ]
        defaultCorrect = 'A'
        defaultMetadata = { options_title: 'Paragraphs', options: defaultOptions }
        break

      case 'matching_features':
        defaultInstruction = 'Match each statement with the correct researcher/feature from the list below.'
        defaultOptions = [
          { option_key: 'A', option_text: 'Dr. Richard Dawkins', is_correct: true },
          { option_key: 'B', option_text: 'Prof. Jane Goodall', is_correct: false },
          { option_key: 'C', option_text: 'Sir David Attenborough', is_correct: false },
          { option_key: 'D', option_text: 'Charles Darwin', is_correct: false },
        ]
        defaultCorrect = 'A'
        defaultMetadata = { options_title: 'List of Researchers', options: defaultOptions }
        break

      case 'matching_sentence_endings':
        defaultInstruction = 'Complete each sentence with the correct ending, A–E, below.'
        defaultOptions = [
          { option_key: 'A', option_text: 'was constructed during the late Roman Empire.', is_correct: true },
          { option_key: 'B', option_text: 'experienced a significant demographic decline.', is_correct: false },
          { option_key: 'C', option_text: 'resulted in comprehensive architectural reforms.', is_correct: false },
          { option_key: 'D', option_text: 'prompted the development of regional transport links.', is_correct: false },
          { option_key: 'E', option_text: 'demonstrated unprecedented economic sustainability.', is_correct: false },
        ]
        defaultCorrect = 'A'
        defaultMetadata = { options_title: 'Sentence Endings', options: defaultOptions }
        break

      case 'sentence_completion':
      case 'summary_completion':
      case 'note_completion':
      case 'table_completion':
      case 'flow_chart_completion':
      case 'short_answer':
        defaultInstruction = 'Write NO MORE THAN TWO WORDS from the passage for each answer.'
        defaultCorrect = 'answer'
        break

      case 'diagram_label_completion':
        defaultInstruction = 'Label the diagram below. Choose NO MORE THAN TWO WORDS from the passage.'
        defaultCorrect = 'label'
        break

      case 'writing_task_1':
        defaultInstruction = 'Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.'
        defaultCorrect = 'Model response'
        break

      case 'writing_task_2':
        defaultInstruction = 'Write about the following topic. Give reasons for your answer and include any relevant examples from your own knowledge. Write at least 250 words.'
        defaultCorrect = 'Model essay'
        break

      case 'speaking_part_2':
        defaultInstruction = 'Candidate Task Card (You will have 1 minute to prepare and 2 minutes to speak)'
        defaultCorrect = 'Model response'
        break
    }

    const newQ = {
      id: `temp-q-${Date.now()}`,
      section_index: targetSectionIndex,
      question_number: nextNum,
      question_type: type,
      instruction: defaultInstruction,
      question_text: `New IELTS Question #${nextNum}`,
      options: defaultOptions,
      correct_answer: defaultCorrect,
      accepted_answers: [],
      points: 1,
      difficulty: 'medium',
      explanation: '',
      metadata: defaultMetadata,
      image_url: '',
      audio_url: '',
    }

    setQuestions([...questions, newQ])
    setActiveQuestionIndex(questions.length)
  }

  // 1-Click Official IELTS Template Generator
  const generateOfficialTemplate = (moduleType: 'reading' | 'listening') => {
    if (!confirm(`Generate standard 40-question IELTS ${moduleType.toUpperCase()} structure? This will configure official sections and questions 1 to 40.`)) return

    if (moduleType === 'reading') {
      const templateSections = [
        { id: 'temp-sec-1', title: 'Reading Passage 1', order_number: 1, instructions: 'Read the passage and answer questions 1–13.', time_limit_minutes: 20, passage_html: '<h2>Passage 1 Title</h2><p>Paste passage 1 text here...</p>', audio_url: '' },
        { id: 'temp-sec-2', title: 'Reading Passage 2', order_number: 2, instructions: 'Read the passage and answer questions 14–26.', time_limit_minutes: 20, passage_html: '<h2>Passage 2 Title</h2><p>Paste passage 2 text here...</p>', audio_url: '' },
        { id: 'temp-sec-3', title: 'Reading Passage 3', order_number: 3, instructions: 'Read the passage and answer questions 27–40.', time_limit_minutes: 20, passage_html: '<h2>Passage 3 Title</h2><p>Paste passage 3 text here...</p>', audio_url: '' },
      ]
      const templateQuestions: any[] = []
      
      // Passage 1: Questions 1..13
      for (let i = 1; i <= 13; i++) {
        templateQuestions.push({
          id: `temp-q-${i}`,
          section_index: 0,
          question_number: i,
          question_type: i <= 6 ? 'true_false_not_given' : 'multiple_choice',
          instruction: i <= 6 ? 'Write TRUE, FALSE or NOT GIVEN' : 'Choose the correct letter, A, B, C or D.',
          question_text: `Passage 1 Question #${i}`,
          options: i <= 6 ? [] : [
            { option_key: 'A', option_text: 'Option A', is_correct: false },
            { option_key: 'B', option_text: 'Option B', is_correct: true },
            { option_key: 'C', option_text: 'Option C', is_correct: false },
            { option_key: 'D', option_text: 'Option D', is_correct: false },
          ],
          correct_answer: i <= 6 ? 'TRUE' : 'B',
          accepted_answers: [],
          points: 1,
          difficulty: 'easy',
          explanation: '',
          metadata: {},
        })
      }

      // Passage 2: Questions 14..26
      for (let i = 14; i <= 26; i++) {
        templateQuestions.push({
          id: `temp-q-${i}`,
          section_index: 1,
          question_number: i,
          question_type: i <= 19 ? 'matching_headings' : 'sentence_completion',
          instruction: i <= 19 ? 'Choose the correct heading for each paragraph from the list of headings.' : 'Write NO MORE THAN TWO WORDS from the passage.',
          question_text: `Passage 2 Question #${i}`,
          options: [],
          correct_answer: i <= 19 ? 'i' : 'answer',
          accepted_answers: [],
          points: 1,
          difficulty: 'medium',
          explanation: '',
          metadata: i <= 19 ? {
            headings: [
              { key: 'i', text: 'Historical significance and origins' },
              { key: 'ii', text: 'Architectural structural adaptations' },
              { key: 'iii', text: 'Socioeconomic implications' },
              { key: 'iv', text: 'Modern restoration and preservation' },
            ],
          } : {},
        })
      }

      // Passage 3: Questions 27..40
      for (let i = 27; i <= 40; i++) {
        templateQuestions.push({
          id: `temp-q-${i}`,
          section_index: 2,
          question_number: i,
          question_type: i <= 34 ? 'multiple_choice' : 'yes_no_not_given',
          instruction: i <= 34 ? 'Choose the correct letter, A, B, C or D.' : 'Write YES, NO or NOT GIVEN.',
          question_text: `Passage 3 Question #${i}`,
          options: i <= 34 ? [
            { option_key: 'A', option_text: 'Option A', is_correct: false },
            { option_key: 'B', option_text: 'Option B', is_correct: true },
            { option_key: 'C', option_text: 'Option C', is_correct: false },
            { option_key: 'D', option_text: 'Option D', is_correct: false },
          ] : [],
          correct_answer: i <= 34 ? 'B' : 'YES',
          accepted_answers: [],
          points: 1,
          difficulty: 'hard',
          explanation: '',
          metadata: {},
        })
      }

      setSkill('reading')
      setSections(templateSections)
      setQuestions(templateQuestions)
      setActiveQuestionIndex(0)
      setCurrentStep(3)
    } else {
      // Listening: 4 parts with 10 questions each (total 40)
      const templateSections = [
        { id: 'temp-sec-1', title: 'Part 1', order_number: 1, instructions: 'Answer questions 1–10 as you listen to the recording.', time_limit_minutes: 10, passage_html: '', audio_url: '' },
        { id: 'temp-sec-2', title: 'Part 2', order_number: 2, instructions: 'Answer questions 11–20 as you listen to the recording.', time_limit_minutes: 10, passage_html: '', audio_url: '' },
        { id: 'temp-sec-3', title: 'Part 3', order_number: 3, instructions: 'Answer questions 21–30 as you listen to the recording.', time_limit_minutes: 10, passage_html: '', audio_url: '' },
        { id: 'temp-sec-4', title: 'Part 4', order_number: 4, instructions: 'Answer questions 31–40 as you listen to the recording.', time_limit_minutes: 10, passage_html: '', audio_url: '' },
      ]
      const templateQuestions: any[] = []
      for (let i = 1; i <= 40; i++) {
        const sIdx = Math.floor((i - 1) / 10)
        templateQuestions.push({
          id: `temp-q-${i}`,
          section_index: sIdx,
          question_number: i,
          question_type: i <= 10 || i >= 31 ? 'note_completion' : 'multiple_choice',
          instruction: i <= 10 || i >= 31 ? 'Write ONE WORD AND/OR A NUMBER.' : 'Choose the correct letter, A, B or C.',
          question_text: `Listening Part ${sIdx + 1} Question #${i}`,
          options: i <= 10 || i >= 31 ? [] : [
            { option_key: 'A', option_text: 'Option A', is_correct: true },
            { option_key: 'B', option_text: 'Option B', is_correct: false },
            { option_key: 'C', option_text: 'Option C', is_correct: false },
          ],
          correct_answer: i <= 10 || i >= 31 ? 'answer' : 'A',
          accepted_answers: [],
          points: 1,
          difficulty: sIdx <= 1 ? 'easy' : sIdx === 2 ? 'medium' : 'hard',
          explanation: '',
          metadata: {},
        })
      }
      setSkill('listening')
      setSections(templateSections)
      setQuestions(templateQuestions)
      setActiveQuestionIndex(0)
      setCurrentStep(3)
    }
  }

  // Direct HTML Import into current test
  const handleHtmlModalImport = () => {
    if (!htmlModalInput.trim()) return
    try {
      const parsed = parseIeltsHtml(htmlModalInput)
      if (parsed.title && (!title || title === 'Untitled IELTS Test')) {
        setTitle(parsed.title)
        handleTitleChange(parsed.title)
      }
      if (parsed.skill) setSkill(parsed.skill)
      if (parsed.sections.length > 0) {
        setSections(
          parsed.sections.map((s, idx) => ({
            id: `temp-sec-${Date.now()}-${idx + 1}`,
            title: s.title,
            order_number: idx + 1,
            instructions: s.instructions,
            time_limit_minutes: s.time_limit_minutes,
            passage_html: s.passage_html,
            audio_url: s.audio_url,
          }))
        )

        // Flatten questions with correct section index
        const importedQuestions: any[] = []
        parsed.sections.forEach((sec, sIdx) => {
          sec.questions.forEach((q) => {
            importedQuestions.push({
              ...q,
              id: `temp-q-${Date.now()}-${q.question_number}`,
              section_index: sIdx,
            })
          })
        })

        if (importedQuestions.length > 0) {
          setQuestions(importedQuestions)
        }
      }

      setShowHtmlModal(false)
      setHtmlModalInput('')
      alert(`Imported ${parsed.sections.length} sections and ${parsed.total_questions} questions from HTML!`)
      setCurrentStep(3)
    } catch (err: any) {
      alert(`HTML parse error: ${err.message}`)
    }
  }

  // ---------------------------------------------------------------
  // BULK PASTE: Parse JSON array of questions
  // ---------------------------------------------------------------
  const parseBulkJson = (text: string): { questions: any[]; errors: string[] } => {
    const errors: string[] = []
    let parsed: any[]

    try {
      parsed = JSON.parse(text)
      if (!Array.isArray(parsed)) {
        return { questions: [], errors: ['JSON must be an array [...] of question objects.'] }
      }
    } catch (e) {
      return { questions: [], errors: [`Invalid JSON: ${(e as Error).message}`] }
    }

    const validTypes = QUESTION_TYPES.map((t) => t.value)
    const questions: any[] = []

    parsed.forEach((item, idx) => {
      if (!item.question && !item.question_text) {
        errors.push(`Item #${idx + 1}: missing "question" field — skipped.`)
        return
      }

      const qType = (item.type || item.question_type || 'multiple_choice').toLowerCase()
      if (!validTypes.includes(qType)) {
        errors.push(`Item #${idx + 1}: unknown type "${qType}". Using "multiple_choice".`)
      }

      // Build options array
      let builtOptions: any[] = []
      if (item.options && Array.isArray(item.options)) {
        builtOptions = item.options.map((opt: any, oIdx: number) => {
          const key = String.fromCharCode(65 + oIdx)
          const txt = typeof opt === 'string' ? opt : (opt.text || opt.option_text || String(opt))
          return { option_key: key, option_text: txt, is_correct: false }
        })
      }

      // Mark correct answer in options
      const answer = String(item.answer || item.correct_answer || '')
      if (answer && builtOptions.length > 0) {
        builtOptions = builtOptions.map((opt) => ({
          ...opt,
          is_correct: opt.option_key === answer || opt.option_text === answer,
        }))
      }

      // Auto instruction
      let instruction = item.instruction || ''
      if (!instruction) {
        const instrMap: Record<string, string> = {
          multiple_choice: 'Choose the correct letter, A, B, C or D.',
          multiple_response: 'Choose TWO letters, A–E.',
          true_false_not_given: 'Do the following statements agree with the information? Write TRUE, FALSE or NOT GIVEN.',
          yes_no_not_given: 'Do the following statements agree with the claims of the writer? Write YES, NO or NOT GIVEN.',
          matching_headings: 'Choose the correct heading for each paragraph from the list of headings below.',
          matching_information: 'Which paragraph contains the following information? Write the correct letter, A–G.',
          matching_features: 'Match each statement with the correct person/date from the list.',
          matching_sentence_endings: 'Complete each sentence with the correct ending, A–E, below.',
          sentence_completion: 'Write NO MORE THAN TWO WORDS from the passage for each answer.',
          summary_completion: 'Write NO MORE THAN TWO WORDS from the passage for each answer.',
          note_completion: 'Write ONE WORD AND/OR A NUMBER for each answer.',
          table_completion: 'Write NO MORE THAN TWO WORDS AND/OR A NUMBER.',
          flow_chart_completion: 'Write NO MORE THAN TWO WORDS from the passage for each answer.',
          diagram_label_completion: 'Label the diagram. Choose NO MORE THAN TWO WORDS from the passage.',
          plan_map_diagram: 'Label the map or plan below. Write the correct letter, A–H, next to questions.',
          form_completion: 'Write ONE WORD AND/OR A NUMBER for each answer.',
          short_answer: 'Write NO MORE THAN TWO WORDS for each answer.',
          writing_task_1: 'Summarise the information by selecting and reporting the main features. Write at least 150 words.',
          writing_task_2: 'Write about the following topic. Give reasons for your answer. Write at least 250 words.',
          speaking_part_1: 'Answer questions about familiar topics.',
          speaking_part_2: 'You will have 1 minute to prepare and up to 2 minutes to speak.',
          speaking_part_3: 'Discuss abstract ideas related to the topic in Part 2.',
        }
        instruction = instrMap[qType] || 'Answer the question.'
      }

      // Auto metadata for matching_headings
      let metadata = item.metadata || {}
      if (qType === 'matching_headings' && !metadata.headings) {
        metadata = {
          headings: [
            { key: 'i', text: 'Heading i' },
            { key: 'ii', text: 'Heading ii' },
            { key: 'iii', text: 'Heading iii' },
          ],
        }
      }

      questions.push({
        id: `temp-q-bulk-${Date.now()}-${idx}`,
        section_index: bulkPasteSection,
        question_number: 0,
        question_type: validTypes.includes(qType) ? qType : 'multiple_choice',
        instruction,
        question_text: item.question || item.question_text || `Question #${idx + 1}`,
        options: builtOptions,
        correct_answer: answer || (builtOptions.find((o: any) => o.is_correct)?.option_key) || '',
        accepted_answers: Array.isArray(item.accepted_answers) ? item.accepted_answers : [],
        points: item.points || 1,
        difficulty: item.difficulty || 'medium',
        explanation: item.explanation || '',
        metadata,
        image_url: item.image_url || '',
        audio_url: item.audio_url || '',
      })
    })

    return { questions, errors }
  }

  // ---------------------------------------------------------------
  // BULK PASTE: Parse plain Quick Text format
  // ---------------------------------------------------------------
  const parseBulkText = (text: string): { questions: any[]; errors: string[] } => {
    const errors: string[] = []
    const questions: any[] = []
    const validTypes = QUESTION_TYPES.map((t) => t.value)

    // Split by double newline (blank line separates questions)
    const blocks = text.split(/\n\s*\n/).filter((b) => b.trim())

    blocks.forEach((block, idx) => {
      const lines = block.trim().split('\n').map((l) => l.trim()).filter((l) => l)
      if (!lines.length) return

      const firstLine = lines[0]

      // Detect type from [type] pattern
      const typeMatch = firstLine.match(/\[([a-z_]+)\]/i)
      let qType = typeMatch ? typeMatch[1].toLowerCase() : 'multiple_choice'
      if (!validTypes.includes(qType)) {
        errors.push(`Block #${idx + 1}: unknown type "${qType}". Using "multiple_choice".`)
        qType = 'multiple_choice'
      }

      // Question text: strip "Q1." prefix and [type] tag
      const questionText = firstLine
        .replace(/^Q\s*\d+\.\s*/i, '')
        .replace(/\[[^\]]+\]/g, '')
        .trim()

      // Parse options: lines starting with A. B. C. D. or A) B) C) D)
      const optionLines = lines.filter((l) => /^[A-E][.)]/i.test(l))
      const options = optionLines.map((l) => {
        const key = l[0].toUpperCase()
        const txt = l.replace(/^[A-E][.)]/i, '').trim()
        return { option_key: key, option_text: txt, is_correct: false }
      })

      // ANSWER line
      const answerLine = lines.find((l) => /^ANSWER\s*:/i.test(l))
      const answer = answerLine ? answerLine.replace(/^ANSWER\s*:/i, '').trim() : ''

      // Mark correct options
      const markedOptions = options.map((opt) => ({
        ...opt,
        is_correct: opt.option_key === answer || opt.option_text === answer,
      }))

      // INSTRUCTION line (optional override)
      const instrLine = lines.find((l) => /^INSTRUCTION\s*:/i.test(l))
      let instruction = instrLine ? instrLine.replace(/^INSTRUCTION\s*:/i, '').trim() : ''
      if (!instruction) {
        const instrMap: Record<string, string> = {
          multiple_choice: 'Choose the correct letter, A, B, C or D.',
          multiple_response: 'Choose TWO letters, A–E.',
          true_false_not_given: 'Write TRUE, FALSE or NOT GIVEN.',
          yes_no_not_given: 'Write YES, NO or NOT GIVEN.',
          matching_headings: 'Choose the correct heading for each paragraph.',
          matching_information: 'Which paragraph contains the following information?',
          matching_features: 'Match each statement with the correct person.',
          matching_sentence_endings: 'Complete each sentence with the correct ending.',
          sentence_completion: 'Write NO MORE THAN TWO WORDS from the passage.',
          summary_completion: 'Write NO MORE THAN TWO WORDS from the passage.',
          note_completion: 'Write ONE WORD AND/OR A NUMBER.',
          table_completion: 'Write NO MORE THAN TWO WORDS AND/OR A NUMBER.',
          flow_chart_completion: 'Write NO MORE THAN TWO WORDS from the passage.',
          diagram_label_completion: 'Label the diagram. NO MORE THAN TWO WORDS.',
          short_answer: 'Write NO MORE THAN TWO WORDS.',
          writing_task_1: 'Summarise the information. Write at least 150 words.',
          writing_task_2: 'Write about the following topic. Write at least 250 words.',
          speaking_part_1: 'Answer questions about familiar topics.',
          speaking_part_2: '1 minute to prepare, 2 minutes to speak.',
          speaking_part_3: 'Discuss abstract ideas related to the topic.',
        }
        instruction = instrMap[qType] || 'Answer the question.'
      }

      questions.push({
        id: `temp-q-bulk-${Date.now()}-${idx}`,
        section_index: bulkPasteSection,
        question_number: 0,
        question_type: qType,
        instruction,
        question_text: questionText || `Question #${idx + 1}`,
        options: markedOptions,
        correct_answer: answer,
        accepted_answers: [],
        points: 1,
        difficulty: 'medium',
        explanation: '',
        metadata: qType === 'matching_headings' ? { headings: [{ key: 'i', text: 'Heading i' }, { key: 'ii', text: 'Heading ii' }] } : {},
        image_url: '',
        audio_url: '',
      })
    })

    return { questions, errors }
  }

  const handleBulkPastePreview = () => {
    if (!bulkPasteInput.trim()) return
    const result = bulkPasteTab === 'json'
      ? parseBulkJson(bulkPasteInput)
      : parseBulkText(bulkPasteInput)
    setBulkPastePreview(result.questions)
    setBulkPasteErrors(result.errors)
  }

  const handleBulkPasteImport = () => {
    if (!bulkPastePreview || bulkPastePreview.length === 0) return
    const startNum = bulkPasteStartNum ?? (questions.length + 1)
    const importedQuestions = bulkPastePreview.map((q, idx) => ({
      ...q,
      id: `temp-q-bulk-${Date.now()}-${idx}`,
      question_number: startNum + idx,
      section_index: bulkPasteSection,
    }))
    setQuestions([...questions, ...importedQuestions])
    setActiveQuestionIndex(questions.length)
    setShowBulkPasteModal(false)
    setBulkPasteInput('')
    setBulkPastePreview(null)
    setBulkPasteErrors([])
    setBulkPasteStartNum(null)
    alert(`✅ Successfully imported ${importedQuestions.length} questions!`)
    setCurrentStep(3)
  }

  const duplicateActiveQuestion = () => {
    if (!activeQ) return
    const duplicated = {
      ...activeQ,
      id: `temp-q-${Date.now()}`,
      question_number: questions.length + 1,
      question_text: `${activeQ.question_text} (Copy)`,
      options: activeQ.options ? JSON.parse(JSON.stringify(activeQ.options)) : [],
      metadata: activeQ.metadata ? JSON.parse(JSON.stringify(activeQ.metadata)) : {},
    }
    setQuestions([...questions, duplicated])
    setActiveQuestionIndex(questions.length)
  }

  const deleteActiveQuestion = () => {
    if (questions.length <= 1) {
      alert('Test must retain at least one question.')
      return
    }
    const updated = questions.filter((_, idx) => idx !== activeQuestionIndex)
    const renumbered = updated.map((q, idx) => ({ ...q, question_number: idx + 1 }))
    setQuestions(renumbered)
    setActiveQuestionIndex(Math.max(0, activeQuestionIndex - 1))
  }

  const moveQuestion = (direction: 'up' | 'down') => {
    if (direction === 'up' && activeQuestionIndex === 0) return
    if (direction === 'down' && activeQuestionIndex === questions.length - 1) return

    const targetIndex = direction === 'up' ? activeQuestionIndex - 1 : activeQuestionIndex + 1
    const updated = [...questions]
    const temp = updated[activeQuestionIndex]
    updated[activeQuestionIndex] = updated[targetIndex]
    updated[targetIndex] = temp

    // Renumber sequentially
    const renumbered = updated.map((q, idx) => ({ ...q, question_number: idx + 1 }))
    setQuestions(renumbered)
    setActiveQuestionIndex(targetIndex)
  }

  const updateActiveQuestion = (fields: Partial<any>) => {
    const updated = [...questions]
    updated[activeQuestionIndex] = { ...updated[activeQuestionIndex], ...fields }
    setQuestions(updated)
  }

  const syncReferenceToSection = () => {
    if (!activeQ) return
    const currentSection = activeQ.section_index
    const currentOptions = activeQ.options && activeQ.options.length > 0
      ? activeQ.options
      : (activeQ.metadata?.options || [])
    const optionsTitle = activeQ.metadata?.options_title || ''

    if (currentOptions.length === 0) {
      alert('Please add at least one reference option before syncing to other questions.')
      return
    }

    const matchingTypes = [
      'matching_information',
      'matching_features',
      'matching_sentence_endings',
      'summary_completion',
    ]

    let count = 0
    const updated = questions.map((q) => {
      if (q.id !== activeQ.id && q.section_index === currentSection && matchingTypes.includes(q.question_type)) {
        count++
        return {
          ...q,
          options: JSON.parse(JSON.stringify(currentOptions)),
          metadata: {
            ...(q.metadata || {}),
            options: JSON.parse(JSON.stringify(currentOptions)),
            options_title: optionsTitle,
          },
        }
      }
      return q
    })

    if (count === 0) {
      alert(`No other matching questions found in Section ${currentSection + 1}. Add more matching questions to this section first.`)
      return
    }

    setQuestions(updated)
    alert(`✅ Successfully synced option reference to ${count} other matching question(s) in Section ${currentSection + 1}!`)
  }

  // Change Question Type with smart defaults
  const handleTypeChange = (newType: string) => {
    let newInstruction = activeQ.instruction
    let newOptions = activeQ.options || []
    let newCorrect = activeQ.correct_answer || ''
    let newMetadata = activeQ.metadata || {}

    if (newType === 'true_false_not_given') {
      newInstruction = 'Do the following statements agree with the information given in the Reading Passage? Write TRUE, FALSE or NOT GIVEN.'
      newCorrect = 'TRUE'
      newOptions = []
    } else if (newType === 'yes_no_not_given') {
      newInstruction = 'Do the following statements agree with the claims of the writer? Write YES, NO or NOT GIVEN.'
      newCorrect = 'YES'
      newOptions = []
    } else if (newType === 'multiple_choice') {
      newInstruction = 'Choose the correct letter, A, B, C or D.'
      if (!newOptions || newOptions.length < 2) {
        newOptions = [
          { option_key: 'A', option_text: 'Option A', is_correct: false },
          { option_key: 'B', option_text: 'Option B', is_correct: true },
          { option_key: 'C', option_text: 'Option C', is_correct: false },
          { option_key: 'D', option_text: 'Option D', is_correct: false },
        ]
      }
      newCorrect = newOptions.find((o: any) => o.is_correct)?.option_key || 'A'
    } else if (newType === 'multiple_response') {
      newInstruction = 'Choose TWO letters, A–E.'
      if (!newOptions || newOptions.length < 3) {
        newOptions = [
          { option_key: 'A', option_text: 'Option A', is_correct: true },
          { option_key: 'B', option_text: 'Option B', is_correct: false },
          { option_key: 'C', option_text: 'Option C', is_correct: true },
          { option_key: 'D', option_text: 'Option D', is_correct: false },
          { option_key: 'E', option_text: 'Option E', is_correct: false },
        ]
      }
      newCorrect = 'A, C'
    } else if (newType === 'matching_headings') {
      newInstruction = 'Choose the correct heading for each paragraph from the list of headings below.'
      if (!newMetadata.headings) {
        newMetadata.headings = [
          { key: 'i', text: 'The initial discovery and historical origins' },
          { key: 'ii', text: 'Structural evolution over centuries' },
          { key: 'iii', text: 'Modern preservation and restoration efforts' },
          { key: 'iv', text: 'Economic impact on regional commerce' },
          { key: 'v', text: 'Comparative analysis with neighboring structures' },
        ]
      }
      newCorrect = 'i'
    } else if (newType === 'matching_features') {
      newInstruction = 'Match each statement with the correct researcher/feature from the list below.'
      if (!newOptions || newOptions.length < 2) {
        newOptions = [
          { option_key: 'A', option_text: 'Dr. Richard Dawkins', is_correct: true },
          { option_key: 'B', option_text: 'Prof. Jane Goodall', is_correct: false },
          { option_key: 'C', option_text: 'Sir David Attenborough', is_correct: false },
          { option_key: 'D', option_text: 'Charles Darwin', is_correct: false },
        ]
      }
      newCorrect = newOptions.find((o: any) => o.is_correct)?.option_key || 'A'
      newMetadata = {
        ...newMetadata,
        options_title: newMetadata.options_title || 'List of Researchers',
        options: newOptions,
      }
    } else if (newType === 'matching_sentence_endings') {
      newInstruction = 'Complete each sentence with the correct ending, A–E, below.'
      if (!newOptions || newOptions.length < 2) {
        newOptions = [
          { option_key: 'A', option_text: 'was constructed during the late Roman Empire.', is_correct: true },
          { option_key: 'B', option_text: 'experienced a significant demographic decline.', is_correct: false },
          { option_key: 'C', option_text: 'resulted in comprehensive architectural reforms.', is_correct: false },
          { option_key: 'D', option_text: 'prompted the development of regional transport links.', is_correct: false },
          { option_key: 'E', option_text: 'demonstrated unprecedented economic sustainability.', is_correct: false },
        ]
      }
      newCorrect = newOptions.find((o: any) => o.is_correct)?.option_key || 'A'
      newMetadata = {
        ...newMetadata,
        options_title: newMetadata.options_title || 'Sentence Endings',
        options: newOptions,
      }
    } else if (newType === 'matching_information') {
      newInstruction = 'Which paragraph contains the following information? Write the correct letter, A–G.'
      if (!newOptions || newOptions.length < 2) {
        newOptions = [
          { option_key: 'A', option_text: 'Paragraph A', is_correct: true },
          { option_key: 'B', option_text: 'Paragraph B', is_correct: false },
          { option_key: 'C', option_text: 'Paragraph C', is_correct: false },
          { option_key: 'D', option_text: 'Paragraph D', is_correct: false },
          { option_key: 'E', option_text: 'Paragraph E', is_correct: false },
          { option_key: 'F', option_text: 'Paragraph F', is_correct: false },
          { option_key: 'G', option_text: 'Paragraph G', is_correct: false },
        ]
      }
      newCorrect = 'A'
      newMetadata = {
        ...newMetadata,
        options_title: newMetadata.options_title || 'Paragraphs',
        options: newOptions,
      }
    } else if (newType.includes('completion') || newType === 'short_answer') {
      newInstruction = 'Write NO MORE THAN TWO WORDS from the passage for each answer.'
      newCorrect = typeof newCorrect === 'string' ? newCorrect : ''
    }

    updateActiveQuestion({
      question_type: newType,
      instruction: newInstruction,
      options: newOptions,
      correct_answer: newCorrect,
      metadata: newMetadata,
    })
  }

  // Section Management Helpers
  const addSection = () => {
    const nextOrder = sections.length + 1
    const newSec = {
      id: `temp-sec-${Date.now()}`,
      title: `Section ${nextOrder}`,
      order_number: nextOrder,
      instructions: 'Read the text and answer questions below.',
      time_limit_minutes: 20,
      passage_html: '',
      audio_url: '',
    }
    setSections([...sections, newSec])
    setSelectedSectionIndex(sections.length)
  }

  const deleteSection = (idx: number) => {
    if (sections.length <= 1) {
      alert('Test must have at least one section.')
      return
    }
    const updated = sections.filter((_, i) => i !== idx)
    setSections(updated)
    setSelectedSectionIndex(Math.max(0, idx - 1))
  }

  return (
    <div className="space-y-6 pb-20 w-full">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Link to="/admin/tests"
            className="p-2 rounded-xl border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-foreground tracking-tight">
                {isEditMode ? 'Edit IELTS Test' : 'Create New IELTS Test'}
              </h1>
              <span
                className={cn(
                  'text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border',
                  status === 'published'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400'
                    : 'bg-secondary text-muted-foreground border-border'
                )}
              >
                {status}
              </span>
            </div>
            <p className="text-xs text-muted-foreground truncate max-w-md">
              {title || 'Untitled IELTS Test'} • {sections.length} Sections • {questions.length} Questions
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Import HTML modal trigger */}
          <button
            type="button"
            onClick={() => setShowHtmlModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card hover:bg-secondary text-foreground text-xs font-bold transition-all cursor-pointer"
          >
            <FileCode className="w-3.5 h-3.5 text-primary" />
            <span>Import HTML</span>
          </button>

          {/* Bulk Paste Questions trigger */}
          <button
            type="button"
            onClick={() => {
              setShowBulkPasteModal(true)
              setBulkPasteSection(selectedSectionIndex || 0)
              setBulkPasteStartNum(questions.length + 1)
              setBulkPastePreview(null)
              setBulkPasteErrors([])
              setBulkPasteInput('')
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-primary/40 bg-primary/5 hover:bg-primary/10 text-foreground text-xs font-bold transition-all cursor-pointer"
          >
            <ClipboardPaste className="w-3.5 h-3.5 text-primary" />
            <span>Bulk Paste</span>
          </button>

          {/* Quick Templates Trigger */}
          <div className="relative group">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card hover:bg-secondary text-foreground text-xs font-bold transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Templates ▾</span>
            </button>
            <div className="absolute right-0 top-full mt-1 w-56 bg-card border border-border rounded-xl shadow-lg p-1.5 z-40 hidden group-hover:block">
              <button
                type="button"
                onClick={() => generateOfficialTemplate('reading')}
                className="w-full text-left px-3 py-2 text-xs font-semibold rounded-lg hover:bg-secondary text-foreground block cursor-pointer"
              >
                📘 Standard IELTS Reading (3 Passages, 40 Qs)
              </button>
              <button
                type="button"
                onClick={() => generateOfficialTemplate('listening')}
                className="w-full text-left px-3 py-2 text-xs font-semibold rounded-lg hover:bg-secondary text-foreground block cursor-pointer"
              >
                🎧 Standard IELTS Listening (4 Parts, 40 Qs)
              </button>
            </div>
          </div>

          {/* Save status */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-2 border-r border-border">
            {autoSaveStatus === 'saving' ? (
              <span className="flex items-center gap-1 text-primary font-semibold animate-pulse">
                <Clock className="w-3.5 h-3.5" /> Saving...
              </span>
            ) : autoSaveStatus === 'error' ? (
              <span className="flex items-center gap-1 text-destructive font-semibold">
                <AlertCircle className="w-3.5 h-3.5" /> Offline
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved
              </span>
            )}
          </div>

          {testId && (
            <Link to={`/admin/tests/${testId}/preview`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-foreground hover:bg-secondary text-xs font-semibold fox-shadow-sm transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Preview</span>
            </Link>
          )}

          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-card border border-border hover:bg-secondary text-foreground text-xs font-bold fox-shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5 text-primary" />
            <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
          </button>

          <button
            type="button"
            onClick={handlePublish}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold fox-shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Validate & Publish</span>
          </button>
        </div>
      </div>

      {/* Stepper Tabs */}
      <div className="flex items-center justify-between border-b border-border pb-3 overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max">
          {[
            { step: 1, label: '1. Basic Information' },
            { step: 2, label: '2. Sections & Passages' },
            { step: 3, label: '3. Questions & Answer Keys' },
          ].map((s) => (
            <button
              key={s.step}
              type="button"
              onClick={() => setCurrentStep(s.step as any)}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
                currentStep === s.step
                  ? 'bg-primary text-primary-foreground font-extrabold fox-shadow-sm'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* STEP 1: Basic Information */}
      {currentStep === 1 && (
        <div className="p-6 bg-card border border-border rounded-2xl fox-shadow-sm space-y-6 w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-foreground">
                Test Title <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Cambridge IELTS 19 — Academic Reading Test 1"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm font-semibold text-foreground focus:ring-2 focus:ring-primary focus:outline-hidden"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-foreground">URL Slug</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="cambridge-19-academic-reading-1"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs font-mono text-muted-foreground focus:ring-2 focus:ring-primary focus:outline-hidden"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-foreground">Skill / Module</label>
              <select
                value={skill}
                onChange={(e) => setSkill(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary focus:outline-hidden"
              >
                <option value="reading">Reading</option>
                <option value="listening">Listening</option>
                <option value="writing">Writing</option>
                <option value="speaking">Speaking</option>
                <option value="mock">Full Mock Exam</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-foreground flex items-center justify-between">
                <span>Practice Part / Scope</span>
                <span className="text-[10px] text-muted-foreground font-normal">Part 1, 2, 3 or Full</span>
              </label>
              <select
                value={practicePart}
                onChange={(e) => handlePracticePartChange(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary focus:outline-hidden"
              >
                <option value="full">Full Test (All Parts / Sections)</option>
                <option value="part_1">Part 1 (Section / Passage 1 Only)</option>
                <option value="part_2">Part 2 (Section / Passage 2 Only)</option>
                <option value="part_3">Part 3 (Section / Passage 3 Only)</option>
                <option value="part_4">Part 4 (Section 4 Only — Listening)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-foreground">IELTS Type</label>
              <select
                value={ieltsType}
                onChange={(e) => setIeltsType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary focus:outline-hidden"
              >
                <option value="academic">Academic IELTS</option>
                <option value="general_training">General Training</option>
                <option value="both">Both</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-foreground">Access Type</label>
              <select
                value={accessType}
                onChange={(e) => setAccessType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary focus:outline-hidden"
              >
                <option value="free">Free Access</option>
                <option value="premium">Premium Only (VIP)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-foreground">Difficulty Level</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary focus:outline-hidden"
              >
                <option value="easy">Easy (Band 4.5 - 5.5)</option>
                <option value="medium">Medium (Band 6.0 - 7.0)</option>
                <option value="hard">Hard (Band 7.5 - 9.0)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-foreground">Time Limit (Minutes)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value, 10) || 60)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-foreground">Tags (comma-separated)</label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Cambridge 19, Academic, Official, Biology"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-foreground">Test Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Brief summary of test topics, target band, and skill instructions..."
                className="w-full p-3.5 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-hidden resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-5 py-2.5 rounded-xl bg-primary text-black font-bold text-xs shadow-xs hover:bg-primary/90 transition-all cursor-pointer"
            >
              Continue to Sections →
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Sections & Passages */}
      {currentStep === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 p-4 bg-card border border-border rounded-2xl fox-shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Sections ({sections.length})
              </h3>
              <button
                type="button"
                onClick={addSection}
                className="p-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-amber-800 dark:text-primary text-xs font-bold flex items-center gap-1 px-2 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>

            <div className="space-y-1.5">
              {sections.map((sec, idx) => (
                <div
                  key={sec.id || idx}
                  className={cn(
                    'flex items-center justify-between p-2.5 rounded-xl text-left text-xs font-semibold transition-all border',
                    selectedSectionIndex === idx
                      ? 'bg-primary text-black border-primary font-bold shadow-xs'
                      : 'bg-background border-border text-foreground hover:bg-secondary'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedSectionIndex(idx)}
                    className="flex-1 text-left truncate cursor-pointer pr-2"
                  >
                    <span>{sec.title || `Section ${idx + 1}`}</span>
                  </button>
                  <div className="flex items-center gap-1 text-[10px]">
                    <span className="opacity-75">{sec.time_limit_minutes}m</span>
                    {sections.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteSection(idx)
                        }}
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                        title="Delete Section"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3 p-6 bg-card border border-border rounded-2xl fox-shadow-sm space-y-5">
            {sections[selectedSectionIndex] && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-foreground">Section Title</label>
                    <input
                      type="text"
                      value={sections[selectedSectionIndex].title}
                      onChange={(e) => {
                        const updated = [...sections]
                        updated[selectedSectionIndex].title = e.target.value
                        setSections(updated)
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-bold text-foreground"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-foreground">Duration (Minutes)</label>
                    <input
                      type="number"
                      value={sections[selectedSectionIndex].time_limit_minutes || 20}
                      onChange={(e) => {
                        const updated = [...sections]
                        updated[selectedSectionIndex].time_limit_minutes = parseInt(e.target.value, 10) || 20
                        setSections(updated)
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground"
                    />
                  </div>

                  {skill === 'listening' && (
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="block text-xs font-bold text-foreground">Listening Audio URL (MP3/WAV)</label>
                      <input
                        type="text"
                        value={sections[selectedSectionIndex].audio_url || ''}
                        onChange={(e) => {
                          const updated = [...sections]
                          updated[selectedSectionIndex].audio_url = e.target.value
                          setSections(updated)
                        }}
                        placeholder="https://.../listening_section_1.mp3"
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground"
                      />
                    </div>
                  )}

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="block text-xs font-bold text-foreground">Section Instructions</label>
                    <input
                      type="text"
                      value={sections[selectedSectionIndex].instructions || ''}
                      onChange={(e) => {
                        const updated = [...sections]
                        updated[selectedSectionIndex].instructions = e.target.value
                        setSections(updated)
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-foreground">
                      Reading Passage / Listening Transcript (Visual HTML Editor)
                    </label>
                    <span className="text-[11px] text-muted-foreground">Rich formatted HTML output</span>
                  </div>
                  <HtmlEditor
                    value={sections[selectedSectionIndex].passage_html || ''}
                    onChange={(html) => {
                      const updated = [...sections]
                      updated[selectedSectionIndex].passage_html = html
                      setSections(updated)
                    }}
                    placeholder="Enter reading passage text with title, paragraphs, and formatting..."
                    minHeight="320px"
                  />
                </div>
              </>
            )}

            <div className="flex justify-between pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2 rounded-xl border border-border text-foreground text-xs font-semibold hover:bg-secondary cursor-pointer"
              >
                ← Back to Basic Info
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-5 py-2.5 rounded-xl bg-primary text-black font-bold text-xs shadow-xs hover:bg-primary/90 transition-all cursor-pointer"
              >
                Continue to Questions →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Questions & Question Builder (Section-Centric Structure) */}
      {currentStep === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Sections List with Per-Section Question Adding */}
          <div className="lg:col-span-1 space-y-4">
            {/* Sections Accordion with Direct "+ Add Question to this Section" */}
            <div className="p-4 bg-card border border-border rounded-2xl fox-shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                  Sections & Questions ({questions.length} Total)
                </h3>
              </div>

              {/* Loop through each section */}
              <div className="space-y-3">
                {sections.map((sec, sIdx) => {
                  const sectionQs = questions
                    .map((q, idx) => ({ ...q, originalIndex: idx }))
                    .filter((q) => q.section_index === sIdx)

                  return (
                    <div
                      key={sec.id || sIdx}
                      className={cn(
                        'rounded-xl border p-3 transition-all space-y-2',
                        questionFilterSection === sIdx
                          ? 'border-primary/60 bg-primary/5 shadow-xs'
                          : 'border-border bg-background'
                      )}
                    >
                      {/* Section Header */}
                      <div className="flex items-center justify-between gap-1">
                        <button
                          type="button"
                          onClick={() => setQuestionFilterSection(questionFilterSection === sIdx ? 'all' : sIdx)}
                          className="flex items-center gap-1.5 text-left text-xs font-bold text-foreground hover:text-primary transition-colors cursor-pointer truncate"
                        >
                          <span className="w-5 h-5 rounded-md bg-secondary text-[10px] font-mono flex items-center justify-center font-bold">
                            {sIdx + 1}
                          </span>
                          <span className="truncate">{sec.title || `Section ${sIdx + 1}`}</span>
                          <span className="text-[10px] text-muted-foreground font-normal">
                            ({sectionQs.length} Qs)
                          </span>
                        </button>

                        {/* Direct "+ Add Question to This Section" Button */}
                        <button
                          type="button"
                          onClick={() => addQuestionToSection(sIdx, 'multiple_choice')}
                          className="px-2 py-1 rounded-lg bg-primary hover:bg-primary/90 text-black text-[11px] font-bold flex items-center gap-1 cursor-pointer flex-shrink-0"
                          title={`Add question directly to ${sec.title}`}
                        >
                          <Plus className="w-3 h-3" /> Add Q
                        </button>
                      </div>

                      {/* Number Badges for this section */}
                      {sectionQs.length > 0 ? (
                        <div className="grid grid-cols-6 gap-1 pt-1">
                          {sectionQs.map((q) => (
                            <button
                              key={q.id}
                              type="button"
                              onClick={() => setActiveQuestionIndex(q.originalIndex)}
                              className={cn(
                                'h-7 rounded-md text-xs font-black transition-all border flex items-center justify-center cursor-pointer',
                                activeQuestionIndex === q.originalIndex
                                  ? 'bg-primary text-black border-primary font-black scale-105 shadow-2xs'
                                  : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
                              )}
                            >
                              {q.question_number}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-muted-foreground italic pt-1">
                          No questions in this section yet. Click "+ Add Q" above.
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Actions: Reorder / Duplicate / Delete */}
              <div className="flex items-center gap-1.5 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => moveQuestion('up')}
                  disabled={activeQuestionIndex === 0}
                  className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 cursor-pointer"
                  title="Move Question Up"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveQuestion('down')}
                  disabled={activeQuestionIndex === questions.length - 1}
                  className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 cursor-pointer"
                  title="Move Question Down"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={duplicateActiveQuestion}
                  className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-secondary cursor-pointer"
                >
                  <Copy className="w-3 h-3" /> Duplicate
                </button>
                <button
                  type="button"
                  onClick={deleteActiveQuestion}
                  className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg border border-destructive/30 text-xs font-semibold text-destructive hover:bg-destructive/10 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </div>

            {/* Quick Add Specific Type to Active Section */}
            <div className="p-4 bg-secondary/30 border border-border rounded-2xl space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Quick Add Question to Section {activeQ.section_index + 1}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'Multiple Choice', type: 'multiple_choice' },
                  { label: 'Multiple Select', type: 'multiple_response' },
                  { label: 'True/False/NG', type: 'true_false_not_given' },
                  { label: 'Yes/No/NG', type: 'yes_no_not_given' },
                  { label: 'Headings', type: 'matching_headings' },
                  { label: 'Match Info', type: 'matching_information' },
                  { label: 'Match Features', type: 'matching_features' },
                  { label: 'Sentence Endings', type: 'matching_sentence_endings' },
                  { label: 'Sentence Comp', type: 'sentence_completion' },
                  { label: 'Summary Comp', type: 'summary_completion' },
                  { label: 'Table Comp', type: 'table_completion' },
                  { label: 'Short Answer', type: 'short_answer' },
                  { label: 'Diagram Label', type: 'diagram_label_completion' },
                ].map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => addQuestionToSection(activeQ.section_index, item.type)}
                    className="px-2 py-1 bg-card hover:bg-primary/20 border border-border rounded-md text-[10px] font-semibold text-foreground transition-colors cursor-pointer"
                  >
                    + {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Question Editor Form & Live Preview */}
          <div className="lg:col-span-2 space-y-6">
            {activeQ && (
              <div className="p-6 bg-card border border-border rounded-2xl fox-shadow-sm space-y-5">
                {/* Header of Question Editor */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-primary text-black font-black text-xs flex items-center justify-center">
                      #{activeQ.question_number}
                    </span>
                    <div>
                      <span className="text-xs font-bold text-foreground block">
                        Question #{activeQ.question_number} Editor
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Belongs to: <strong>{sections[activeQ.section_index]?.title || `Section ${activeQ.section_index + 1}`}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Section Assignment & Type Selector */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-muted-foreground font-semibold">Section:</span>
                      <select
                        value={activeQ.section_index}
                        onChange={(e) => updateActiveQuestion({ section_index: parseInt(e.target.value, 10) })}
                        className="px-2.5 py-1.5 rounded-xl border border-border bg-background text-xs font-semibold text-foreground"
                      >
                        {sections.map((sec, idx) => (
                          <option key={sec.id || idx} value={idx}>
                            {sec.title || `Section ${idx + 1}`}
                          </option>
                        ))}
                      </select>
                    </div>

                    <select
                      value={activeQ.question_type}
                      onChange={(e) => handleTypeChange(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-border bg-background text-xs font-bold text-foreground focus:ring-2 focus:ring-primary"
                    >
                      {QUESTION_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Instruction */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-foreground">Instruction Banner</label>
                    {(activeQ.question_type.includes('completion') || activeQ.question_type === 'short_answer') && (
                      <div className="flex items-center gap-1 text-[10px]">
                        <span className="text-muted-foreground">Presets:</span>
                        {[
                          'ONE WORD ONLY',
                          'NO MORE THAN TWO WORDS',
                          'NO MORE THAN TWO WORDS AND/OR A NUMBER',
                          'NO MORE THAN THREE WORDS',
                        ].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() =>
                              updateActiveQuestion({
                                instruction: `Choose ${preset} from the passage for each answer.`,
                              })
                            }
                            className="px-1.5 py-0.5 rounded bg-secondary hover:bg-primary/20 text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <input
                    type="text"
                    value={activeQ.instruction || ''}
                    onChange={(e) => updateActiveQuestion({ instruction: e.target.value })}
                    placeholder="e.g. Choose the correct letter, A, B, C or D."
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground"
                  />
                </div>

                {/* Question Text */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-foreground">Question Text / Sentence</label>
                  <textarea
                    value={activeQ.question_text}
                    onChange={(e) => updateActiveQuestion({ question_text: e.target.value })}
                    rows={3}
                    placeholder="Enter question text or sentence with blank..."
                    className="w-full p-3 rounded-xl border border-border bg-background text-xs text-foreground resize-none leading-relaxed"
                  />
                </div>

                {/* Optional Image URL */}
                {(activeQ.question_type.includes('diagram') || activeQ.question_type.startsWith('writing_task')) && (
                  <div className="space-y-1.5 p-3 rounded-xl bg-secondary/30 border border-border">
                    <label className="block text-xs font-bold text-foreground flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5" /> Diagram / Visual Image URL
                    </label>
                    <input
                      type="text"
                      value={activeQ.image_url || ''}
                      onChange={(e) => updateActiveQuestion({ image_url: e.target.value })}
                      placeholder="https://.../chart_or_diagram.png"
                      className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground"
                    />
                  </div>
                )}

                {/* 1. Multiple Choice Options */}
                {activeQ.question_type === 'multiple_choice' && (
                  <div className="space-y-2.5 pt-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-foreground">
                        Options & Single Correct Answer
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const currentOpts = activeQ.options || []
                          const nextKey = String.fromCharCode(65 + currentOpts.length)
                          updateActiveQuestion({
                            options: [
                              ...currentOpts,
                              { option_key: nextKey, option_text: `Option ${nextKey}`, is_correct: false },
                            ],
                          })
                        }}
                        className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Add Option
                      </button>
                    </div>

                    {(activeQ.options || []).map((opt: any, optIdx: number) => {
                      const isCorrect = activeQ.correct_answer === opt.option_key
                      return (
                        <div key={opt.option_key || optIdx} className="flex items-center gap-2">
                          <span className="w-6 text-xs font-bold text-muted-foreground text-center">
                            {opt.option_key}.
                          </span>
                          <input
                            type="text"
                            value={opt.option_text}
                            onChange={(e) => {
                              const newOpts = [...(activeQ.options || [])]
                              newOpts[optIdx].option_text = e.target.value
                              updateActiveQuestion({ options: newOpts })
                            }}
                            className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newOpts = (activeQ.options || []).map((o: any) => ({
                                ...o,
                                is_correct: o.option_key === opt.option_key,
                              }))
                              updateActiveQuestion({
                                options: newOpts,
                                correct_answer: opt.option_key,
                              })
                            }}
                            className={cn(
                              'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border',
                              isCorrect
                                ? 'bg-black text-white dark:bg-white dark:text-black border-black shadow-2xs'
                                : 'bg-background border-border text-muted-foreground hover:bg-secondary'
                            )}
                          >
                            {isCorrect ? '✓ Correct Answer' : 'Mark Correct'}
                          </button>
                          {(activeQ.options || []).length > 2 && (
                            <button
                              type="button"
                              onClick={() => {
                                const newOpts = (activeQ.options || []).filter((_: any, i: number) => i !== optIdx)
                                updateActiveQuestion({ options: newOpts })
                              }}
                              className="p-1 text-muted-foreground hover:text-destructive cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* 2. Multiple Response Options */}
                {activeQ.question_type === 'multiple_response' && (
                  <div className="space-y-2.5 pt-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-foreground">
                        Options & Multiple Correct Answers
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const currentOpts = activeQ.options || []
                          const nextKey = String.fromCharCode(65 + currentOpts.length)
                          updateActiveQuestion({
                            options: [
                              ...currentOpts,
                              { option_key: nextKey, option_text: `Option ${nextKey}`, is_correct: false },
                            ],
                          })
                        }}
                        className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Add Option
                      </button>
                    </div>

                    {(activeQ.options || []).map((opt: any, optIdx: number) => {
                      const isCorrect = !!opt.is_correct
                      return (
                        <div key={opt.option_key || optIdx} className="flex items-center gap-2">
                          <span className="w-6 text-xs font-bold text-muted-foreground text-center">
                            {opt.option_key}.
                          </span>
                          <input
                            type="text"
                            value={opt.option_text}
                            onChange={(e) => {
                              const newOpts = [...(activeQ.options || [])]
                              newOpts[optIdx].option_text = e.target.value
                              updateActiveQuestion({ options: newOpts })
                            }}
                            className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newOpts = [...(activeQ.options || [])]
                              newOpts[optIdx].is_correct = !newOpts[optIdx].is_correct
                              const correctKeys = newOpts.filter((o) => o.is_correct).map((o) => o.option_key)
                              updateActiveQuestion({
                                options: newOpts,
                                correct_answer: correctKeys.join(', '),
                                accepted_answers: correctKeys,
                              })
                            }}
                            className={cn(
                              'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border',
                              isCorrect
                                ? 'bg-black text-white dark:bg-white dark:text-black border-black shadow-2xs'
                                : 'bg-background border-border text-muted-foreground hover:bg-secondary'
                            )}
                          >
                            {isCorrect ? '✓ Correct' : 'Mark Correct'}
                          </button>
                          {(activeQ.options || []).length > 2 && (
                            <button
                              type="button"
                              onClick={() => {
                                const newOpts = (activeQ.options || []).filter((_: any, i: number) => i !== optIdx)
                                updateActiveQuestion({ options: newOpts })
                              }}
                              className="p-1 text-muted-foreground hover:text-destructive cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* 3. True / False / Not Given Selector */}
                {activeQ.question_type === 'true_false_not_given' && (
                  <div className="space-y-2 pt-2">
                    <label className="block text-xs font-bold text-foreground">Select Correct Answer</label>
                    <div className="flex gap-2">
                      {['TRUE', 'FALSE', 'NOT GIVEN'].map((val) => {
                        const isSelected = (activeQ.correct_answer || '').toUpperCase() === val
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => updateActiveQuestion({ correct_answer: val })}
                            className={cn(
                              'flex-1 py-2.5 rounded-xl text-xs font-black transition-all border cursor-pointer',
                              isSelected
                                ? val === 'TRUE'
                                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                                  : val === 'FALSE'
                                  ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                                  : 'bg-black text-white dark:bg-white dark:text-black border-black shadow-xs'
                                : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
                            )}
                          >
                            {val}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* 4. Yes / No / Not Given Selector */}
                {activeQ.question_type === 'yes_no_not_given' && (
                  <div className="space-y-2 pt-2">
                    <label className="block text-xs font-bold text-foreground">Select Correct Answer</label>
                    <div className="flex gap-2">
                      {['YES', 'NO', 'NOT GIVEN'].map((val) => {
                        const isSelected = (activeQ.correct_answer || '').toUpperCase() === val
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => updateActiveQuestion({ correct_answer: val })}
                            className={cn(
                              'flex-1 py-2.5 rounded-xl text-xs font-black transition-all border cursor-pointer',
                              isSelected
                                ? val === 'YES'
                                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                                  : val === 'NO'
                                  ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                                  : 'bg-black text-white dark:bg-white dark:text-black border-black shadow-xs'
                                : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
                            )}
                          >
                            {val}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* 5. Matching Headings Builder */}
                {activeQ.question_type === 'matching_headings' && (
                  <div className="space-y-4 pt-2">

                    {/* Headings list */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-foreground">
                          List of Headings (Roman Numerals)
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const currentHeadings = activeQ.metadata?.headings || []
                            const romanNumerals = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi', 'xii']
                            const nextKey = romanNumerals[currentHeadings.length] || `h${currentHeadings.length + 1}`
                            updateActiveQuestion({
                              metadata: { ...activeQ.metadata, headings: [...currentHeadings, { key: nextKey, text: `Heading ${nextKey} description` }] },
                            })
                          }}
                          className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> Add Heading
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        {(activeQ.metadata?.headings || []).map((h: any, hIdx: number) => (
                          <div key={h.key || hIdx} className="flex items-center gap-2">
                            <span className="w-9 text-xs font-mono font-bold text-muted-foreground text-center flex-shrink-0">
                              {h.key}.
                            </span>
                            <input
                              type="text"
                              value={h.text}
                              onChange={(e) => {
                                const newHeadings = [...(activeQ.metadata?.headings || [])]
                                newHeadings[hIdx].text = e.target.value
                                updateActiveQuestion({ metadata: { ...activeQ.metadata, headings: newHeadings } })
                              }}
                              className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground"
                            />
                            {(activeQ.metadata?.headings || []).length > 2 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newHeadings = (activeQ.metadata?.headings || []).filter((_: any, i: number) => i !== hIdx)
                                  updateActiveQuestion({ metadata: { ...activeQ.metadata, headings: newHeadings } })
                                }}
                                className="p-1 text-muted-foreground hover:text-destructive cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Paragraphs sub-questions */}
                    <div className="space-y-2 border-t border-border pt-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-foreground">
                          Paragraphs (Sub-questions)
                          <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">
                            — Each paragraph selects from headings above
                          </span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const currentParas = activeQ.metadata?.paragraphs || []
                            const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
                            const nextKey = letters[currentParas.length] || `P${currentParas.length + 1}`
                            updateActiveQuestion({
                              metadata: { ...activeQ.metadata, paragraphs: [...currentParas, { key: nextKey, label: `Paragraph ${nextKey}` }] },
                            })
                          }}
                          className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> Add Paragraph
                        </button>
                      </div>

                      {(activeQ.metadata?.paragraphs || []).length === 0 ? (
                        <div className="p-3 rounded-xl border border-dashed border-border text-xs text-muted-foreground text-center">
                          No paragraphs yet. Click "+ Add Paragraph" to add sub-questions (e.g. Paragraph A, B, C…).<br />
                          <span className="text-[10px]">Without paragraphs, this question works as a single-answer question.</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {/* Parse correct_answer object */}
                          {(() => {
                            let correctAnswers: Record<string, string> = {}
                            try {
                              correctAnswers = typeof activeQ.correct_answer === 'string' && activeQ.correct_answer.startsWith('{')
                                ? JSON.parse(activeQ.correct_answer)
                                : (typeof activeQ.correct_answer === 'object' && activeQ.correct_answer ? activeQ.correct_answer : {})
                            } catch { correctAnswers = {} }

                            return (activeQ.metadata?.paragraphs || []).map((para: any, pIdx: number) => (
                              <div key={para.key || pIdx} className="flex items-center gap-2">
                                {/* Paragraph label */}
                                <input
                                  type="text"
                                  value={para.label || `Paragraph ${para.key}`}
                                  onChange={(e) => {
                                    const newParas = [...(activeQ.metadata?.paragraphs || [])]
                                    newParas[pIdx].label = e.target.value
                                    updateActiveQuestion({ metadata: { ...activeQ.metadata, paragraphs: newParas } })
                                  }}
                                  className="w-32 flex-shrink-0 px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs font-semibold text-foreground"
                                  placeholder={`Paragraph ${para.key}`}
                                />
                                {/* Correct heading selector */}
                                <select
                                  value={correctAnswers[para.key] || ''}
                                  onChange={(e) => {
                                    const updated = { ...correctAnswers, [para.key]: e.target.value }
                                    updateActiveQuestion({ correct_answer: JSON.stringify(updated) })
                                  }}
                                  className="flex-1 px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground"
                                >
                                  <option value="">— Correct heading —</option>
                                  {(activeQ.metadata?.headings || []).map((h: any) => (
                                    <option key={h.key} value={h.key}>{h.key}. {h.text}</option>
                                  ))}
                                </select>
                                {/* Mark correct badge */}
                                {correctAnswers[para.key] && (
                                  <span className="text-[10px] font-bold text-emerald-600 flex-shrink-0">✓ {correctAnswers[para.key]}</span>
                                )}
                                {/* Remove paragraph */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newParas = (activeQ.metadata?.paragraphs || []).filter((_: any, i: number) => i !== pIdx)
                                    const updated = { ...correctAnswers }
                                    delete updated[para.key]
                                    updateActiveQuestion({
                                      metadata: { ...activeQ.metadata, paragraphs: newParas },
                                      correct_answer: JSON.stringify(updated),
                                    })
                                  }}
                                  className="p-1 text-muted-foreground hover:text-destructive cursor-pointer flex-shrink-0"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))
                          })()}
                        </div>
                      )}
                    </div>

                    {/* Single-paragraph correct answer (when no paragraphs defined) */}
                    {(activeQ.metadata?.paragraphs || []).length === 0 && (
                      <div className="space-y-2 border-t border-border pt-3">
                        <label className="block text-xs font-bold text-foreground">Correct Heading (Single answer)</label>
                        <div className="flex flex-wrap gap-1.5">
                          {(activeQ.metadata?.headings || []).map((h: any) => {
                            const isCorrect = activeQ.correct_answer === h.key
                            return (
                              <button
                                key={h.key}
                                type="button"
                                onClick={() => updateActiveQuestion({ correct_answer: h.key })}
                                className={cn(
                                  'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border',
                                  isCorrect
                                    ? 'bg-black text-white dark:bg-white dark:text-black border-black shadow-xs'
                                    : 'bg-background border-border text-muted-foreground hover:bg-secondary'
                                )}
                              >
                                {isCorrect ? '✓ ' : ''}{h.key}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}


                {/* 6. Matching Questions (matching_features, matching_sentence_endings, matching_information) & Summary Word Bank */}
                {(['matching_features', 'matching_sentence_endings', 'matching_information'].includes(activeQ.question_type) ||
                  (activeQ.question_type === 'summary_completion' && activeQ.metadata?.use_word_bank)) && (
                  <div className="space-y-4 pt-3 border-t border-border mt-3">
                    {/* Header bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-secondary/40 p-3 rounded-xl border border-border">
                      <div>
                        <label className="block text-xs font-bold text-foreground flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-primary" />
                          Option Reference / Matching Items
                          <span className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">
                            {((activeQ.options && activeQ.options.length > 0)
                              ? activeQ.options
                              : (activeQ.metadata?.options && activeQ.metadata.options.length > 0)
                              ? activeQ.metadata.options
                              : []).length} items
                          </span>
                        </label>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Define the reference options (e.g. List of Researchers, Sentence Endings, Paragraphs A–G).
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* 1-Click Sync to Section */}
                        <button
                          type="button"
                          onClick={syncReferenceToSection}
                          title="Replicate these exact reference options across all matching questions in this section"
                          className="px-2.5 py-1.5 rounded-lg bg-card hover:bg-secondary border border-border text-[11px] font-semibold text-foreground flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                        >
                          <Copy className="w-3 h-3 text-primary" />
                          <span>Sync to Section</span>
                        </button>

                        {/* Add Option Button */}
                        <button
                          type="button"
                          onClick={() => {
                            const currentOpts = activeQ.options && activeQ.options.length > 0
                              ? [...activeQ.options]
                              : (activeQ.metadata?.options && activeQ.metadata.options.length > 0)
                              ? [...activeQ.metadata.options]
                              : []
                            const nextKey = String.fromCharCode(65 + currentOpts.length)
                            const newOpts = [
                              ...currentOpts,
                              { option_key: nextKey, option_text: '', is_correct: false },
                            ]
                            updateActiveQuestion({
                              options: newOpts,
                              metadata: {
                                ...(activeQ.metadata || {}),
                                options: newOpts,
                              },
                            })
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-primary text-black text-[11px] font-bold flex items-center gap-1 cursor-pointer hover:brightness-105 transition-all shadow-2xs"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Option</span>
                        </button>
                      </div>
                    </div>

                    {/* Reference Box Header Title */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-foreground flex items-center justify-between">
                        <span>Reference Box Header Title</span>
                        <span className="text-[10px] font-normal text-muted-foreground">
                          Shown above reference options table for students
                        </span>
                      </label>
                      <input
                        type="text"
                        value={activeQ.metadata?.options_title || ''}
                        onChange={(e) => {
                          const val = e.target.value
                          updateActiveQuestion({
                            metadata: {
                              ...(activeQ.metadata || {}),
                              options_title: val,
                            },
                          })
                        }}
                        placeholder={
                          activeQ.question_type === 'matching_features'
                            ? 'e.g. List of Researchers / People'
                            : activeQ.question_type === 'matching_sentence_endings'
                            ? 'e.g. Sentence Endings'
                            : activeQ.question_type === 'matching_information'
                            ? 'e.g. Paragraphs A–G'
                            : 'e.g. List of Words / Word Bank'
                        }
                        className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    {/* Presets Row */}
                    <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                      <span className="text-muted-foreground font-medium text-[10px]">Quick Presets:</span>
                      {[
                        {
                          label: 'Researchers (A–D)',
                          opts: [
                            { option_key: 'A', option_text: 'Dr. Richard Dawkins', is_correct: true },
                            { option_key: 'B', option_text: 'Prof. Jane Goodall', is_correct: false },
                            { option_key: 'C', option_text: 'Sir David Attenborough', is_correct: false },
                            { option_key: 'D', option_text: 'Charles Darwin', is_correct: false },
                          ],
                          title: 'List of Researchers',
                        },
                        {
                          label: 'Sentence Endings (A–E)',
                          opts: [
                            { option_key: 'A', option_text: 'was constructed during the late Roman Empire.', is_correct: true },
                            { option_key: 'B', option_text: 'experienced a significant demographic decline.', is_correct: false },
                            { option_key: 'C', option_text: 'resulted in comprehensive architectural reforms.', is_correct: false },
                            { option_key: 'D', option_text: 'prompted the development of regional transport links.', is_correct: false },
                            { option_key: 'E', option_text: 'demonstrated unprecedented economic sustainability.', is_correct: false },
                          ],
                          title: 'Sentence Endings',
                        },
                        {
                          label: 'Paragraphs (A–G)',
                          opts: ['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((p, idx) => ({
                            option_key: p,
                            option_text: `Paragraph ${p}`,
                            is_correct: idx === 0,
                          })),
                          title: 'Paragraphs',
                        },
                        {
                          label: 'Word Bank (A–F)',
                          opts: [
                            { option_key: 'A', option_text: 'agricultural', is_correct: true },
                            { option_key: 'B', option_text: 'commercial', is_correct: false },
                            { option_key: 'C', option_text: 'environmental', is_correct: false },
                            { option_key: 'D', option_text: 'financial', is_correct: false },
                            { option_key: 'E', option_text: 'industrial', is_correct: false },
                            { option_key: 'F', option_text: 'residential', is_correct: false },
                          ],
                          title: 'Word Bank',
                        },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            updateActiveQuestion({
                              options: preset.opts,
                              correct_answer: preset.opts[0].option_key,
                              metadata: {
                                ...(activeQ.metadata || {}),
                                options: preset.opts,
                                options_title: preset.title,
                              },
                            })
                          }}
                          className="px-2 py-0.5 rounded bg-secondary hover:bg-primary/20 text-muted-foreground hover:text-foreground border border-border cursor-pointer transition-colors text-[10px]"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    {/* Options Rows */}
                    <div className="space-y-2">
                      {(() => {
                        const currentOpts = activeQ.options && activeQ.options.length > 0
                          ? activeQ.options
                          : (activeQ.metadata?.options && activeQ.metadata.options.length > 0)
                          ? activeQ.metadata.options
                          : [
                              { option_key: 'A', option_text: 'Option A description', is_correct: true },
                              { option_key: 'B', option_text: 'Option B description', is_correct: false },
                              { option_key: 'C', option_text: 'Option C description', is_correct: false },
                            ]

                        return currentOpts.map((opt: any, optIdx: number) => {
                          const isCorrect = (activeQ.correct_answer || '').trim().toUpperCase() === opt.option_key
                          return (
                            <div
                              key={opt.option_key || optIdx}
                              className={cn(
                                'flex items-center gap-2 p-2 rounded-xl border transition-all',
                                isCorrect ? 'bg-primary/5 border-primary/40' : 'bg-background border-border'
                              )}
                            >
                              <span className="w-7 h-7 rounded-lg bg-secondary text-foreground font-black text-xs flex items-center justify-center shrink-0 border border-border">
                                {opt.option_key}
                              </span>

                              <input
                                type="text"
                                value={opt.option_text || ''}
                                onChange={(e) => {
                                  const newOpts = [...currentOpts]
                                  newOpts[optIdx] = { ...newOpts[optIdx], option_text: e.target.value }
                                  updateActiveQuestion({
                                    options: newOpts,
                                    metadata: {
                                      ...(activeQ.metadata || {}),
                                      options: newOpts,
                                    },
                                  })
                                }}
                                placeholder={`Option ${opt.option_key} description / text...`}
                                className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground focus:ring-1 focus:ring-primary"
                              />

                              <button
                                type="button"
                                onClick={() => {
                                  const newOpts = currentOpts.map((o: any) => ({
                                    ...o,
                                    is_correct: o.option_key === opt.option_key,
                                  }))
                                  updateActiveQuestion({
                                    options: newOpts,
                                    correct_answer: opt.option_key,
                                    metadata: {
                                      ...(activeQ.metadata || {}),
                                      options: newOpts,
                                    },
                                  })
                                }}
                                className={cn(
                                  'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border shrink-0',
                                  isCorrect
                                    ? 'bg-black text-white dark:bg-white dark:text-black border-black shadow-2xs'
                                    : 'bg-background border-border text-muted-foreground hover:bg-secondary hover:text-foreground'
                                )}
                              >
                                {isCorrect ? '✓ Correct Answer' : 'Mark Correct'}
                              </button>

                              {currentOpts.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const filtered = currentOpts.filter((_: any, i: number) => i !== optIdx)
                                    const newOpts = filtered.map((o: any, i: number) => ({
                                      ...o,
                                      option_key: String.fromCharCode(65 + i),
                                    }))
                                    let newCorrect = activeQ.correct_answer
                                    if (newCorrect === opt.option_key || !newOpts.some((o: any) => o.option_key === newCorrect)) {
                                      newCorrect = newOpts[0]?.option_key || 'A'
                                    }
                                    updateActiveQuestion({
                                      options: newOpts,
                                      correct_answer: newCorrect,
                                      metadata: {
                                        ...(activeQ.metadata || {}),
                                        options: newOpts,
                                      },
                                    })
                                  }}
                                  className="p-1.5 text-muted-foreground hover:text-destructive cursor-pointer shrink-0 rounded-lg hover:bg-destructive/10 transition-colors"
                                  title="Remove option"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )
                        })
                      })()}
                    </div>

                    {/* Quick Answer Selector Pills */}
                    <div className="space-y-1.5 pt-2 border-t border-border">
                      <label className="block text-xs font-bold text-foreground flex items-center justify-between">
                        <span>Select Correct Letter for Question #{activeQ.question_number}:</span>
                        <span className="text-[11px] font-mono text-primary font-bold">
                          {activeQ.correct_answer ? `Selected: ${activeQ.correct_answer}` : 'None'}
                        </span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {((activeQ.options && activeQ.options.length > 0)
                          ? activeQ.options
                          : (activeQ.metadata?.options && activeQ.metadata.options.length > 0)
                          ? activeQ.metadata.options
                          : ['A', 'B', 'C', 'D'].map(k => ({ option_key: k, option_text: '' }))
                        ).map((opt: any) => {
                          const key = opt.option_key
                          const isSelected = (activeQ.correct_answer || '').trim().toUpperCase() === key
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => {
                                const currentOpts = activeQ.options || activeQ.metadata?.options || []
                                const newOpts = currentOpts.map((o: any) => ({
                                  ...o,
                                  is_correct: o.option_key === key,
                                }))
                                updateActiveQuestion({
                                  correct_answer: key,
                                  options: newOpts,
                                  metadata: {
                                    ...(activeQ.metadata || {}),
                                    options: newOpts,
                                  },
                                })
                              }}
                              className={cn(
                                'min-w-10 h-10 px-3 rounded-xl text-xs font-black transition-all border cursor-pointer flex items-center justify-center gap-1.5',
                                isSelected
                                  ? 'bg-black text-white dark:bg-white dark:text-black border-black shadow-xs scale-105'
                                  : 'bg-background border-border text-foreground hover:bg-secondary'
                              )}
                            >
                              <span>{key}</span>
                              {isSelected && <Check className="w-3.5 h-3.5" />}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Summary Completion Word Bank Toggle */}
                {activeQ.question_type === 'summary_completion' && (
                  <div className="p-3 bg-secondary/30 rounded-xl border border-border flex items-center justify-between mt-2">
                    <div>
                      <span className="text-xs font-bold text-foreground block">Question Format</span>
                      <span className="text-[11px] text-muted-foreground">
                        Choose between text blanks from passage or selecting from a Word Bank (A–G).
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          updateActiveQuestion({
                            metadata: { ...(activeQ.metadata || {}), use_word_bank: false },
                          })
                        }}
                        className={cn(
                          'px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer border',
                          !activeQ.metadata?.use_word_bank
                            ? 'bg-foreground text-background border-foreground font-bold shadow-2xs'
                            : 'bg-card border-border text-muted-foreground hover:bg-secondary'
                        )}
                      >
                        Passage Blanks
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const defaultWordBank = [
                            { option_key: 'A', option_text: 'agricultural', is_correct: true },
                            { option_key: 'B', option_text: 'commercial', is_correct: false },
                            { option_key: 'C', option_text: 'environmental', is_correct: false },
                            { option_key: 'D', option_text: 'financial', is_correct: false },
                            { option_key: 'E', option_text: 'industrial', is_correct: false },
                          ]
                          updateActiveQuestion({
                            correct_answer: 'A',
                            options: activeQ.options && activeQ.options.length > 0 ? activeQ.options : defaultWordBank,
                            metadata: {
                              ...(activeQ.metadata || {}),
                              use_word_bank: true,
                              options_title: activeQ.metadata?.options_title || 'List of Words / Word Bank',
                              options: activeQ.options && activeQ.options.length > 0 ? activeQ.options : defaultWordBank,
                            },
                          })
                        }}
                        className={cn(
                          'px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer border',
                          activeQ.metadata?.use_word_bank
                            ? 'bg-foreground text-background border-foreground font-bold shadow-2xs'
                            : 'bg-card border-border text-muted-foreground hover:bg-secondary'
                        )}
                      >
                        Word Bank (A–G)
                      </button>
                    </div>
                  </div>
                )}

                {/* Completion & Short Answer Fields */}
                {(activeQ.question_type.includes('completion') ||
                  activeQ.question_type === 'short_answer' ||
                  activeQ.question_type.startsWith('writing_task') ||
                  activeQ.question_type.startsWith('speaking')) &&
                  !(activeQ.question_type === 'summary_completion' && activeQ.metadata?.use_word_bank) && (
                  <div className="space-y-3 pt-1">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-foreground">
                        Primary Correct Answer (Case-insensitive)
                      </label>
                      <input
                        type="text"
                        value={activeQ.correct_answer || ''}
                        onChange={(e) => updateActiveQuestion({ correct_answer: e.target.value })}
                        placeholder="e.g. Roman Empire (slashes like 'suburbs / countryside' also accepted)"
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-mono text-foreground"
                      />
                    </div>

                    {/* Accepted Alternative Answers */}
                    {!activeQ.question_type.startsWith('writing_task') && !activeQ.question_type.startsWith('speaking') && (
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-foreground">
                          Accepted Alternative Answers <span className="text-[10px] font-normal text-muted-foreground">(comma-separated)</span>
                        </label>
                        <input
                          type="text"
                          value={
                            Array.isArray(activeQ.accepted_answers)
                              ? activeQ.accepted_answers.join(', ')
                              : (activeQ.accepted_answers || '')
                          }
                          onChange={(e) => {
                            const val = e.target.value
                            const arr = val.split(',').map((s) => s.trim()).filter(Boolean)
                            updateActiveQuestion({ accepted_answers: arr })
                          }}
                          placeholder="e.g. rural area, outskirts, 10, ten"
                          className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-mono text-foreground"
                        />
                      </div>
                    )}

                    {/* IELTS Grader smart rules tip badge */}
                    <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/20 text-[11px] text-muted-foreground flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-foreground font-semibold">IELTS Smart Verification:</strong> Grader automatically accepts UK/US spelling (<em>colour/color, centre/center</em>), numbers vs words (<em>two/2</em>), optional articles (<em>the internet / internet</em>), and slash variants (<em>A / B</em>).
                      </span>
                    </div>
                  </div>
                )}

                {/* Explanation */}
                <div className="space-y-1 pt-1">
                  <label className="block text-xs font-bold text-foreground">
                    Explanation / Answer Rationale
                  </label>
                  <textarea
                    value={activeQ.explanation || ''}
                    onChange={(e) => updateActiveQuestion({ explanation: e.target.value })}
                    rows={2}
                    placeholder="Explanation linking answer to passage paragraph or line..."
                    className="w-full p-3 rounded-xl border border-border bg-background text-xs text-foreground resize-none leading-relaxed"
                  />
                </div>

                {/* Live Student Render Preview */}
                <div className="pt-4 border-t border-border">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                    Live Question Preview (Interactive Student View)
                  </span>
                  <div className="border border-border rounded-xl p-3 bg-secondary/10">
                    <QuestionRenderer
                      question={activeQ}
                      answer={activeQ.correct_answer}
                      onChange={() => {}}
                      showExplanation={true}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* HTML Import Modal inside TestBuilder */}
      {showHtmlModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-border space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Import Test from HTML</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHtmlModal(false)}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Paste HTML code or select an HTML file below. The parser will extract test titles, reading passages, sections, and questions directly into this test.
            </p>

            <textarea
              value={htmlModalInput}
              onChange={(e) => setHtmlModalInput(e.target.value)}
              rows={8}
              placeholder="Paste <html><body>...</body></html> here..."
              className="w-full p-3 rounded-xl border border-border bg-background font-mono text-xs text-foreground resize-none focus:ring-2 focus:ring-primary focus:outline-hidden"
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setShowHtmlModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-foreground hover:bg-secondary cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleHtmlModalImport}
                disabled={!htmlModalInput.trim()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-primary text-black hover:bg-primary/90 cursor-pointer disabled:opacity-50"
              >
                Extract & Populate Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
           BULK PASTE QUESTIONS MODAL
           ================================================================ */}
      {showBulkPasteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-border space-y-4 animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">

            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <ClipboardPaste className="w-4.5 h-4.5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Bulk Paste Questions</h3>
                  <p className="text-[11px] text-muted-foreground">Automatically import all 20 IELTS question types</p>
                </div>
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold border border-primary/20">
                  {questions.length} existing + new
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowBulkPasteModal(false)}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Format Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-secondary rounded-xl w-fit">
              <button
                type="button"
                onClick={() => { setBulkPasteTab('json'); setBulkPastePreview(null); setBulkPasteErrors([]) }}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                  bulkPasteTab === 'json'
                    ? 'bg-card text-foreground shadow-sm border border-border'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {'{ }'} JSON Format
              </button>
              <button
                type="button"
                onClick={() => { setBulkPasteTab('text'); setBulkPastePreview(null); setBulkPasteErrors([]) }}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                  bulkPasteTab === 'text'
                    ? 'bg-card text-foreground shadow-sm border border-border'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                📝 Quick Text
              </button>
            </div>

            {/* Format Example */}
            <div className="p-3.5 bg-secondary/50 border border-border rounded-xl space-y-2">
              <p className="text-[11px] font-bold text-muted-foreground">
                {bulkPasteTab === 'json' ? '📋 JSON Format Example:' : '📝 Quick Text Format Example:'}
              </p>
              {bulkPasteTab === 'json' ? (
                <pre className="text-[10px] text-foreground font-mono leading-relaxed overflow-x-auto bg-background rounded-lg p-2 border border-border whitespace-pre-wrap">{
`[\n  { "type": "multiple_choice", "question": "What is the main idea?",\n    "options": ["Option A", "Option B", "Option C", "Option D"], "answer": "B" },\n  { "type": "true_false_not_given", "question": "Technology is harmful.", "answer": "FALSE" },\n  { "type": "sentence_completion", "question": "The scientist found _____.", "answer": "evidence" },\n  { "type": "matching_headings", "question": "Paragraph A discusses _____.", "answer": "i" }\n]`
                }</pre>
              ) : (
                <pre className="text-[10px] text-foreground font-mono leading-relaxed bg-background rounded-lg p-2 border border-border whitespace-pre-wrap">{
`Q1. [multiple_choice] What is the main idea?\nA. Historical background\nB. Key discovery  \nC. Economic analysis\nD. Future predictions\nANSWER: B\n\nQ2. [true_false_not_given] Technology is always harmful.\nANSWER: FALSE\n\nQ3. [sentence_completion] The scientist found _____ in the lab.\nANSWER: evidence\n\nQ4. [yes_no_not_given] The author supports renewable energy.\nANSWER: YES`
                }</pre>
              )}

              {/* Supported types accordion */}
              <details className="mt-1">
                <summary className="text-[10px] font-bold text-primary cursor-pointer select-none hover:opacity-80">
                  📚 All 20 Supported Question Types ▾
                </summary>
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-0.5">
                  {QUESTION_TYPES.map((t) => (
                    <span key={t.value} className="text-[10px] text-muted-foreground font-mono truncate">
                      &ldquo;{t.value}&rdquo;
                    </span>
                  ))}
                </div>
              </details>
            </div>

            {/* Paste Textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                {bulkPasteTab === 'json' ? 'JSON Paste Area:' : 'Quick Text Paste Area:'}
              </label>
              <textarea
                value={bulkPasteInput}
                onChange={(e) => { setBulkPasteInput(e.target.value); setBulkPastePreview(null); setBulkPasteErrors([]) }}
                rows={10}
                placeholder={
                  bulkPasteTab === 'json'
                    ? '[\n  { "type": "multiple_choice", "question": "...", "options": ["A","B","C","D"], "answer": "A" }\n]'
                    : 'Q1. [multiple_choice] Your question text?\nA. Option A\nB. Option B\nANSWER: A\n\nQ2. [true_false_not_given] Statement text?\nANSWER: TRUE'
                }
                className="w-full p-3 rounded-xl border border-border bg-background font-mono text-xs text-foreground resize-y focus:ring-2 focus:ring-primary focus:outline-none leading-relaxed"
              />
            </div>

            {/* Settings Row */}
            <div className="flex flex-wrap items-center gap-4 p-3 bg-secondary/30 rounded-xl border border-border">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-foreground whitespace-nowrap">Section:</label>
                <select
                  value={bulkPasteSection}
                  onChange={(e) => setBulkPasteSection(parseInt(e.target.value, 10))}
                  className="px-3 py-1.5 rounded-xl border border-border bg-background text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  {sections.map((sec, idx) => (
                    <option key={sec.id || idx} value={idx}>
                      {sec.title || `Section ${idx + 1}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-foreground whitespace-nowrap">Start at Q#:</label>
                <input
                  type="number"
                  value={bulkPasteStartNum ?? (questions.length + 1)}
                  onChange={(e) => setBulkPasteStartNum(parseInt(e.target.value, 10) || 1)}
                  min={1}
                  className="w-20 px-2.5 py-1.5 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleBulkPastePreview}
                disabled={!bulkPasteInput.trim()}
                className="px-3.5 py-1.5 rounded-xl bg-card border border-border text-xs font-bold text-foreground hover:bg-secondary disabled:opacity-40 cursor-pointer transition-colors"
              >
                👁 Preview {bulkPastePreview ? `(${bulkPastePreview.length})` : ''}
              </button>
            </div>

            {/* Parse Warnings */}
            {bulkPasteErrors.length > 0 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl space-y-1">
                <p className="text-xs font-bold text-amber-800 dark:text-amber-300">⚠ Warnings:</p>
                {bulkPasteErrors.map((err, i) => (
                  <p key={i} className="text-xs text-amber-700 dark:text-amber-400">• {err}</p>
                ))}
              </div>
            )}

            {/* Preview Table */}
            {bulkPastePreview !== null && (
              <div className={cn(
                'p-3.5 rounded-xl border space-y-2',
                bulkPastePreview.length > 0
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800'
              )}>
                {bulkPastePreview.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                        ✅ {bulkPastePreview.length} questions detected — ready to import:
                      </p>
                      <span className="text-[10px] text-emerald-600 font-mono">
                        Q{bulkPasteStartNum ?? (questions.length + 1)} — Q{(bulkPasteStartNum ?? (questions.length + 1)) + bulkPastePreview.length - 1}
                      </span>
                    </div>
                    <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                      {bulkPastePreview.map((q, i) => {
                        const qNum = (bulkPasteStartNum ?? (questions.length + 1)) + i
                        return (
                          <div key={i} className="flex items-center gap-2 text-[11px] py-0.5">
                            <span className="w-6 h-6 rounded-md bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-black flex items-center justify-center flex-shrink-0 text-[10px] border border-emerald-200">
                              {qNum}
                            </span>
                            <span className="text-emerald-700 dark:text-emerald-400 font-mono text-[10px] flex-shrink-0 px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/50 rounded">
                              {q.question_type}
                            </span>
                            <span className="text-foreground truncate flex-1">{q.question_text}</span>
                            {q.correct_answer && (
                              <span className="ml-auto text-emerald-700 dark:text-emerald-400 font-bold flex-shrink-0 text-[10px]">
                                → {q.correct_answer}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </>
                ) : (
                  <p className="text-xs font-bold text-rose-700 dark:text-rose-400">
                    ❌ No questions detected. Please verify format.
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  setShowBulkPasteModal(false)
                  setBulkPasteInput('')
                  setBulkPastePreview(null)
                  setBulkPasteErrors([])
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-foreground hover:bg-secondary cursor-pointer transition-colors"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleBulkPastePreview}
                  disabled={!bulkPasteInput.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-secondary border border-border text-foreground hover:bg-secondary/70 cursor-pointer disabled:opacity-40 transition-colors"
                >
                  Parse & Preview
                </button>
                <button
                  type="button"
                  onClick={handleBulkPasteImport}
                  disabled={!bulkPastePreview || bulkPastePreview.length === 0}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-primary text-black hover:bg-primary/90 cursor-pointer disabled:opacity-40 transition-all shadow-sm"
                >
                  Import {bulkPastePreview && bulkPastePreview.length > 0 ? `${bulkPastePreview.length} ` : ''}Questions →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Publish Validation Modal */}
      {showValidationModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-border space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              {validationErrors.length === 0 ? (
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5" />
                </div>
              )}
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {validationErrors.length === 0 ? 'Publish Validation Passed!' : 'Publish Blocked — Errors Detected'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {validationErrors.length === 0
                    ? 'All required IELTS criteria met. Test is saved and published.'
                    : 'Fix the following blocking errors before publishing.'}
                </p>
              </div>
            </div>

            {validationErrors.length > 0 && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-xl space-y-1">
                <p className="text-xs font-bold text-rose-800 dark:text-rose-300">Blocking Errors:</p>
                <ul className="text-xs text-rose-700 dark:text-rose-400 list-disc list-inside space-y-0.5">
                  {validationErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {validationWarnings.length > 0 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl space-y-1">
                <p className="text-xs font-bold text-amber-800 dark:text-amber-300">Warnings (Non-blocking):</p>
                <ul className="text-xs text-amber-700 dark:text-amber-400 list-disc list-inside space-y-0.5">
                  {validationWarnings.map((warn, i) => (
                    <li key={i}>{warn}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowValidationModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-foreground hover:bg-secondary cursor-pointer"
              >
                Close
              </button>
              {validationErrors.length === 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setShowValidationModal(false)
                    navigate('/admin/tests')
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-primary text-black shadow-xs hover:bg-primary/90 cursor-pointer"
                >
                  Return to Tests List
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
