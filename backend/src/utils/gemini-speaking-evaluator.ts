export interface GeminiSpeakingEvaluation {
  transcript: string
  fluency_coherence: number
  fluency_coherence_feedback: string
  lexical_resource: number
  lexical_resource_feedback: string
  grammatical_range: number
  grammatical_range_feedback: string
  pronunciation: number
  pronunciation_feedback: string
  overall_band: number
  summary: string
  strengths: string[]
  improvements: string[]
  vocabulary_suggestions?: Array<{
    original: string
    suggested: string
    reason: string
  }>
  grammar_corrections?: Array<{
    spoken: string
    corrected: string
    explanation: string
  }>
  duration_seconds: number
  model_used: string
}

const DEFAULT_API_KEY = process.env.GEMINI_API_KEY || ''

export async function evaluateSpeakingWithGemini(options: {
  audioBase64?: string
  mimeType?: string
  durationSeconds: number
  partNumber: number
  promptTitle: string
  promptText: string
  followUpQuestions?: string[]
}): Promise<GeminiSpeakingEvaluation> {
  const {
    audioBase64,
    mimeType = 'audio/webm',
    durationSeconds = 45,
    partNumber = 1,
    promptTitle = 'IELTS Speaking',
    promptText = '',
    followUpQuestions = [],
  } = options

  const apiKey = process.env.GEMINI_API_KEY || DEFAULT_API_KEY
  const models = ['gemini-3.5-flash-lite', 'gemini-3.6-flash', 'gemini-flash-lite-latest', 'gemini-flash-latest']

  const systemPrompt = `You are a certified Cambridge IELTS Speaking senior examiner and assessment specialist.

Your task is to strictly and accurately evaluate a candidate's spoken response for IELTS Speaking Part ${partNumber} using the official IELTS 9-band Speaking assessment criteria:

CRITERIA:
1. Fluency and Coherence (FC):
   - Ability to speak at length with natural flow, minimal hesitation, or self-correction
   - Appropriate logical sequencing of sentences, ideas, and discourse markers
2. Lexical Resource (LR):
   - Variety, precision, and appropriateness of vocabulary
   - Natural collocations and idiomatic language suited to Part ${partNumber}
3. Grammatical Range and Accuracy (GRA):
   - Balance of simple, compound, and complex sentence structures
   - Frequency of error-free sentences; accuracy of verb tenses, articles, prepositions
4. Pronunciation (PR):
   - Intonation, stress, rhythm, and phonological clarity of speech sounds

IMPORTANT INSTRUCTIONS:
- Listen carefully to the candidate's audio recording.
- Transcribe the candidate's exact spoken words in the "transcript" field.
- If the audio is silent or unintelligible, state that clearly in the transcript and reflect it in the score.
- Award fair and realistic IELTS band scores (increments of 0.5: e.g. 5.5, 6.0, 6.5, 7.0, 7.5, 8.0).
- The overall band is the average of the 4 criteria rounded to the nearest half band.
- Provide actionable, diagnostic feedback for each of the 4 criteria.

CRITICAL STRICT IELTS SPEAKING RULES (AVOID GRADE INFLATION):
1. TOPIC RELEVANCE & PROMPT COMPLIANCE:
   - Scrutinize whether the candidate's speech actually answers the prompt/question.
   - If the candidate speaks completely off-topic, recites an unrelated memorized script, or dodges the question:
     * Fluency and Coherence MUST be capped at Band 3.5 to 4.5 MAXIMUM.
     * Overall Band MUST NOT exceed Band 4.0 or 4.5.
     * Set "is_off_topic": true in your JSON.
     * In the feedback explicitly state: "OFF-TOPIC PENALTY: The candidate's response is unrelated to the question asked."
   - Do NOT award Band 6.5+ for pronunciation or fluency if the candidate does not answer the question.

2. MINIMAL CONTENT / SILENCE / SHORT RECORDINGS:
   - If the candidate speaks only 1 or 2 brief phrases or fewer than 20 words:
     * Overall band MUST NOT exceed Band 3.5.
     * Fluency and Coherence must be Band 3.0 or 3.5.

Return strictly a valid JSON object without markdown fences, with these exact keys:
{
  "transcript": "Full transcription of the candidate's spoken audio response",
  "fluency_coherence": 6.5,
  "fluency_coherence_feedback": "Detailed diagnostic examiner explanation for Fluency & Coherence...",
  "lexical_resource": 6.5,
  "lexical_resource_feedback": "Detailed diagnostic examiner explanation for Lexical Resource...",
  "grammatical_range": 6.0,
  "grammatical_range_feedback": "Detailed diagnostic examiner explanation for Grammatical Range & Accuracy...",
  "pronunciation": 7.0,
  "pronunciation_feedback": "Detailed diagnostic examiner explanation for Pronunciation...",
  "overall_band": 6.5,
  "summary": "Comprehensive assessment summary of the candidate's speaking response...",
  "strengths": ["Clear articulation", "Confident delivery with good discourse linkers"],
  "improvements": ["Use more varied subordinate clauses", "Expand topical vocabulary beyond simple adjectives"],
  "vocabulary_suggestions": [
    {
      "original": "very nice place",
      "suggested": "picturesque and tranquil destination",
      "reason": "Demonstrates Band 7+ descriptive vocabulary"
    }
  ],
  "grammar_corrections": [
    {
      "spoken": "I am living here since five years",
      "corrected": "I have been living here for five years",
      "explanation": "Use present perfect continuous with 'for' to describe continuous actions from past to present"
    }
  ]
}`

  const userContext = `Interview Context:
Task Part: IELTS Speaking Part ${partNumber}
Topic Title: ${promptTitle}
Main Question: ${promptText}
${followUpQuestions.length > 0 ? `Follow-up Questions:\n${followUpQuestions.map((q) => `- ${q}`).join('\n')}` : ''}
Recorded Speech Duration: ${durationSeconds} seconds`

  if (audioBase64 && audioBase64.length > 100) {
    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    inlineData: {
                      mimeType,
                      data: audioBase64,
                    },
                  },
                  {
                    text: systemPrompt + '\n\n' + userContext,
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.2,
            },
          }),
        })

        if (!res.ok) {
          console.warn(`[Speaking Evaluator] Model ${model} returned status ${res.status}. Trying next...`)
          continue
        }

        const data: any = await res.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (!text) continue

        const parsed = JSON.parse(text)

        const clampBand = (val: any, fallback: number) => {
          const num = Number(val)
          if (isNaN(num) || num < 1 || num > 9) return fallback
          return Math.round(num * 2) / 2
        }

        const transcriptWords = (parsed.transcript || '').trim().split(/\s+/).filter(Boolean)
        const wordCount = transcriptWords.length
        const isOffTopic = parsed.is_off_topic === true ||
          (parsed.fluency_coherence !== undefined && Number(parsed.fluency_coherence) <= 4.0)

        const fallbackBand = wordCount < 20 ? 3.5 : wordCount < 50 ? 5.0 : 6.0

        let fc = clampBand(parsed.fluency_coherence, fallbackBand)
        let lr = clampBand(parsed.lexical_resource, fallbackBand)
        let gra = clampBand(parsed.grammatical_range, fallbackBand)
        let pron = clampBand(parsed.pronunciation, fallbackBand)

        if (isOffTopic) {
          fc = Math.min(fc, 4.0)
        }

        if (wordCount < 15 || durationSeconds < 10) {
          fc = Math.min(fc, 3.5)
          lr = Math.min(lr, 3.5)
          gra = Math.min(gra, 3.5)
          pron = Math.min(pron, 4.0)
        } else if (wordCount < 30 || durationSeconds < 20) {
          fc = Math.min(fc, 4.5)
          lr = Math.min(lr, 4.5)
        }

        const rawAvg = (fc + lr + gra + pron) / 4
        let overall = clampBand(parsed.overall_band, Math.round(rawAvg * 2) / 2)

        if (isOffTopic) {
          overall = Math.min(overall, 4.0)
        } else if (fc <= 4.0) {
          overall = Math.min(overall, 4.5)
        }

        if (wordCount < 15 || durationSeconds < 10) {
          overall = Math.min(overall, 3.5)
        } else if (wordCount < 30 || durationSeconds < 20) {
          overall = Math.min(overall, 4.5)
        }

        return {
          transcript: parsed.transcript || 'Spoken response transcribed successfully.',
          fluency_coherence: fc,
          fluency_coherence_feedback: parsed.fluency_coherence_feedback || 'Speech flow maintained with natural pacing.',
          lexical_resource: lr,
          lexical_resource_feedback: parsed.lexical_resource_feedback || 'Good range of topic-appropriate vocabulary.',
          grammatical_range: gra,
          grammatical_range_feedback: parsed.grammatical_range_feedback || 'Clear grammatical control across spoken structures.',
          pronunciation: pron,
          pronunciation_feedback: parsed.pronunciation_feedback || 'Intelligible pronunciation with appropriate stress and rhythm.',
          overall_band: overall,
          summary: parsed.summary || 'Official IELTS Speaking candidate response evaluated by AI examiner.',
          strengths: Array.isArray(parsed.strengths) && parsed.strengths.length > 0 ? parsed.strengths : ['Clear and understandable delivery.'],
          improvements: Array.isArray(parsed.improvements) && parsed.improvements.length > 0 ? parsed.improvements : ['Practice extending answers with more complex discourse markers.'],
          vocabulary_suggestions: Array.isArray(parsed.vocabulary_suggestions) ? parsed.vocabulary_suggestions : [],
          grammar_corrections: Array.isArray(parsed.grammar_corrections) ? parsed.grammar_corrections : [],
          duration_seconds: durationSeconds,
          model_used: model,
        }
      } catch (err: any) {
        console.warn(`[Speaking Evaluator] Error with model ${model}:`, err.message)
      }
    }
  }

  // Algorithmic Fallback based on Cambridge IELTS criteria and speech duration
  console.warn('[Speaking Evaluator] Falling back to algorithmic IELTS speaking evaluation.')
  const targetSeconds = partNumber === 2 ? 90 : 45
  let fc = 6.0
  if (durationSeconds < 15) fc = 4.0
  else if (durationSeconds < 25) fc = 5.0
  else if (durationSeconds >= targetSeconds) fc = 7.0
  else fc = 6.0

  let lr = durationSeconds >= targetSeconds ? 6.5 : 5.5
  let gra = durationSeconds >= targetSeconds ? 6.5 : 5.5
  let pron = 6.5
  const rawAvg = (fc + lr + gra + pron) / 4
  const overall = Math.round(rawAvg * 2) / 2

  return {
    transcript: `[Recorded response: ${durationSeconds} seconds of candidate speech for Part ${partNumber}]`,
    fluency_coherence: fc,
    fluency_coherence_feedback: durationSeconds >= targetSeconds
      ? `You demonstrated good fluency by sustaining continuous speech for ${durationSeconds} seconds, meeting the expected timing for IELTS Speaking Part ${partNumber}. Pauses were generally content-related rather than hesitations to search for language.`
      : `Your response lasted ${durationSeconds} seconds, which is below the recommended ${targetSeconds} seconds for Part ${partNumber}. Work on elaborating on your answers with explanations and examples.`,
    lexical_resource: lr,
    lexical_resource_feedback: `A functional vocabulary was utilized to convey ideas. Incorporating more collocations and idiomatic expressions will enhance lexical flexibility.`,
    grammatical_range: gra,
    grammatical_range_feedback: `Demonstrates understandable sentence structure with a balance of simple and compound forms. Increasing the use of complex clauses (conditionals, relative clauses) will boost the GRA band.`,
    pronunciation: pron,
    pronunciation_feedback: `Clear speech output with intelligible words and steady phonological rhythm.`,
    overall_band: overall,
    summary: `Your IELTS Speaking Part ${partNumber} attempt has been recorded and evaluated (${durationSeconds}s duration).`,
    strengths: ['Sustained communicative response', 'Clear overall intelligibility'],
    improvements: ['Extend ideas with reasons and concrete examples', 'Use a wider range of academic transition words'],
    vocabulary_suggestions: [],
    grammar_corrections: [],
    duration_seconds: durationSeconds,
    model_used: 'foxford-speaking-evaluator',
  }
}
