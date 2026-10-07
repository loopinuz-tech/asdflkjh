import { Router, Request, Response } from 'express'
import { query } from '../config/db.js'
import { authenticateToken } from '../middleware/auth.js'

const router = Router()

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const FAST_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.7-flash',
  'gemini-3.8-flash',
  'gemini-3.5-flash-lite',
]

/**
 * Checks if the user is an active Premium member or Admin
 */
async function isUserPremium(userId: string, role?: string): Promise<boolean> {
  if (role === 'admin') return true
  try {
    const res = await query(
      `SELECT s.id 
       FROM subscriptions s
       WHERE s.user_id = $1 AND s.status = 'active' AND (s.expires_at IS NULL OR s.expires_at > NOW())
       LIMIT 1`,
      [userId]
    )
    return res.rows.length > 0
  } catch (err) {
    console.error('[Speaking Live] Premium check error:', err)
    return false
  }
}

/**
 * Helper to call Gemini with JSON response and automatic model fallback
 */
async function callGeminiJson(contents: any[], systemInstruction?: string): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY || GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on server')
  }

  for (const model of FAST_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
      const bodyPayload: any = {
        contents,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.7,
          maxOutputTokens: 1024,
          thinkingConfig: {
            thinkingBudget: 0,
          },
        },
      }

      if (systemInstruction) {
        bodyPayload.systemInstruction = {
          parts: [{ text: systemInstruction }],
        }
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
        signal: AbortSignal.timeout(5000),
      })

      if (!res.ok) {
        const errText = await res.text()
        console.warn(`[Speaking Live] Model ${model} HTTP ${res.status}: ${errText.slice(0, 150)}`)
        continue
      }

      const data: any = await res.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) continue

      const parsed = JSON.parse(text)
      return { data: parsed, model }
    } catch (err: any) {
      console.warn(`[Speaking Live] Error with model ${model}:`, err.message)
    }
  }

  throw new Error('All Gemini models failed to generate response')
}

// 1. GET /api/speaking-live/status — Check user premium access
router.get('/status', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const role = req.user!.role
    const isPremium = await isUserPremium(userId, role)

    return res.json({
      success: true,
      user_id: userId,
      role,
      is_premium: isPremium,
    })
  } catch (err: any) {
    console.error('[Speaking Live] Status check error:', err)
    return res.status(500).json({ error: 'Failed to verify speaking status' })
  }
})

// 2. GET /api/speaking-live/topics — Curated IELTS topics for live session
router.get('/topics', async (_req: Request, res: Response) => {
  try {
    // Fetch popular speaking prompts from database
    const dbPrompts = await query(
      `SELECT id, part_number, title, prompt_text, follow_up_questions, difficulty 
       FROM speaking_prompts 
       WHERE status = 'published'
       ORDER BY created_at DESC 
       LIMIT 30`
    )

    const fallbackTopics = [
      {
        id: 't-hometown',
        part_number: 1,
        title: 'Hometown & City Life',
        prompt_text: 'Where are you from, and what do you like most about your hometown?',
        follow_up_questions: ['Has your city changed recently?', 'Would you live there forever?'],
      },
      {
        id: 't-work',
        part_number: 1,
        title: 'Studies & Future Career',
        prompt_text: 'What are you studying or working on, and why did you choose this field?',
        follow_up_questions: ['What is the hardest part of your work?', 'Where do you see yourself in 5 years?'],
      },
      {
        id: 't-technology',
        part_number: 3,
        title: 'Artificial Intelligence & Modern Tech',
        prompt_text: 'How will artificial intelligence transform jobs in the next ten years?',
        follow_up_questions: ['Should humans fear AI taking over creative roles?', 'Is technology isolating people?'],
      },
      {
        id: 't-travel',
        part_number: 2,
        title: 'A Memorable Journey You Took',
        prompt_text: 'Describe an unforgettable trip you made. You should explain where you went and why it was memorable.',
        follow_up_questions: ['Do people travel more nowadays than in the past?', 'How does tourism affect local cultures?'],
      },
      {
        id: 't-roast-challenge',
        part_number: 0,
        title: '🔥 The Savage Roast Challenge (Free Debate)',
        prompt_text: 'Convince me with strong arguments: Is higher university education totally useless today? Give your stance.',
        follow_up_questions: ['Defend your opinion!', 'Why do most people disagree with you?'],
      },
    ]

    const topics = dbPrompts.rows.length > 0 ? dbPrompts.rows : fallbackTopics

    return res.json({
      success: true,
      topics,
    })
  } catch (err: any) {
    console.error('[Speaking Live] Topics error:', err)
    return res.status(500).json({ error: 'Failed to fetch topics' })
  }
})

// 3. POST /api/speaking-live/chat — Real-time conversational turn with Savage Roast / Cambridge persona
router.post('/chat', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const role = req.user!.role

    // Strict Premium Check: Only Premium users or Admins can access Live Speaking!
    const isPremium = await isUserPremium(userId, role)
    if (!isPremium) {
      return res.status(403).json({
        error: 'Premium subscription required',
        code: 'PREMIUM_REQUIRED',
        message: 'Real-time AI Speaking Partner is an exclusive feature for Foxford Premium candidates.',
        upgrade_url: '/premium',
      })
    }

    const {
      message,
      history = [],
      mode = 'roast', // 'roast' | 'strict' | 'coach'
      topic = 'General IELTS Speaking',
      part = 1,
      turnCount = 1,
    } = req.body

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty' })
    }

    // Build system prompt based on selected personality
    let personalityPrompt = ''
    if (mode === 'roast') {
      personalityPrompt = `YOU ARE: The Savage IELTS Examiner — an ultra-sharp, brutally witty, and sarcastic Cambridge examiner.
YOUR MISSION: Keep the candidate 100% hooked through psychological provocation, playful roasts, and uncompromising standards.
PSYCHOLOGICAL MECHANIC:
- If the candidate hesitates, pauses, repeats basic words ('very', 'good', 'nice', 'actually', 'like'), or makes common grammar slips, ROAST THEM wittily! (e.g. "Did you take a 5-second sabbatical between words?", "Band 5 vocabulary alert! Use an advanced adjective before I fall asleep!").
- Call out over-rehearsed clichés ("'Since the dawn of humanity...' Oh please, don't recite memorized scripts!").
- Challenge their weak points aggressively: "Is that really your best argument? Give me a concrete example!"
- BUT: Never be toxic or hateful. Only roast their language proficiency, grammar errors, filler words, and IELTS slips in a hilarious, motivating, Gordon Ramsay style.
- Keep the spoken 'reply' punchy and concise (maximum 2 to 3 sentences) so the audio voice responds in real-time without delay!
- ALWAYS end the reply by directly asking the next question or pressing them for more elaboration.`
    } else if (mode === 'strict') {
      personalityPrompt = `YOU ARE: A Senior British Cambridge IELTS Examiner.
YOUR DEMEANOR: Stern, formal, academic, uncompromising.
- You maintain formal IELTS examination protocol.
- Evaluate according to the 4 IELTS criteria: Fluency & Coherence, Lexical Resource, Grammatical Range, Pronunciation.
- Keep spoken replies concise (2-3 sentences max) and immediately ask the next Part ${part} question.`
    } else {
      personalityPrompt = `YOU ARE: An encouraging, friendly IELTS speaking coach.
YOUR DEMEANOR: Warm, supportive, uplifting, yet precise.
- Praise good attempts, gently correct mistakes, and ask natural conversational questions.
- Keep spoken replies concise (2-3 sentences max).`
    }

    const systemInstruction = `${personalityPrompt}

CONTEXT:
- Target Topic: ${topic}
- IELTS Part: ${part === 0 ? 'Free Roast Debate' : `Part ${part}`}
- Conversation Turn: ${turnCount}

CRITICAL RULES:
1. Candidate just spoke: "${message.trim()}"
2. If the candidate just gave a brief greeting (such as "hi", "hello", "hey"), greet back naturally (with playful roast or warm coaching depending on mode) and immediately ask the opening Part ${part} question for this topic: "${topic}".
3. Inspect the candidate's speech for grammar mistakes, low-level word choices, or hesitation.
4. If they made an error, provide a specific correction in the JSON.
5. Estimate their live Band score realistically (from 4.0 to 9.0 in 0.5 increments).
6. Choose an expressive facial expression for your avatar: 'roast' (smirking/angry/fierce), 'angry' (grumpy disapproval), 'smirk' (sarcastic amusement), 'impressed' (when they use Band 8+ idiom), 'thinking' (scrutinizing).

OUTPUT FORMAT (STRICT JSON ONLY):
{
  "reply": "Concise spoken examiner response (2-3 sentences). This will be read aloud by Text-To-Speech.",
  "roast": "A quick, punchy 1-sentence roast or witty remark about their answer (or encouraging note if coach mode).",
  "correction": {
    "has_error": true/false,
    "original": "exact phrase candidate mispronounced or got wrong, or null",
    "corrected": "Band 8+ natural native alternative, or null",
    "explanation": "concise explanation of why this is better, or null"
  },
  "estimated_band": 6.5,
  "expression": "roast" | "angry" | "smirk" | "impressed" | "thinking",
  "criteria": {
    "fluency": 6.0,
    "vocabulary": 6.5,
    "grammar": 6.0,
    "pronunciation": 6.5
  },
  "next_question": "Next prompt or question you asked in the reply"
}`

    // Format chat history for Gemini contents with strict alternating user/model turns
    const rawTurns: any[] = []
    if (Array.isArray(history)) {
      for (const turn of history.slice(-6)) {
        if (!turn.content || !String(turn.content).trim()) continue
        rawTurns.push({
          role: turn.role === 'model' ? 'model' : 'user',
          text: String(turn.content).trim(),
        })
      }
    }

    const trimmedMsg = message.trim()
    const lastTurn = rawTurns[rawTurns.length - 1]
    if (!lastTurn || lastTurn.role !== 'user' || lastTurn.text !== trimmedMsg) {
      rawTurns.push({ role: 'user', text: trimmedMsg })
    }

    // Merge adjacent same-role messages so Gemini never complains about role alternation
    const contents: any[] = []
    for (const turn of rawTurns) {
      if (contents.length > 0 && contents[contents.length - 1].role === turn.role) {
        contents[contents.length - 1].parts[0].text += `\n${turn.text}`
      } else {
        contents.push({
          role: turn.role,
          parts: [{ text: turn.text }],
        })
      }
    }

    // Ensure the very first turn is user turn for Gemini chat
    if (contents.length > 0 && contents[0].role === 'model') {
      contents.shift()
    }
    if (contents.length === 0) {
      contents.push({ role: 'user', parts: [{ text: trimmedMsg }] })
    }

    const { data: aiResponse, model } = await callGeminiJson(contents, systemInstruction)

    return res.json({
      success: true,
      turn: {
        reply: aiResponse.reply || "Let's move on. Tell me more about that.",
        roast: aiResponse.roast || (mode === 'roast' ? 'Step up your vocabulary!' : 'Keep going!'),
        correction: aiResponse.correction || { has_error: false },
        estimated_band: Number(aiResponse.estimated_band) || 6.0,
        expression: aiResponse.expression || (mode === 'roast' ? 'roast' : 'neutral'),
        criteria: aiResponse.criteria || { fluency: 6.0, vocabulary: 6.0, grammar: 6.0, pronunciation: 6.0 },
        next_question: aiResponse.next_question || '',
      },
      model_used: model,
    })
  } catch (err: any) {
    console.error('[Speaking Live] Chat error (using dynamic fallback):', err.message)
    const lower = (req.body.message || '').toLowerCase()
    let fallbackReply = `That is an interesting point regarding ${req.body.topic || 'this topic'}. Could you give a concrete real-life example to support what you just said?`
    let fallbackRoast = "Don't just give one-sentence answers! Expand your argument with compound structures."

    if (lower.includes('hello') || lower.includes('hi') || lower.length < 8) {
      fallbackReply = `Welcome! Let's get straight down to business. In terms of ${req.body.topic || 'our topic'}, what is your personal perspective on it?`
      fallbackRoast = "A simple greeting won't earn you a Band 7! Let's hear some actual sentences."
    } else if (lower.includes('very') || lower.includes('good') || lower.includes('nice') || lower.includes('like')) {
      fallbackRoast = "Band 5 vocabulary detected! Replace 'very good' with 'exceptional' or 'immensely beneficial'."
      fallbackReply = `I hear you, but try to avoid repetitive basic words. How would you explain that using more sophisticated vocabulary?`
    }

    return res.json({
      success: true,
      turn: {
        reply: fallbackReply,
        roast: req.body.mode === 'roast' ? fallbackRoast : 'Try to elaborate further with complex clauses.',
        correction: { has_error: false },
        estimated_band: 6.0,
        expression: req.body.mode === 'roast' ? 'roast' : 'neutral',
        criteria: { fluency: 6.0, vocabulary: 6.0, grammar: 6.0, pronunciation: 6.0 },
        next_question: fallbackReply,
      },
      model_used: 'fallback-offline',
    })
  }
})

// 4. POST /api/speaking-live/end-session — Comprehensive final report & session save
router.post('/end-session', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const {
      topic = 'IELTS Speaking Session',
      part = 1,
      mode = 'roast',
      turns = [],
      durationSeconds = 60,
    } = req.body

    const transcriptText = turns
      .map((t: any) => `${t.role === 'user' ? 'Candidate' : 'Examiner'}: ${t.content}`)
      .join('\n')

    const summaryPrompt = `You are a certified Cambridge IELTS Senior Examiner.
Review the candidate's complete live speaking interview transcript below:

TOPIC: ${topic}
PART: Part ${part}
MODE: ${mode}
DURATION: ${durationSeconds} seconds

TRANSCRIPT:
${transcriptText || 'No transcript available.'}

Provide an official diagnostic evaluation report:
1. Overall IELTS Band score (4.0 to 9.0 in 0.5 increments).
2. Criteria breakdown: Fluency & Coherence, Lexical Resource, Grammatical Range & Accuracy, Pronunciation.
3. Top 3 Strengths demonstrated.
4. Top 3 Actionable Weaknesses to fix.
5. If mode is 'roast', include a hilarious 'Examiner Verdict Roast' summarizing their performance!
6. Key vocabulary upgrades from the session.

OUTPUT STRICT JSON ONLY:
{
  "overall_band": 6.5,
  "fluency_coherence": 6.0,
  "lexical_resource": 6.5,
  "grammatical_range": 6.5,
  "pronunciation": 7.0,
  "verdict": "Overall summary of the candidate's performance...",
  "roast_verdict": "Savage 1-2 sentence roast summarizing their quirks...",
  "strengths": ["...", "..."],
  "improvements": ["...", "..."],
  "vocabulary_upgrades": [
    { "original": "good thing", "advanced": "salient advantage", "reason": "Academic precision" }
  ]
}`

    let report: any = null
    try {
      const res = await callGeminiJson([{ role: 'user', parts: [{ text: summaryPrompt }] }])
      report = res.data
    } catch {
      report = {
        overall_band: 6.5,
        fluency_coherence: 6.5,
        lexical_resource: 6.5,
        grammatical_range: 6.0,
        pronunciation: 7.0,
        verdict: 'Good effort during live practice session. Work on expanding complex sentence structures.',
        roast_verdict: 'You survived the savage examiner! Now go memorize some Band 8 idioms.',
        strengths: ['Prompt responses', 'Willingness to elaborate'],
        improvements: ['Reduce hesitations', 'Diversify connectives'],
        vocabulary_upgrades: [],
      }
    }

    // Save session to database if table exists
    try {
      await query(
        `INSERT INTO live_speaking_sessions 
         (user_id, topic, part, mode, estimated_band, transcript, feedback_summary, duration_seconds)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          userId,
          topic,
          String(part),
          mode,
          report.overall_band || 6.5,
          JSON.stringify(turns),
          report.verdict || '',
          durationSeconds,
        ]
      )
    } catch (dbErr: any) {
      console.warn('[Speaking Live] Note: Could not save to live_speaking_sessions table:', dbErr.message)
    }

    return res.json({
      success: true,
      report,
    })
  } catch (err: any) {
    console.error('[Speaking Live] End session error:', err)
    return res.status(500).json({ error: 'Failed to generate session report' })
  }
})

// 5. GET /api/speaking-live/history — Past live sessions
router.get('/history', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const resDb = await query(
      `SELECT id, topic, part, mode, estimated_band, duration_seconds, created_at
       FROM live_speaking_sessions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 15`,
      [userId]
    )

    return res.json({
      success: true,
      sessions: resDb.rows,
    })
  } catch {
    return res.json({
      success: true,
      sessions: [],
    })
  }
})

export default router
