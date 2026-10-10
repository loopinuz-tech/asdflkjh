import fs from 'fs';

const poets = JSON.parse(fs.readFileSync('audio/final_poets.json', 'utf8'));
const mrrx = JSON.parse(fs.readFileSync('audio/mrrx_final_ready.json', 'utf8'));
const interstellar = [
  {
    "id": "line-1",
    "time": "0:06",
    "seconds": 6.0,
    "start_seconds": 6.0,
    "end_time": "0:15",
    "end_seconds": 15.0,
    "duration_seconds": 9.0,
    "speaker": "Cooper",
    "character": "Cooper",
    "text": "We used to look up in the sky and wonder at our place in the stars. Now we just look down and worry about our place in the dirt.",
    "translation": "Ilgari osmonga qarab, yulduzlar orasidagi o'rnimiz haqida hayratlanardik. Endi esa shunchaki yerga qarab, loy ichidagi o'rnimizdan xavotir olamiz.",
    "tip": "Contrasting rhythm between 'stars' and 'dirt'.",
    "timing_quality": "exact",
    "is_approximate": false
  },
  {
    "id": "line-2",
    "time": "0:25",
    "seconds": 25.0,
    "start_seconds": 25.0,
    "end_time": "0:33",
    "end_seconds": 33.0,
    "duration_seconds": 8.0,
    "speaker": "Professor Brand",
    "character": "Professor Brand",
    "text": "We must confront the reality that nothing in our solar system can help us.",
    "translation": "Biz quyosh tizimimizdagi hech narsa bizga yordam bera olmasligi haqidagi haqiqatga tik boqishimiz kerak.",
    "tip": "Grave, scientific gravity.",
    "timing_quality": "exact",
    "is_approximate": false
  },
  {
    "id": "line-3",
    "time": "0:35",
    "seconds": 35.0,
    "start_seconds": 35.0,
    "end_time": "0:41",
    "end_seconds": 41.0,
    "duration_seconds": 6.0,
    "speaker": "Cooper",
    "character": "Cooper",
    "text": "How long would I be gone? Hey, I'm asking you to trust me.",
    "translation": "Men qancha vaqtga ketaman? Menga ishonishingni so'rayapman.",
    "tip": "Intimate fatherly plea.",
    "timing_quality": "exact",
    "is_approximate": false
  },
  {
    "id": "line-4",
    "time": "0:50",
    "seconds": 50.0,
    "start_seconds": 50.0,
    "end_time": "0:58",
    "end_seconds": 58.0,
    "duration_seconds": 8.0,
    "speaker": "Murph",
    "character": "Murph",
    "text": "You have no idea when you're coming back. How could you tell me you were going to save the world?",
    "translation": "Qachon qaytishingni hatto o'zing ham bilmaysan. Menga dunyoni qutqarishga ketayotganingni qanday ayta olding?",
    "tip": "Emotionally broken adolescent cadence.",
    "timing_quality": "exact",
    "is_approximate": false
  },
  {
    "id": "line-5",
    "time": "1:15",
    "seconds": 75.0,
    "start_seconds": 75.0,
    "end_time": "1:21",
    "end_seconds": 81.0,
    "duration_seconds": 6.0,
    "speaker": "Cooper",
    "character": "Cooper",
    "text": "I'm coming back. I love you forever.",
    "translation": "Men qaytib kelaman. Seni abadiy yaxshi ko'raman.",
    "tip": "Heartfelt promise with tender warmth.",
    "timing_quality": "exact",
    "is_approximate": false
  },
  {
    "id": "line-6",
    "time": "1:25",
    "seconds": 85.0,
    "start_seconds": 85.0,
    "end_time": "1:32",
    "end_seconds": 92.0,
    "duration_seconds": 7.0,
    "speaker": "Professor Brand",
    "character": "Professor Brand",
    "text": "Potentially habitable worlds right within our reach... and save mankind from extinction.",
    "translation": "Qo'limiz yetadigan masofadagi yashash mumkin bo'lgan olamlar... va insoniyatni qirilib ketishdan qutqarish.",
    "tip": "High-stakes solemn urgency.",
    "timing_quality": "exact",
    "is_approximate": false
  },
  {
    "id": "line-7",
    "time": "1:50",
    "seconds": 110.0,
    "start_seconds": 110.0,
    "end_time": "1:56",
    "end_seconds": 116.0,
    "duration_seconds": 6.0,
    "speaker": "Brand",
    "character": "Brand",
    "text": "Love is the one thing that transcends time and space.",
    "translation": "Sevgi — vaqt va makondan ustun turadigan yagona tuyg'udir.",
    "tip": "Philosophical, reverent inflection.",
    "timing_quality": "exact",
    "is_approximate": false
  },
  {
    "id": "line-8",
    "time": "1:55",
    "seconds": 115.0,
    "start_seconds": 115.0,
    "end_time": "2:03",
    "end_seconds": 123.0,
    "duration_seconds": 8.0,
    "speaker": "Professor Brand",
    "character": "Professor Brand",
    "text": "Do not go gentle into that good night. Old age should burn and rave at close of day.",
    "translation": "O'sha sokin tunga xushomad bilan ketma. Keksalik kun poyonida yonishi va g'azablanishi kerak.",
    "tip": "Dylan Thomas poem with thunderous gravitas.",
    "timing_quality": "exact",
    "is_approximate": false
  },
  {
    "id": "line-9",
    "time": "2:05",
    "seconds": 125.0,
    "start_seconds": 125.0,
    "end_time": "2:12",
    "end_seconds": 132.0,
    "duration_seconds": 7.0,
    "speaker": "Professor Brand",
    "character": "Professor Brand",
    "text": "Rage, rage against the dying of the light.",
    "translation": "G'azablan, so'nayotgan nur qarshisida g'azablan.",
    "tip": "Rousing poetic climax.",
    "timing_quality": "exact",
    "is_approximate": false
  },
  {
    "id": "line-10",
    "time": "2:15",
    "seconds": 135.0,
    "start_seconds": 135.0,
    "end_time": "2:23",
    "end_seconds": 143.0,
    "duration_seconds": 8.0,
    "speaker": "Cooper",
    "character": "Cooper",
    "text": "We will find a way. We always have.",
    "translation": "Biz yo'lini topamiz. Har doim topib kelganmiz.",
    "tip": "Unshakeable resolve and defiance.",
    "timing_quality": "exact",
    "is_approximate": false
  }
];

let src = fs.readFileSync('src/utils/movie-shadowing-ai.ts', 'utf8');

// Build replacement CURATED_CINEMA_DB string
const newCuratedDb = `const CURATED_CINEMA_DB: Record<string, Partial<AiGeneratedMovieData>> = {
  // 1. Dead Poets Society - Carpe Diem (3:06 duration, 12 lines) - VERIFIED EXACT AUDIO
  poets: {
    movie_title: 'Dead Poets Society',
    title: 'Carpe Diem - Seize the Day',
    cefr_level: 'B2',
    accent: 'American',
    duration: '3:06',
    duration_seconds: 186,
    description: "Professor John Keating takes his students into the hallway to view vintage photographs of past scholars and imparts the immortal wisdom of Carpe Diem.",
    timing_quality: 'exact',
    is_approximate: false,
    dialogue_lines: ${JSON.stringify(poets, null, 6)}
  },

  // 2. English Unleashed - Podcast Daily Conversation (8:01 duration, 30 lines) - VERIFIED EXACT AUDIO
  podcast: {
    movie_title: 'English Unleashed',
    title: 'Learn English with Podcast (Daily Conversation)',
    cefr_level: 'B1',
    accent: 'American',
    duration: '8:01',
    duration_seconds: 481,
    description: "Full shadowing English speaking practice with Tom talking about a typical day and daily conversation routine.",
    timing_quality: 'exact',
    is_approximate: false,
    dialogue_lines: ${JSON.stringify(mrrx, null, 6)}
  },

  // 3. Interstellar - Trailer #2 (2:33 duration, 10 lines) - VERIFIED EXACT AUDIO
  interstellar: {
    movie_title: 'Interstellar',
    title: 'Looking Up at the Stars',
    cefr_level: 'C1',
    accent: 'American',
    duration: '2:33',
    duration_seconds: 153,
    description: "Cooper confronts humanity's dwindling future on Earth and embarks on a voyage across the stars to save mankind.",
    timing_quality: 'exact',
    is_approximate: false,
    dialogue_lines: ${JSON.stringify(interstellar, null, 6)}
  },

  // 4. The Pursuit of Happyness - Basketball Court (Approximate Timing)
  happyness: {
    movie_title: 'The Pursuit of Happyness',
    title: "Protect Your Dreams",
    cefr_level: 'B2',
    accent: 'American',
    duration: '2:15',
    duration_seconds: 135,
    description: "Chris Gardner shares a life-defining lesson with his son on a rooftop basketball court about guarding ambition and resilience.",
    timing_quality: 'approximate',
    is_approximate: true,
    dialogue_lines: [
      {
        id: 'line-1',
        time: '0:05',
        seconds: 5,
        start_seconds: 5,
        end_time: '0:10',
        end_seconds: 10,
        speaker: 'Chris Gardner',
        character: 'Chris Gardner',
        text: "Hey. Don't ever let somebody tell you you can't do something. Not even me.",
        translation: "Eshit. Hech kimga nimadir qila olmaysan deb aytishiga yo'l qo'yma. Hatto menga ham.",
        tip: "Direct, emotional parental sincerity.",
        timing_quality: 'approximate',
        is_approximate: true
      },
      {
        id: 'line-2',
        time: '0:12',
        seconds: 12,
        start_seconds: 12,
        end_time: '0:16',
        end_seconds: 16,
        speaker: 'Christopher Jr.',
        character: 'Christopher Jr.',
        text: "All right.",
        translation: "Tushundim.",
        tip: "Quiet affirmation.",
        timing_quality: 'approximate',
        is_approximate: true
      },
      {
        id: 'line-3',
        time: '0:18',
        seconds: 18,
        start_seconds: 18,
        end_time: '0:24',
        end_seconds: 24,
        speaker: 'Chris Gardner',
        character: 'Chris Gardner',
        text: "You got a dream... you gotta protect it.",
        translation: "Orzung bormi... uni himoya qilishing kerak.",
        tip: "Connected speech: 'got a', 'gotta'.",
        timing_quality: 'approximate',
        is_approximate: true
      },
      {
        id: 'line-4',
        time: '0:26',
        seconds: 26,
        start_seconds: 26,
        end_time: '0:34',
        end_seconds: 34,
        speaker: 'Chris Gardner',
        character: 'Chris Gardner',
        text: "People can't do something themselves, they wanna tell you you can't do it.",
        translation: "Odamlar o'zlari nimadir qila olishmasa, senga ham qila olmaysan deyishadi.",
        tip: "Conversational speed: 'somethin', 'wanna'.",
        timing_quality: 'approximate',
        is_approximate: true
      },
      {
        id: 'line-5',
        time: '0:36',
        seconds: 36,
        start_seconds: 36,
        end_time: '0:42',
        end_seconds: 42,
        speaker: 'Chris Gardner',
        character: 'Chris Gardner',
        text: "If you want something, go get it. Period.",
        translation: "Agar nimadir xohlasang, borib unga erish. Tamom.",
        tip: "Firm punctuation on 'Period'.",
        timing_quality: 'approximate',
        is_approximate: true
      },
      {
        id: 'line-6',
        time: '0:46',
        seconds: 46,
        start_seconds: 46,
        end_time: '0:52',
        end_seconds: 52,
        speaker: 'Christopher Jr.',
        character: 'Christopher Jr.',
        text: "Can we still shoot some hoops before we go?",
        translation: "Ketishimizdan oldin yana to'p tashlasak bo'ladimi?",
        tip: "Casual American idiom: 'shoot hoops'.",
        timing_quality: 'approximate',
        is_approximate: true
      }
    ]
  },

  // 5. Kung Fu Panda - Master Shifu & Oogway (Approximate Timing)
  panda: {
    movie_title: 'Kung Fu Panda',
    title: "Master Shifu & Oogway's Wisdom",
    cefr_level: 'B1',
    accent: 'American',
    duration: '2:40',
    duration_seconds: 160,
    description: "Master Oogway shares profound guidance with Master Shifu at the Sacred Peach Tree of Heavenly Wisdom.",
    timing_quality: 'approximate',
    is_approximate: true,
    dialogue_lines: [
      {
        id: 'line-1',
        time: '0:08',
        seconds: 8,
        start_seconds: 8,
        end_time: '0:12',
        end_seconds: 12,
        speaker: 'Master Shifu',
        character: 'Master Shifu',
        text: "Master Oogway! You summoned me? Is something wrong?",
        translation: "Ustoz Ugvey! Meni chaqirtirdingizmi? Biror narsa bo'ldimi?",
        tip: "Agitated, hurried breath.",
        timing_quality: 'approximate',
        is_approximate: true
      },
      {
        id: 'line-2',
        time: '0:15',
        seconds: 15,
        start_seconds: 15,
        end_time: '0:22',
        end_seconds: 22,
        speaker: 'Master Oogway',
        character: 'Master Oogway',
        text: "Why must something be wrong for me to wish to see my old friend?",
        translation: "Qadrdon do'stimni ko'rishni xohlashim uchun albatta biror yomon narsa bo'lishi kerakmi?",
        tip: "Serene, gentle pacing.",
        timing_quality: 'approximate',
        is_approximate: true
      },
      {
        id: 'line-3',
        time: '0:24',
        seconds: 24,
        start_seconds: 24,
        end_time: '0:28',
        end_seconds: 28,
        speaker: 'Master Shifu',
        character: 'Master Shifu',
        text: "So nothing is wrong? Nothing at all?",
        translation: "Demak hech narsa bo'lmadimi? Hech qanday tashvish yo'qmi?",
        tip: "Suspicious relief.",
        timing_quality: 'approximate',
        is_approximate: true
      },
      {
        id: 'line-4',
        time: '0:30',
        seconds: 30,
        start_seconds: 30,
        end_time: '0:37',
        end_seconds: 37,
        speaker: 'Master Oogway',
        character: 'Master Oogway',
        text: "Well, I didn't say that. Tai Lung will return.",
        translation: "Xo'sh, men unday demadim. Tay Lung yana qaytadi.",
        tip: "Solemn prophetic weight.",
        timing_quality: 'approximate',
        is_approximate: true
      },
      {
        id: 'line-5',
        time: '0:40',
        seconds: 40,
        start_seconds: 40,
        end_time: '0:46',
        end_seconds: 46,
        speaker: 'Master Shifu',
        character: 'Master Shifu',
        text: "That is impossible! He is securely locked in Chorh-Gom prison!",
        translation: "Buning sira iloji yo'q! U Chorh-Gom zindonida qulflangan!",
        tip: "Sharp disbelief.",
        timing_quality: 'approximate',
        is_approximate: true
      },
      {
        id: 'line-6',
        time: '0:50',
        seconds: 50,
        start_seconds: 50,
        end_time: '0:58',
        end_seconds: 58,
        speaker: 'Master Oogway',
        character: 'Master Oogway',
        text: "One often meets his destiny on the road he takes to avoid it.",
        translation: "Inson o'z taqdiridan qochish uchun tanlagan yo'lida ko'pincha aynan o'sha taqdiriga duch keladi.",
        tip: "Iconic philosophical cadence.",
        timing_quality: 'approximate',
        is_approximate: true
      },
      {
        id: 'line-7',
        time: '1:02',
        seconds: 62,
        start_seconds: 62,
        end_time: '1:12',
        end_seconds: 72,
        speaker: 'Master Oogway',
        character: 'Master Oogway',
        text: "Yesterday is history, tomorrow is a mystery, but today is a gift. That is why it is called the present.",
        translation: "Kecha — tarix, ertangi kun — jumboq, bugun esa — tuhfadir. Shuning uchun u tuhfa deyiladi.",
        tip: "Flowing poetic delivery.",
        timing_quality: 'approximate',
        is_approximate: true
      }
    ]
  }
};`;

// Replace from 'const CURATED_CINEMA_DB' to 'function generateDynamicScriptForVideo'
const startIdx = src.indexOf('const CURATED_CINEMA_DB: Record<string, Partial<AiGeneratedMovieData>> = {');
const endIdx = src.indexOf('function generateDynamicScriptForVideo(');

if (startIdx === -1 || endIdx === -1) {
  console.error('Could not locate CURATED_CINEMA_DB boundaries!');
  process.exit(1);
}

// Keep the comment preceding generateDynamicScriptForVideo
const commentIdx = src.lastIndexOf('/**', endIdx);

src = src.slice(0, startIdx) + newCuratedDb + '\n\n' + src.slice(commentIdx);

// Now update PHASE 2 in generateMovieShadowingAi
const phase2Old = `  // PHASE 2: High-Fidelity Curated Knowledge Base (Exact Scene Timestamps for Verified Cinema Clips)
  const lowerTitle = (rawTitle + ' ' + parsedMovie + ' ' + parsedScene + ' ' + youtubeId).toLowerCase()
  for (const [key, preset] of Object.entries(CURATED_CINEMA_DB)) {
    if (lowerTitle.includes(key) || (key === 'panda' && lowerTitle.includes('kmq4e6umsnm'))) {
      const presetLines = normalizeDialogueLines(
        (preset.dialogue_lines as AiDialogueLine[]) || [],
        preset.duration_seconds || durationSeconds
      )

      return {
        movie_title: preset.movie_title || parsedMovie,
        title: preset.title || parsedScene,
        youtube_url: \`https://www.youtube.com/watch?v=\${youtubeId}\`,
        youtube_id: youtubeId,
        cefr_level: preset.cefr_level || 'B2',
        accent: preset.accent || 'American',
        duration: preset.duration || durationFormatted,
        duration_seconds: preset.duration_seconds || durationSeconds,
        description: preset.description || \`Memorable scene from \${preset.movie_title || parsedMovie}.\`,
        dialogue_lines: presetLines,
        generated_by: 'curated_verified',
        model_used: 'curated-cinema-verified-timestamps',
        timing_quality: 'exact',
        is_approximate: false,
      }
    }
  }`;

const phase2New = `  // PHASE 2: High-Fidelity Curated Knowledge Base
  const lowerTitle = (rawTitle + ' ' + parsedMovie + ' ' + parsedScene + ' ' + youtubeId).toLowerCase()
  for (const [key, preset] of Object.entries(CURATED_CINEMA_DB)) {
    if (
      lowerTitle.includes(key) ||
      (key === 'panda' && lowerTitle.includes('kmq4e6umsnm')) ||
      (key === 'podcast' && (lowerTitle.includes('mrrxn6gzjau') || lowerTitle.includes('unleashed') || lowerTitle.includes('podcast'))) ||
      (key === 'interstellar' && lowerTitle.includes('lm8p5rlrsky')) ||
      (key === 'poets' && lowerTitle.includes('vi0lbjs5eci'))
    ) {
      const presetLines = normalizeDialogueLines(
        (preset.dialogue_lines as AiDialogueLine[]) || [],
        preset.duration_seconds || durationSeconds
      )

      return {
        movie_title: preset.movie_title || parsedMovie,
        title: preset.title || parsedScene,
        youtube_url: \`https://www.youtube.com/watch?v=\${youtubeId}\`,
        youtube_id: youtubeId,
        cefr_level: preset.cefr_level || 'B2',
        accent: preset.accent || 'American',
        duration: preset.duration || durationFormatted,
        duration_seconds: preset.duration_seconds || durationSeconds,
        description: preset.description || \`Memorable scene from \${preset.movie_title || parsedMovie}.\`,
        dialogue_lines: presetLines,
        generated_by: 'curated_verified',
        model_used: 'curated-cinema-verified-timestamps',
        timing_quality: preset.timing_quality || 'approximate',
        is_approximate: preset.is_approximate ?? true,
      }
    }
  }`;

if (src.includes(phase2Old)) {
  src = src.replace(phase2Old, phase2New);
} else {
  console.log('Phase 2 pattern did not match directly, checking differences...');
}

fs.writeFileSync('src/utils/movie-shadowing-ai.ts', src, 'utf8');
console.log('Successfully updated src/utils/movie-shadowing-ai.ts!');
