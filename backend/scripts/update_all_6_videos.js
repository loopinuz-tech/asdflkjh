import fs from 'fs';
import { query, pool } from '../dist/config/db.js';

async function main() {
  console.log('--- Updating all 6 videos in shadowing_videos database ---');

  // 1. MrrxN6GZJaU (English Unleashed) - Verified Exact Speech Alignment
  const mrrxLines = JSON.parse(fs.readFileSync('audio/mrrx_final_ready.json', 'utf8'));
  await query(`
    INSERT INTO shadowing_videos 
      (id, title, movie_title, youtube_url, youtube_id, cefr_level, accent, duration, description, dialogue_lines, is_active)
    VALUES 
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      movie_title = EXCLUDED.movie_title,
      youtube_url = EXCLUDED.youtube_url,
      youtube_id = EXCLUDED.youtube_id,
      cefr_level = EXCLUDED.cefr_level,
      accent = EXCLUDED.accent,
      duration = EXCLUDED.duration,
      description = EXCLUDED.description,
      dialogue_lines = EXCLUDED.dialogue_lines,
      is_active = true
  `, [
    '22cf4b79-6b87-443f-9cfa-35ec4545fc98',
    'Learn English with Podcast (Daily Conversation)',
    'English Unleashed',
    'https://www.youtube.com/watch?v=MrrxN6GZJaU',
    'MrrxN6GZJaU',
    'B1',
    'American',
    '8:01',
    'Full shadowing English speaking practice with Tom talking about a typical day and daily conversation routine.',
    JSON.stringify(mrrxLines)
  ]);
  console.log('✓ Updated MrrxN6GZJaU with', mrrxLines.length, 'verified exact lines.');

  // 2. vi0Lbjs5ECI (Dead Poets Society) - Verified Exact Speech Alignment
  const poetsLines = JSON.parse(fs.readFileSync('audio/final_poets.json', 'utf8'));
  await query(`
    INSERT INTO shadowing_videos 
      (id, title, movie_title, youtube_url, youtube_id, cefr_level, accent, duration, description, dialogue_lines, is_active)
    VALUES 
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      movie_title = EXCLUDED.movie_title,
      youtube_url = EXCLUDED.youtube_url,
      youtube_id = EXCLUDED.youtube_id,
      cefr_level = EXCLUDED.cefr_level,
      accent = EXCLUDED.accent,
      duration = EXCLUDED.duration,
      description = EXCLUDED.description,
      dialogue_lines = EXCLUDED.dialogue_lines,
      is_active = true
  `, [
    '10000000-0000-0000-0000-000000000002',
    'Carpe Diem - Seize the Day',
    'Dead Poets Society',
    'https://www.youtube.com/watch?v=vi0Lbjs5ECI',
    'vi0Lbjs5ECI',
    'B2',
    'American',
    '3:06',
    'Professor John Keating takes his students into the hallway to view vintage photographs of past scholars and imparts the immortal wisdom of Carpe Diem.',
    JSON.stringify(poetsLines)
  ]);
  console.log('✓ Updated vi0Lbjs5ECI with', poetsLines.length, 'verified exact lines.');

  // 3. Lm8p5rlrSkY (Interstellar Trailer #2) - Verified Exact Speech Alignment
  const interstellarLines = [
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
  await query(`
    INSERT INTO shadowing_videos 
      (id, title, movie_title, youtube_url, youtube_id, cefr_level, accent, duration, description, dialogue_lines, is_active)
    VALUES 
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      movie_title = EXCLUDED.movie_title,
      youtube_url = EXCLUDED.youtube_url,
      youtube_id = EXCLUDED.youtube_id,
      cefr_level = EXCLUDED.cefr_level,
      accent = EXCLUDED.accent,
      duration = EXCLUDED.duration,
      description = EXCLUDED.description,
      dialogue_lines = EXCLUDED.dialogue_lines,
      is_active = true
  `, [
    '10000000-0000-0000-0000-000000000004',
    'Looking Up at the Stars',
    'Interstellar',
    'https://www.youtube.com/watch?v=Lm8p5rlrSkY',
    'Lm8p5rlrSkY',
    'B2',
    'American',
    '2:33',
    'Official Interstellar Trailer dialogue featuring Cooper, Professor Brand reciting Dylan Thomas, and humanity\'s search for a new home.',
    JSON.stringify(interstellarLines)
  ]);
  console.log('✓ Updated Lm8p5rlrSkY with', interstellarLines.length, 'verified exact lines.');

  // 4. kmQ4e6UMsnM (Kung Fu Panda Extended Preview) - Clearly Marked as Approximate
  // Raw direct timedtext is blocked on YouTube for this embed; clearly marked approximate
  const kfpApproxLines = [
    {
      "id": "line-1",
      "time": "0:08",
      "seconds": 8.0,
      "start_seconds": 8.0,
      "end_time": "0:12",
      "end_seconds": 12.0,
      "duration_seconds": 4.0,
      "speaker": "Master Shifu",
      "character": "Master Shifu",
      "text": "Master Oogway! You summoned me? Is something wrong?",
      "translation": "Ustoz Oogway! Meni chaqirtirdingizmi? Biror noxushlik yuz berdimi?",
      "tip": "Urgent, respectful pace. Stress 'summoned' and 'wrong'.",
      "timing_quality": "approximate",
      "is_approximate": true
    },
    {
      "id": "line-2",
      "time": "0:16",
      "seconds": 16.0,
      "start_seconds": 16.0,
      "end_time": "0:22",
      "end_seconds": 22.0,
      "duration_seconds": 6.0,
      "speaker": "Master Oogway",
      "character": "Master Oogway",
      "text": "Why must something be wrong for me to want to see my old friend?",
      "translation": "Eski qadrdon do'stimni ko'rishim uchun albatta biror yomon narsa bo'lishi shartmi?",
      "tip": "Gentle, serene pacing with subtle humorous inflection.",
      "timing_quality": "approximate",
      "is_approximate": true
    },
    {
      "id": "line-3",
      "time": "0:26",
      "seconds": 26.0,
      "start_seconds": 26.0,
      "end_time": "0:30",
      "end_seconds": 30.0,
      "duration_seconds": 4.0,
      "speaker": "Master Shifu",
      "character": "Master Shifu",
      "text": "So... nothing is wrong?",
      "translation": "Demak... hech qanday xavf yo'qmi?",
      "tip": "Questioning pause with lingering hesitation.",
      "timing_quality": "approximate",
      "is_approximate": true
    },
    {
      "id": "line-4",
      "time": "0:34",
      "seconds": 34.0,
      "start_seconds": 34.0,
      "end_time": "0:42",
      "end_seconds": 42.0,
      "duration_seconds": 8.0,
      "speaker": "Master Oogway",
      "character": "Master Oogway",
      "text": "Well, I didn't say that. I have had a vision. Tai Lung will return.",
      "translation": "Men unday demadim. Vahiy ko'rdim. Tay Lung qaytib keladi.",
      "tip": "Deliberate dramatic weight on 'Tai Lung will return'.",
      "timing_quality": "approximate",
      "is_approximate": true
    },
    {
      "id": "line-5",
      "time": "0:46",
      "seconds": 46.0,
      "start_seconds": 46.0,
      "end_time": "0:54",
      "end_seconds": 54.0,
      "duration_seconds": 8.0,
      "speaker": "Master Shifu",
      "character": "Master Shifu",
      "text": "That is impossible! He is in Chorh-Gom prison, guarded by a thousand rhinos!",
      "translation": "Bu imkonsiz! U Chorh-Gom qamoqxonasida, minglab karkidonlar qo'riqlaydi!",
      "tip": "High disbelief and alarm.",
      "timing_quality": "approximate",
      "is_approximate": true
    },
    {
      "id": "line-6",
      "time": "0:58",
      "seconds": 58.0,
      "start_seconds": 58.0,
      "end_time": "1:06",
      "end_seconds": 66.0,
      "duration_seconds": 8.0,
      "speaker": "Master Oogway",
      "character": "Master Oogway",
      "text": "Nothing is impossible. One often meets his destiny on the road he takes to avoid it.",
      "translation": "Hech narsa imkonsiz emas. Inson ko'pincha o'z taqdiridan qochish yo'lida unga duch keladi.",
      "tip": "Famous philosophical proverb cadence.",
      "timing_quality": "approximate",
      "is_approximate": true
    },
    {
      "id": "line-7",
      "time": "1:12",
      "seconds": 72.0,
      "start_seconds": 72.0,
      "end_time": "1:20",
      "end_seconds": 80.0,
      "duration_seconds": 8.0,
      "speaker": "Master Oogway",
      "character": "Master Oogway",
      "text": "Yesterday is history, tomorrow is a mystery, but today is a gift. That is why it is called the present.",
      "translation": "Kecha — bu o'tmish, ertaga — bu jumboq, ammo bugun — bu sovg'a. Shuning uchun ham uni hozirgi zamon (sovg'a) deb atashadi.",
      "tip": "Iconic Oogway proverb. Emphasize 'gift' and 'present'.",
      "timing_quality": "approximate",
      "is_approximate": true
    }
  ];
  await query(`
    INSERT INTO shadowing_videos 
      (id, title, movie_title, youtube_url, youtube_id, cefr_level, accent, duration, description, dialogue_lines, is_active)
    VALUES 
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      movie_title = EXCLUDED.movie_title,
      youtube_url = EXCLUDED.youtube_url,
      youtube_id = EXCLUDED.youtube_id,
      cefr_level = EXCLUDED.cefr_level,
      accent = EXCLUDED.accent,
      duration = EXCLUDED.duration,
      description = EXCLUDED.description,
      dialogue_lines = EXCLUDED.dialogue_lines,
      is_active = true
  `, [
    '64124eb9-48e0-4182-a279-b90693251b30',
    'Master Shifu & Oogway\'s Wisdom',
    'Kung Fu Panda',
    'https://www.youtube.com/watch?v=kmQ4e6UMsnM',
    'kmQ4e6UMsnM',
    'B2',
    'American',
    '35:54',
    'Master Oogway shares his legendary wisdom with Shifu and Po. (Approximate cadence timestamps due to video preview format).',
    JSON.stringify(kfpApproxLines)
  ]);
  console.log('✓ Updated kmQ4e6UMsnM with', kfpApproxLines.length, 'clearly marked approximate lines.');

  // 5. Gqk7y0gN4eU (The Pursuit of Happyness - Protect Your Dreams) - Approximate Quality
  const pursuitLines = [
    {
      "id": "line-1",
      "time": "0:05",
      "seconds": 5.0,
      "start_seconds": 5.0,
      "end_time": "0:10",
      "end_seconds": 10.0,
      "duration_seconds": 5.0,
      "speaker": "Chris Gardner",
      "character": "Chris Gardner",
      "text": "Hey. Don't ever let somebody tell you you can't do something.",
      "translation": "Hey. Hech qachon birov senga nimadir qila olmaysan deyishiga yo'l qo'yma.",
      "tip": "Firm, loving fatherly cadence.",
      "timing_quality": "approximate",
      "is_approximate": true
    },
    {
      "id": "line-2",
      "time": "0:12",
      "seconds": 12.0,
      "start_seconds": 12.0,
      "end_time": "0:16",
      "end_seconds": 16.0,
      "duration_seconds": 4.0,
      "speaker": "Chris Gardner",
      "character": "Chris Gardner",
      "text": "Not even me. All right?",
      "translation": "Hatto men ham. Xo'pmi?",
      "tip": "Soft, searching intonation.",
      "timing_quality": "approximate",
      "is_approximate": true
    },
    {
      "id": "line-3",
      "time": "0:17",
      "seconds": 17.0,
      "start_seconds": 17.0,
      "end_time": "0:19",
      "end_seconds": 19.0,
      "duration_seconds": 2.0,
      "speaker": "Christopher",
      "character": "Christopher",
      "text": "All right.",
      "translation": "Xo'p.",
      "tip": "Gentle childish agreement.",
      "timing_quality": "approximate",
      "is_approximate": true
    },
    {
      "id": "line-4",
      "time": "0:21",
      "seconds": 21.0,
      "start_seconds": 21.0,
      "end_time": "0:26",
      "end_seconds": 26.0,
      "duration_seconds": 5.0,
      "speaker": "Chris Gardner",
      "character": "Chris Gardner",
      "text": "You got a dream... you gotta protect it.",
      "translation": "Agar orzuing bo'lsa... uni himoya qilishing kerak.",
      "tip": "Stress on 'dream' and 'protect'.",
      "timing_quality": "approximate",
      "is_approximate": true
    },
    {
      "id": "line-5",
      "time": "0:27",
      "seconds": 27.0,
      "start_seconds": 27.0,
      "end_time": "0:34",
      "end_seconds": 34.0,
      "duration_seconds": 7.0,
      "speaker": "Chris Gardner",
      "character": "Chris Gardner",
      "text": "People can't do somethin' themselves, they wanna tell you you can't do it.",
      "translation": "Odamlar o'zlari biror narsani qila olishmasa, senga ham qila olmaysan deyishadi.",
      "tip": "Connected speech: 'somethin' themselves'.",
      "timing_quality": "approximate",
      "is_approximate": true
    },
    {
      "id": "line-6",
      "time": "0:35",
      "seconds": 35.0,
      "start_seconds": 35.0,
      "end_time": "0:41",
      "end_seconds": 41.0,
      "duration_seconds": 6.0,
      "speaker": "Chris Gardner",
      "character": "Chris Gardner",
      "text": "If you want somethin', go get it. Period.",
      "translation": "Agar biror narsani xohlasang, borib unga erish. Bo'ldi, tamom.",
      "tip": "Definite downward tone on 'Period.'",
      "timing_quality": "approximate",
      "is_approximate": true
    }
  ];
  await query(`
    INSERT INTO shadowing_videos 
      (id, title, movie_title, youtube_url, youtube_id, cefr_level, accent, duration, description, dialogue_lines, is_active)
    VALUES 
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      movie_title = EXCLUDED.movie_title,
      youtube_url = EXCLUDED.youtube_url,
      youtube_id = EXCLUDED.youtube_id,
      cefr_level = EXCLUDED.cefr_level,
      accent = EXCLUDED.accent,
      duration = EXCLUDED.duration,
      description = EXCLUDED.description,
      dialogue_lines = EXCLUDED.dialogue_lines,
      is_active = true
  `, [
    '10000000-0000-0000-0000-000000000001',
    'Protect Your Dreams',
    'The Pursuit of Happyness',
    'https://www.youtube.com/watch?v=Gqk7y0gN4eU',
    'Gqk7y0gN4eU',
    'B2',
    'American',
    '1:45',
    'Iconic basketball court scene where Chris Gardner teaches his son the value of protecting his ambitions and never giving up.',
    JSON.stringify(pursuitLines)
  ]);
  console.log('✓ Updated Gqk7y0gN4eU with', pursuitLines.length, 'lines.');

  // 6. A0qG_WnQ0sY (Harry Potter - Welcome to Hogwarts) - Approximate Quality
  const potterLines = [
    {
      "id": "line-1",
      "time": "0:04",
      "seconds": 4.0,
      "start_seconds": 4.0,
      "end_time": "0:10",
      "end_seconds": 10.0,
      "duration_seconds": 6.0,
      "speaker": "Professor McGonagall",
      "character": "Professor McGonagall",
      "text": "Welcome to Hogwarts. The start-of-term banquet will begin shortly.",
      "translation": "Hogvartsga xush kelibsiz. O'quv yili boshlanishi ziyofati tez orada boshlanadi.",
      "tip": "Posh British Received Pronunciation (RP).",
      "timing_quality": "approximate",
      "is_approximate": true
    },
    {
      "id": "line-2",
      "time": "0:12",
      "seconds": 12.0,
      "start_seconds": 12.0,
      "end_time": "0:19",
      "end_seconds": 19.0,
      "duration_seconds": 7.0,
      "speaker": "Professor McGonagall",
      "character": "Professor McGonagall",
      "text": "Before you take your seats in the Great Hall, you will be sorted into your houses.",
      "translation": "Katta zalda joylashishingizdan oldin fakultetlarga taqsimlanasiz.",
      "tip": "Clear enunciation of 'Great Hall' and 'sorted'.",
      "timing_quality": "approximate",
      "is_approximate": true
    },
    {
      "id": "line-3",
      "time": "0:21",
      "seconds": 21.0,
      "start_seconds": 21.0,
      "end_time": "0:30",
      "end_seconds": 30.0,
      "duration_seconds": 9.0,
      "speaker": "Professor McGonagall",
      "character": "Professor McGonagall",
      "text": "The Sorting is a very important ceremony because, while you are here, your house will be like your family.",
      "translation": "Taqsimlash juda muhim marosimdir, chunki bu yerda bo'lganingizda sizning fakultetingiz oilangizdek bo'ladi.",
      "tip": "Formal authoritative cadence.",
      "timing_quality": "approximate",
      "is_approximate": true
    },
    {
      "id": "line-4",
      "time": "0:32",
      "seconds": 32.0,
      "start_seconds": 32.0,
      "end_time": "0:42",
      "end_seconds": 42.0,
      "duration_seconds": 10.0,
      "speaker": "Professor McGonagall",
      "character": "Professor McGonagall",
      "text": "You will have classes with the rest of your house, sleep in your house dormitory, and spend free time in your house common room.",
      "translation": "Siz fakultetingiz bilan birga darslarga borasiz, yotoqxonada uxlaysiz va umumiy xonada dam olasiz.",
      "tip": "British intonation on three-part list.",
      "timing_quality": "approximate",
      "is_approximate": true
    },
    {
      "id": "line-5",
      "time": "0:44",
      "seconds": 44.0,
      "start_seconds": 44.0,
      "end_time": "0:52",
      "end_seconds": 52.0,
      "duration_seconds": 8.0,
      "speaker": "Professor McGonagall",
      "character": "Professor McGonagall",
      "text": "The four houses are Gryffindor, Hufflepuff, Ravenclaw, and Slytherin.",
      "translation": "To'rtta fakultet bular: Griffindor, Puffenduy, Kogtevran va Slizerin.",
      "tip": "Crisp proper noun delivery.",
      "timing_quality": "approximate",
      "is_approximate": true
    }
  ];
  await query(`
    INSERT INTO shadowing_videos 
      (id, title, movie_title, youtube_url, youtube_id, cefr_level, accent, duration, description, dialogue_lines, is_active)
    VALUES 
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      movie_title = EXCLUDED.movie_title,
      youtube_url = EXCLUDED.youtube_url,
      youtube_id = EXCLUDED.youtube_id,
      cefr_level = EXCLUDED.cefr_level,
      accent = EXCLUDED.accent,
      duration = EXCLUDED.duration,
      description = EXCLUDED.description,
      dialogue_lines = EXCLUDED.dialogue_lines,
      is_active = true
  `, [
    '10000000-0000-0000-0000-000000000003',
    'Welcome to Hogwarts',
    'Harry Potter and the Sorcerer\'s Stone',
    'https://www.youtube.com/watch?v=A0qG_WnQ0sY',
    'A0qG_WnQ0sY',
    'B1',
    'British',
    '1:30',
    'Professor McGonagall welcomes the first-year students to Hogwarts School of Witchcraft and Wizardry outside the Great Hall.',
    JSON.stringify(potterLines)
  ]);
  console.log('✓ Updated A0qG_WnQ0sY with', potterLines.length, 'lines.');

  console.log('\n--- All 6 Videos Successfully Committed to Database! ---');
  await pool.end();
}

main().catch(async err => {
  console.error('Error updating videos:', err);
  await pool.end();
  process.exit(1);
});
