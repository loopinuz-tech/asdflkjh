import { Router, Request, Response } from 'express'
import { query } from '../config/db.js'
import { authenticateToken } from '../middleware/auth.js'

const router = Router()

// 1. GET VOCABULARY WORDS
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const { topic, difficulty, mode } = req.query

    let sql = `
      SELECT v.*, 
             COALESCE(uv.status, 'new') as user_status,
             COALESCE(uv.mastery_level, 0) as mastery_level,
             uv.next_review_at,
             COALESCE(uv.review_count, 0) as review_count
      FROM vocabulary_words v
      LEFT JOIN user_vocabulary uv ON uv.word_id = v.id AND uv.user_id = $1
      WHERE (v.status = 'published' OR v.status IS NULL)
    `
    const params: any[] = [userId]

    if (topic && topic !== 'all') {
      params.push(topic)
      sql += ` AND v.topic = $${params.length}`
    }

    if (difficulty && difficulty !== 'all') {
      params.push(difficulty)
      sql += ` AND v.difficulty = $${params.length}`
    }

    if (mode === 'review') {
      sql += ` AND (uv.next_review_at IS NULL OR uv.next_review_at <= NOW())`
    }

    sql += ' ORDER BY v.created_at ASC LIMIT 100'

    const result = await query(sql, params)
    return res.json({ success: true, words: result.rows })
  } catch (error: any) {
    console.error('Vocabulary list error:', error)
    return res.status(500).json({ error: 'Failed to fetch vocabulary' })
  }
})

// 2. RECORD WORD REVIEW (SRS Spaced Repetition)
router.post('/review', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const { wordId, rating } = req.body // rating: 'again' | 'hard' | 'good' | 'easy'

    if (!wordId || !rating) {
      return res.status(400).json({ error: 'wordId and rating are required' })
    }

    // Check existing record
    const existingRes = await query(
      'SELECT id, mastery_level, review_count FROM user_vocabulary WHERE user_id = $1 AND word_id = $2',
      [userId, wordId]
    )
    const existing = existingRes.rows[0]

    let newLevel = existing?.mastery_level || 0
    let newStatus = 'learning'
    let daysToAdd = 1

    if (rating === 'again') {
      newLevel = Math.max(0, newLevel - 1)
      newStatus = 'learning'
      daysToAdd = 1
    } else if (rating === 'hard') {
      newLevel = Math.max(1, newLevel)
      newStatus = 'review'
      daysToAdd = 2
    } else if (rating === 'good') {
      newLevel = newLevel + 1
      newStatus = newLevel >= 4 ? 'mastered' : 'review'
      daysToAdd = Math.max(3, newLevel * 3)
    } else if (rating === 'easy') {
      newLevel = newLevel + 2
      newStatus = newLevel >= 4 ? 'mastered' : 'review'
      daysToAdd = Math.max(5, newLevel * 5)
    }

    const nextReview = new Date()
    nextReview.setDate(nextReview.getDate() + daysToAdd)

    if (existing) {
      await query(
        `UPDATE user_vocabulary
         SET mastery_level = $1,
             status = $2,
             next_review_at = $3,
             review_count = review_count + 1,
             updated_at = NOW()
         WHERE id = $4`,
        [newLevel, newStatus, nextReview.toISOString(), existing.id]
      )
    } else {
      await query(
        `INSERT INTO user_vocabulary (user_id, word_id, mastery_level, status, next_review_at, review_count)
         VALUES ($1, $2, $3, $4, $5, 1)`,
        [userId, wordId, newLevel, newStatus, nextReview.toISOString()]
      )
    }

    return res.json({ success: true, newStatus, newLevel, nextReview })
  } catch (error: any) {
    console.error('Word review error:', error)
    return res.status(500).json({ error: 'Failed to record word review' })
  }
})

// Helper: Check if user has active premium or admin/teacher role
async function checkUserIsPremium(userId: string, role?: string): Promise<boolean> {
  if (role === 'admin' || role === 'teacher') return true
  try {
    const res = await query(
      `SELECT id FROM subscriptions
       WHERE user_id = $1 AND status = 'active' AND (expires_at IS NULL OR expires_at > NOW())
       LIMIT 1`,
      [userId]
    )
    return res.rows.length > 0
  } catch (err) {
    console.error('Error checking premium status:', err)
    return false
  }
}

// Curated IELTS Academic Lexicon for instant, high-precision results
const IELTS_ACADEMIC_DICT: Record<string, any> = {
  food: {
    word: 'food',
    base_form: 'food',
    part_of_speech: 'noun',
    pronunciation: '/fuːd/',
    translation_uz: "oziq-ovqat, taom",
    definition_uz: "Yashash uchun zarur bo'lgan moddalar; inson va hayvonlar iste'mol qiladigan barcha narsalar",
    context_meaning_uz: '"food" so\'zi ushbu matnda "oziq-ovqat" yoki "taom" ma\'nosida — insonlar uchun yetishtiriladigan va iste\'mol qilinadigan mahsulotlar sifatida qo\'llanilgan.',
    example_sentence: "The world must find a way to produce enough food for its growing population.",
    example_translation_uz: "Dunyo o'sib borayotgan aholisi uchun yetarli oziq-ovqat ishlab chiqarish yo'lini topishi kerak.",
    synonyms: ['nourishment', 'sustenance', 'nutrition', 'provisions', 'fare'],
    collocations: ['food production', 'food security', 'food supply'],
    difficulty: 'easy',
    topic: 'Reading Academic',
  },
  agriculture: {
    word: 'agriculture',
    base_form: 'agriculture',
    part_of_speech: 'noun',
    pronunciation: '/ˈæɡ.rɪ.kʌl.tʃər/',
    translation_uz: "qishloq xo'jaligi, dehqonchilik",
    definition_uz: "Oziq-ovqat va xom ashyo yetishtirish uchun yer va chorvachilikdan foydalanish ilmi va amaliyoti",
    context_meaning_uz: '"agriculture" so\'zi ekin-tikin va chorvachilikni o\'z ichiga olgan qishloq xo\'jaligi faoliyatini bildiradi.',
    example_sentence: "Modern agriculture relies heavily on synthetic fertilizers and advanced technology.",
    example_translation_uz: "Zamonaviy qishloq xo'jaligi sintetik o'g'itlar va ilg'or texnologiyalarga katta tayanadi.",
    synonyms: ['farming', 'cultivation', 'husbandry', 'agronomy', 'tillage'],
    collocations: ['organic agriculture', 'sustainable agriculture', 'agricultural methods'],
    difficulty: 'medium',
    topic: 'Reading Academic',
  },
  organic: {
    word: 'organic',
    base_form: 'organic',
    part_of_speech: 'adjective',
    pronunciation: '/ɔːˈɡæn.ɪk/',
    translation_uz: "organik, tabiiy, kimyoviy bo'yoqsiz",
    definition_uz: "Sun'iy kimyoviy moddalar ishlatilmasdan tabiiy usulda yetishtiriladigan mahsulotlarga taalluqli",
    context_meaning_uz: '"organic" so\'zi ushbu matnda kimyoviy o\'g\'it va pestitsidlardan foydalanmasdan yetishtiriladigan tabiiy dehqonchilik usulini ifodalaydi.',
    example_sentence: "Organic farmers rely on natural fertilizers instead of synthetic chemicals.",
    example_translation_uz: "Organik dehqonlar sintetik kimyoviy moddalar o'rniga tabiiy o'g'itlardan foydalanadilar.",
    synonyms: ['natural', 'biodynamic', 'chemical-free', 'ecological', 'sustainable'],
    collocations: ['organic farming', 'organic food', 'organic methods'],
    difficulty: 'medium',
    topic: 'Reading Academic',
  },
  fertilizer: {
    word: 'fertilizer',
    base_form: 'fertilizer',
    part_of_speech: 'noun',
    pronunciation: '/ˈfɜː.tɪ.laɪ.zər/',
    translation_uz: "o'g'it, mineral qo'shilma",
    definition_uz: "Tuproqni boyitish va ekinlarning o'sishini tezlashtirish uchun ishlatiladigan tabiiy yoki kimyoviy modda",
    context_meaning_uz: '"fertilizer" so\'zi tuproqqa qo\'shib, hosilni oshirish uchun ishlatiladigan tabiiy yoki sintetik o\'g\'itni anglatadi.',
    example_sentence: "The overuse of chemical fertilizers can lead to serious environmental damage.",
    example_translation_uz: "Kimyoviy o'g'itlarning haddan tashqari ishlatilishi jiddiy ekologik zararaga olib kelishi mumkin.",
    synonyms: ['manure', 'compost', 'nutrients', 'top dressing', 'enrichment'],
    collocations: ['synthetic fertilizer', 'apply fertilizer', 'fertilizer use'],
    difficulty: 'medium',
    topic: 'Reading Academic',
  },
  yield: {
    word: 'yield',
    base_form: 'yield',
    part_of_speech: 'noun/verb',
    pronunciation: '/jiːld/',
    translation_uz: "hosil, mahsulot bermoq",
    definition_uz: "Ekin maydonidan olinadigan mahsulot miqdori yoki foydali natija",
    context_meaning_uz: '"yield" so\'zi ushbu matnda dehqonchilik natijasida olinadigan hosil miqdorini ifodalaydi.',
    example_sentence: "New farming techniques have significantly increased crop yields in the region.",
    example_translation_uz: "Yangi dehqonchilik usullari mintaqada hosil miqdorini sezilarli darajada oshirdi.",
    synonyms: ['produce', 'output', 'harvest', 'return', 'crop'],
    collocations: ['crop yield', 'high yield', 'yield increase'],
    difficulty: 'medium',
    topic: 'Reading Academic',
  },
  ideology: {
    word: 'ideology',
    base_form: 'ideology',
    part_of_speech: 'noun',
    pronunciation: '/ˌaɪ.diˈɒl.ə.dʒi/',
    translation_uz: "mafkura, g'oyalar tizimi",
    definition_uz: "Biror guruh, harakat yoki jamiyatning e'tiqodlari va qadriyatlarining to'plami",
    context_meaning_uz: '"ideology" so\'zi ushbu matnda dehqonchilikka oid turli g\'oyaviy nuqtai nazarlar yoki siyosiy-iqtisodiy e\'tiqodlar tizimini ifodalaydi.',
    example_sentence: "If you set ideology aside, practical solutions become much easier to find.",
    example_translation_uz: "Mafkurani chetga surib qo'ysangiz, amaliy yechimlarni topish ancha osonlashadi.",
    synonyms: ['doctrine', 'belief system', 'philosophy', 'worldview', 'principles'],
    collocations: ['political ideology', 'set ideology aside', 'ideological debate'],
    difficulty: 'hard',
    topic: 'Reading Academic',
  },
  replace: {
    word: 'replace',
    base_form: 'replace',
    part_of_speech: 'verb',
    pronunciation: '/rɪˈpleɪs/',
    translation_uz: "almashtirmoq, o'rnini bosmoq",
    definition_uz: "Biror narsa yoki shaxsning o'rniga boshqasini qo'yish yoki yangilash",
    context_meaning_uz: "\"replace\" so'zi ushbu kontekstda biror narsani yangisiga almashtirish yoki o'rnini to'ldirish ma'nosida qo'llangan.",
    example_sentence: "The university decided to replace obsolete computers with high-performance workstations.",
    example_translation_uz: "Universitet eskirgan kompyuterlarni yuqori unumli ish stantsiyalariga almashtirishga qaror qildi.",
    synonyms: ['substitute', 'exchange', 'displace', 'supersede', 'swap'],
    collocations: ['replace with', 'permanently replace', 'replace entirely'],
    difficulty: 'medium',
    topic: 'Reading Academic',
  },
  fluctuate: {
    word: 'fluctuate',
    base_form: 'fluctuate',
    part_of_speech: 'verb',
    pronunciation: '/ˈflʌk.tʃu.eɪt/',
    translation_uz: "o'zgarib turmoq, tebranmoq",
    definition_uz: "Miqdor, narx yoki darajaning doimiy ravishda ko'tarilib-tushib turishi",
    context_meaning_uz: "\"fluctuate\" so'zi ko'rsatkichlarning bir me'yorda turmay tez-tez o'zgarib turishini ifodalaydi.",
    example_sentence: "Vegetable prices fluctuate depending on the season and weather conditions.",
    example_translation_uz: "Sabzavot narxlari fasl va ob-havo sharoitiga qarab o'zgarib turadi.",
    synonyms: ['vary', 'oscillate', 'waver', 'shift', 'alternate'],
    collocations: ['fluctuate wildly', 'fluctuate between', 'fluctuate significantly'],
    difficulty: 'medium',
    topic: 'Reading Academic',
  },
  allocate: {
    word: 'allocate',
    base_form: 'allocate',
    part_of_speech: 'verb',
    pronunciation: '/ˈæl.ə.keɪt/',
    translation_uz: "ajratmoq, taqsimlamoq",
    definition_uz: "Muayyan maqsad uchun mablag', resurs yoki vaqt ajratish",
    context_meaning_uz: "\"allocate\" so'zi cheklangan resurslarni aniq rejaga muvofiq taqsimlashni bildiradi.",
    example_sentence: "The local government agreed to allocate more funds to public healthcare.",
    example_translation_uz: "Mahalliy hokimiyat sog'liqni saqlash sohasiga ko'proq mablag' ajratishga rozi bo'ldi.",
    synonyms: ['assign', 'allot', 'designate', 'distribute', 'apportion'],
    collocations: ['allocate resources', 'allocate funds', 'allocate time'],
    difficulty: 'medium',
    topic: 'Reading Academic',
  },
  sustain: {
    word: 'sustain',
    base_form: 'sustain',
    part_of_speech: 'verb',
    pronunciation: '/səˈsteɪn/',
    translation_uz: "saqlab turmoq, bardavom qilmoq",
    definition_uz: "Biror faoliyat yoki holatni uzoq vaqt davomida to'xtatmasdan ushlab turish",
    context_meaning_uz: "\"sustain\" so'zi o'sish yoki hayotiy faoliyatni uzluksiz ta'minlash ma'nosida keladi.",
    example_sentence: "Developing countries must adopt renewable energy to sustain economic growth.",
    example_translation_uz: "Rivojlanayotgan davlatlar iqtisodiy o'sishni saqlab qolish uchun qayta tiklanuvchi energiyani joriy etishlari kerak.",
    synonyms: ['maintain', 'prolong', 'uphold', 'preserve', 'support'],
    collocations: ['sustain growth', 'sustain life', 'sustain damage'],
    difficulty: 'hard',
    topic: 'Reading Academic',
  },
  diminish: {
    word: 'diminish',
    base_form: 'diminish',
    part_of_speech: 'verb',
    pronunciation: '/dɪˈmɪn.ɪʃ/',
    translation_uz: "kamaymoq, qisqarmoq, susaymoq",
    definition_uz: "Hajm, ahamiyat yoki kuch jihatidan kichrayish yoki pasayish",
    context_meaning_uz: "\"diminish\" so'zi qiymat yoki ta'sirning sezilarli darajada pasayishini bildiradi.",
    example_sentence: "The company's influence began to diminish after several management failures.",
    example_translation_uz: "Boshqaruvdagi bir qator xatolardan so'ng kompaniyaning ta'siri kamaya boshladi.",
    synonyms: ['decrease', 'lessen', 'dwindle', 'decline', 'subside'],
    collocations: ['diminish rapidly', 'diminish over time', 'diminish importance'],
    difficulty: 'hard',
    topic: 'Reading Academic',
  },
  comprehensive: {
    word: 'comprehensive',
    base_form: 'comprehensive',
    part_of_speech: 'adjective',
    pronunciation: '/ˌkɒm.prɪˈhen.sɪv/',
    translation_uz: "keng qamrovli, har tomonlama, to'liq",
    definition_uz: "Barcha jihat va tafsilotlarni to'liq o'z ichiga olgan mukammal tushuncha",
    context_meaning_uz: "\"comprehensive\" so'zi biror mavzu yoki tadqiqotning har tomonlama chuqur ekanligini ko'rsatadi.",
    example_sentence: "Researchers conducted a comprehensive study on modern urban transport systems.",
    example_translation_uz: "Tadqiqotchilar zamonaviy shahar transport tizimlari bo'yicha keng qamrovli o'rganish o'tkazdilar.",
    synonyms: ['exhaustive', 'thorough', 'all-inclusive', 'extensive', 'complete'],
    collocations: ['comprehensive study', 'comprehensive review', 'comprehensive approach'],
    difficulty: 'hard',
    topic: 'Reading Academic',
  },
  significant: {
    word: 'significant',
    base_form: 'significant',
    part_of_speech: 'adjective',
    pronunciation: '/sɪɡˈnɪf.ɪ.kənt/',
    translation_uz: "muhim, sezilarli, ahamiyatli",
    definition_uz: "O'ziga xos e'tiborga loyiq va sezilarli natija yoki o'zgarishga ega bo'lgan",
    context_meaning_uz: "\"significant\" so'zi o'rganilayotgan hodisaning alohida ahamiyatga egaligini ta'kidlaydi.",
    example_sentence: "There has been a significant increase in online learning enrollment this year.",
    example_translation_uz: "Bu yil onlayn ta'limga yozilishda sezilarli o'sish kuzatildi.",
    synonyms: ['notable', 'substantial', 'considerable', 'meaningful', 'momentous'],
    collocations: ['significant impact', 'significant difference', 'significant increase'],
    difficulty: 'medium',
    topic: 'Reading Academic',
  },
  inevitable: {
    word: 'inevitable',
    base_form: 'inevitable',
    part_of_speech: 'adjective',
    pronunciation: '/ɪnˈev.ɪ.tə.bəl/',
    translation_uz: "muqarrar, qochib bo'lmaydigan",
    definition_uz: "Oldini olib bo'lmaydigan va albatta yuz beradigan holat",
    context_meaning_uz: "\"inevitable\" so'zi jarayonning tabiiy va qochib bo'lmas oqibatini bildiradi.",
    example_sentence: "With rapid climate change, extreme weather events have become inevitable.",
    example_translation_uz: "Iqlimning tez o'zgarishi bilan ekstremal ob-havo hodisalari muqarrar bo'lib qoldi.",
    synonyms: ['unavoidable', 'inescapable', 'certain', 'fated', 'predetermined'],
    collocations: ['inevitable consequence', 'inevitable outcome', 'virtually inevitable'],
    difficulty: 'hard',
    topic: 'Reading Academic',
  },
  implement: {
    word: 'implement',
    base_form: 'implement',
    part_of_speech: 'verb',
    pronunciation: '/ˈɪm.plɪ.ment/',
    translation_uz: "amalga oshirmoq, joriy qilmoq",
    definition_uz: "Reja, qaror yoki qonunni amalda qo'llash yoki hayotga tatbiq etish",
    context_meaning_uz: "\"implement\" so'zi nazariy takliflarni bevosita amaliyotga kiritishni anglatadi.",
    example_sentence: "Schools should implement innovative teaching methodologies to engage students.",
    example_translation_uz: "Maktablar o'quvchilarni jalb qilish uchun innovatsion o'qitish metodikalarini joriy etishlari lozim.",
    synonyms: ['execute', 'enact', 'apply', 'put into practice', 'enforce'],
    collocations: ['implement a policy', 'implement changes', 'implement a strategy'],
    difficulty: 'medium',
    topic: 'Reading Academic',
  },
  undertake: {
    word: 'undertake',
    base_form: 'undertake',
    part_of_speech: 'verb',
    pronunciation: '/ˌʌn.dəˈteɪk/',
    translation_uz: "o'z zimmasiga olmoq, boshlamoq",
    definition_uz: "Katta mas'uliyat talab qiladigan vazifa yoki loyihani bajarishga kirishmoq",
    context_meaning_uz: "\"undertake\" so'zi murakkab loyiha yoki ilmiy ishga mas'uliyat bilan kirishishni bildiradi.",
    example_sentence: "Scientists decided to undertake a five-year investigation into deep sea biodiversity.",
    example_translation_uz: "Olimlar chuqur dengiz bioxilma-xilligi bo'yicha besh yillik tadqiqotni boshlashga kirishdilar.",
    synonyms: ['embark on', 'commence', 'assume', 'tackle', 'engage in'],
    collocations: ['undertake a study', 'undertake a project', 'undertake research'],
    difficulty: 'hard',
    topic: 'Reading Academic',
  }
}

// Decode HTML entities from translation APIs (e.g. &#39; -> ', &quot; -> ")
function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
}

// Live translation helper — uses Gemini AI as primary, Google Translate + MyMemory as fallbacks
async function liveTranslate(text: string, from = 'en', to = 'uz'): Promise<{ text: string; phonetic?: string; pos?: string; synonyms?: string[] }> {
  const cleanText = text.trim()
  const apiKey = process.env.GEMINI_API_KEY || ''
  const translateModels = ['gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-3.5-flash']

  // 1. Try Gemini AI translation (best quality)
  if (apiKey) {
    const isWord = cleanText.split(/\s+/).length <= 3
    const prompt = isWord
      ? `Translate this English word/phrase to Uzbek. Reply with ONLY the Uzbek translation (1-5 words), no explanation, no punctuation: ${cleanText}`
      : `Translate this English sentence to natural, fluent Uzbek. Reply with ONLY the Uzbek translation, nothing else: ${cleanText}`

    for (const model of translateModels) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-goog-api-key': apiKey },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.05, maxOutputTokens: 200 },
          }),
          signal: AbortSignal.timeout(6000),
        })
        if (!res.ok) { console.warn(`[Gemini Translate] ${model} status ${res.status}`); continue }
        const data: any = await res.json()
        const translated = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
        if (translated && translated !== cleanText && translated.length > 0) {
          return { text: decodeHtmlEntities(translated) }
        }
      } catch (gErr: any) {
        console.warn(`[Gemini Translate] ${model} error:`, gErr.message)
      }
    }
  }

  // 2. Fallback: Google Translate (may be blocked on datacenter IPs)
  try {
    const q = encodeURIComponent(cleanText)
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&dt=bd&dt=rm&q=${q}`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) throw new Error(`Translate status ${res.status}`)
    const data: any = await res.json()

    let translated = ''
    if (Array.isArray(data[0])) {
      translated = data[0].map((item: any) => item?.[0]).filter(Boolean).join(' ')
    }
    if (!translated || translated === cleanText) throw new Error('Empty or unchanged translation')

    const phonetic = data[0]?.[1]?.[3] || undefined
    let pos = undefined
    let synonyms: string[] = []
    if (Array.isArray(data[1]) && data[1].length > 0) {
      pos = data[1][0]?.[0]
      if (Array.isArray(data[1][0]?.[1])) synonyms = data[1][0][1].slice(0, 5)
    }

    return { text: decodeHtmlEntities(translated.trim()), phonetic, pos, synonyms }
  } catch (googleErr: any) {
    console.warn('[Google Translate fallback]:', googleErr.message)
  }

  // 3. Final fallback: MyMemory API
  try {
    const mmUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanText)}&langpair=${from}|${to}`
    const res = await fetch(mmUrl, { signal: AbortSignal.timeout(6000) })
    if (!res.ok) throw new Error(`MyMemory status ${res.status}`)
    const data: any = await res.json()
    const translated = data?.responseData?.translatedText
    if (translated && translated !== cleanText && !translated.toLowerCase().includes('mymemory')) {
      return { text: decodeHtmlEntities(translated.trim()) }
    }
    throw new Error('MyMemory returned empty or fallback text')
  } catch (mmErr: any) {
    console.warn('[MyMemory Translate Error]:', mmErr.message)
  }

  // 4. Last resort: return original text unchanged
  return { text: cleanText }
}

async function lookupWordWithGemini(word: string, context?: string, passageTitle?: string) {
  const cleanWord = word.trim().toLowerCase()
  const apiKey = process.env.GEMINI_API_KEY || ''
  // Updated model list — gemini-3.8-flash is the current recommended model
  const models = ['gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-2.0-flash']

  const prompt = `You are an expert Cambridge IELTS vocabulary tutor and bilingual Uzbek-English lexicographer.
A student selected the word or phrase "${word}" from an IELTS Reading passage.

Context Sentence from the Passage:
"${context || word}"

Passage Title:
"${passageTitle || 'IELTS Reading'}"

Analyze this word SPECIFICALLY in this reading context and provide the precise Uzbek translation and educational breakdown for an IELTS candidate.

Output ONLY a JSON object matching this exact structure:
{
  "word": "${cleanWord}",
  "base_form": "dictionary/lemma base form in lowercase",
  "part_of_speech": "noun | verb | adjective | adverb | idiom | phrase",
  "pronunciation": "IPA phonetic transcription (e.g. /ˈkɒm.prɪ.hen.sɪv/)",
  "translation_uz": "eng aniq va to'g'ri o'zbekcha tarjimasi (aynan shu kontekstdagi)",
  "definition_uz": "so'zning qisqa va oson tushuniladigan o'zbekcha ta'rifi",
  "context_meaning_uz": "ushbu matnda qanday ma'no kasb etayotgani haqida 1 jumlalik tushuntirish",
  "example_sentence": "the original context sentence or a clear natural example sentence",
  "example_translation_uz": "misol jumlaining o'zbekcha tarjimasi",
  "synonyms": ["sinonim 1", "sinonim 2", "sinonim 3"],
  "collocations": ["birikma 1", "birikma 2"],
  "difficulty": "easy | medium | hard",
  "topic": "Reading Academic"
}`

  // 1. Try Gemini AI if API key is configured
  if (apiKey) {
    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.1,
            },
          }),
        })

        if (!res.ok) {
          console.warn(`[Gemini Vocab Lookup] Model ${model} returned status ${res.status}. Trying next...`)
          continue
        }

        const data: any = await res.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (text) {
          const parsed = JSON.parse(text)
          if (parsed.translation_uz && !parsed.translation_uz.includes('(tarjima)')) {
            return parsed
          }
        }
      } catch (err: any) {
        console.warn(`[Gemini Vocab Lookup] Model ${model} error:`, err.message)
      }
    }
  }

  // 2. High-precision curated IELTS Academic Lexicon
  const dictHit = IELTS_ACADEMIC_DICT[cleanWord]
  if (dictHit) {
    let exampleSentence = dictHit.example_sentence
    let exampleTranslation = dictHit.example_translation_uz

    // If student highlighted a sentence from passage, use the passage sentence and translate it
    if (context && context.trim().length > cleanWord.length + 5) {
      exampleSentence = context.trim()
      const tr = await liveTranslate(exampleSentence)
      if (tr.text) exampleTranslation = tr.text
    }

    return {
      ...dictHit,
      example_sentence: exampleSentence,
      example_translation_uz: exampleTranslation,
      topic: passageTitle ? `Reading: ${passageTitle.slice(0, 30)}` : dictHit.topic,
    }
  }

  // 3. Dynamic Live Translation & Linguistic Parser
  const wordLookup = await liveTranslate(cleanWord)
  const uzbekWord = wordLookup.text || cleanWord

  // Translate surrounding sentence if available
  let exampleSentence = context && context.trim().length > cleanWord.length + 5
    ? context.trim()
    : `It is essential to understand how ${cleanWord} is applied in modern academic research.`
  let exampleTranslation = ''
  if (exampleSentence) {
    const tr = await liveTranslate(exampleSentence)
    exampleTranslation = tr.text
  }

  const difficulty = cleanWord.length > 9 ? 'hard' : cleanWord.length > 5 ? 'medium' : 'easy'

  return {
    word: cleanWord,
    base_form: cleanWord,
    part_of_speech: wordLookup.pos || (cleanWord.endsWith('ly') ? 'adverb' : cleanWord.endsWith('tion') ? 'noun' : 'word'),
    pronunciation: wordLookup.phonetic ? `/${wordLookup.phonetic}/` : '',
    translation_uz: uzbekWord,
    definition_uz: `${cleanWord} — ${uzbekWord}. Ushbu akademik kontekstda asosiy tushuncha sifatida qo'llangan.`,
    context_meaning_uz: `"${cleanWord}" so'zi ushbu matnda "${uzbekWord}" ma'nosida qo'llanilgan.`,
    example_sentence: exampleSentence,
    example_translation_uz: exampleTranslation,
    synonyms: wordLookup.synonyms && wordLookup.synonyms.length > 0 ? wordLookup.synonyms : [],
    collocations: [`apply ${cleanWord}`, `${cleanWord} in context`],
    difficulty,
    topic: passageTitle ? `Reading: ${passageTitle.slice(0, 30)}` : 'Reading Academic',
  }
}

// 3. AI CONTEXTUAL LOOKUP (PREMIUM ONLY)
router.post('/ai-lookup', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const userRole = req.user!.role
    const { word, context, passageTitle } = req.body

    if (!word || typeof word !== 'string' || !word.trim()) {
      return res.status(400).json({ error: 'Word is required' })
    }

    const cleanWord = word.trim().slice(0, 100)

    // Check premium status
    const isPremium = await checkUserIsPremium(userId, userRole)
    if (!isPremium) {
      return res.status(403).json({
        success: false,
        error: 'AI Contextual Dictionary is available for Foxford Premium users only.',
        requires_premium: true,
      })
    }

    // Call Gemini for contextual translation
    const result = await lookupWordWithGemini(cleanWord, context, passageTitle)

    // Check if word is already saved in this user's vocabulary
    const userWordCheck = await query(
      `SELECT uv.id, uv.status, uv.mastery_level
       FROM user_vocabulary uv
       JOIN vocabulary_words vw ON vw.id = uv.word_id
       WHERE uv.user_id = $1 AND LOWER(vw.word) = LOWER($2)
       LIMIT 1`,
      [userId, result.word || cleanWord]
    )

    const isSaved = userWordCheck.rows.length > 0
    const userStatus = userWordCheck.rows[0]?.status || null

    return res.json({
      success: true,
      data: {
        ...result,
        is_saved: isSaved,
        user_status: userStatus,
      },
    })
  } catch (error: any) {
    console.error('AI vocab lookup error:', error)
    return res.status(500).json({ error: 'Error analyzing vocabulary with AI' })
  }
})

// 4. 1-CLICK SAVE WORD FROM READING TO VOCABULARY (PREMIUM ONLY)
router.post('/save-from-reading', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const userRole = req.user!.role
    const {
      word,
      definition,
      example_sentence,
      pronunciation,
      part_of_speech,
      topic = 'Reading Academic',
      difficulty = 'medium',
    } = req.body

    if (!word || !definition) {
      return res.status(400).json({ error: 'Word and definition are required' })
    }

    const isPremium = await checkUserIsPremium(userId, userRole)
    if (!isPremium) {
      return res.status(403).json({
        success: false,
        error: 'Premium subscription required',
        requires_premium: true,
      })
    }

    const cleanWord = word.trim()

    // 1. Check or insert into vocabulary_words
    let wordId: string
    const existingWordRes = await query(
      'SELECT id, definition FROM vocabulary_words WHERE LOWER(word) = LOWER($1)',
      [cleanWord]
    )

    if (existingWordRes.rows.length > 0) {
      wordId = existingWordRes.rows[0].id
      // If definition or example was previously empty, update with rich AI context
      if (!existingWordRes.rows[0].definition && definition) {
        await query(
          'UPDATE vocabulary_words SET definition = $1, example_sentence = COALESCE(example_sentence, $2), pronunciation = COALESCE(pronunciation, $3), updated_at = NOW() WHERE id = $4',
          [definition, example_sentence || null, pronunciation || null, wordId]
        )
      }
    } else {
      const insertWordRes = await query(
        `INSERT INTO vocabulary_words (
          id, word, definition, example_sentence, pronunciation, part_of_speech, topic, difficulty, is_premium, status
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, true, 'published'
        ) RETURNING id`,
        [
          cleanWord,
          definition,
          example_sentence || null,
          pronunciation || null,
          part_of_speech || null,
          topic || 'Reading Academic',
          difficulty || 'medium',
        ]
      )
      wordId = insertWordRes.rows[0].id
    }

    // 2. Link with user_vocabulary (SRS Spaced Repetition)
    const existingUserVocab = await query(
      'SELECT id, status, mastery_level FROM user_vocabulary WHERE user_id = $1 AND word_id = $2',
      [userId, wordId]
    )

    if (existingUserVocab.rows.length > 0) {
      return res.json({
        success: true,
        already_saved: true,
        wordId,
        message: 'Bu so\'z allaqachon lug\'atingizga qo\'shilgan!',
      })
    }

    // Insert fresh record: status 'new', mastery_level 0, next_review_at NOW()
    await query(
      `INSERT INTO user_vocabulary (
        id, user_id, word_id, status, mastery_level, next_review_at, review_count
      ) VALUES (
        gen_random_uuid(), $1, $2, 'new', 0, NOW(), 0
      )`,
      [userId, wordId]
    )

    return res.json({
      success: true,
      saved: true,
      wordId,
      message: 'Word successfully added to personal vocabulary!',
    })
  } catch (error: any) {
    console.error('Save from reading error:', error)
    return res.status(500).json({ error: 'Error saving word to vocabulary' })
  }
})

export default router
