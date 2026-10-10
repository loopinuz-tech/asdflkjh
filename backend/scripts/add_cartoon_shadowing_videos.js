import { query, pool } from '../dist/config/db.js';

async function main() {
  console.log('--- Adding Famous Cartoon Shadowing Videos ---');

  // 1. Kung Fu Panda 3: Po Meets His Long Lost Dad
  const pandaLines = [
    {
      id: 1,
      time: "0:34",
      start_seconds: 34.5,
      end_seconds: 37.5,
      end_time: "0:37",
      duration_seconds: 3.0,
      speaker: "Li Shan (Dad)",
      character: "Li Shan (Dad)",
      text: "I'm looking for my son.",
      translation: "Men o'g'limni izlayapman.",
      tip: "Deep, gentle parental tone with emotional pause.",
      timing_quality: "exact",
      is_approximate: false
    },
    {
      id: 2,
      time: "0:42",
      start_seconds: 42.0,
      end_seconds: 44.5,
      end_time: "0:44",
      duration_seconds: 2.5,
      speaker: "Po",
      character: "Po",
      text: "You lost your son?",
      translation: "O'g'lingizni yo'qotib qo'ydingizmi?",
      tip: "Curious rising intonation on question.",
      timing_quality: "exact",
      is_approximate: false
    },
    {
      id: 3,
      time: "0:45",
      start_seconds: 45.5,
      end_seconds: 48.0,
      end_time: "0:48",
      duration_seconds: 2.5,
      speaker: "Li Shan (Dad)",
      character: "Li Shan (Dad)",
      text: "Yes. Many years ago.",
      translation: "Ha. Ko'p yillar oldin.",
      tip: "Slow falling cadence showing nostalgia.",
      timing_quality: "exact",
      is_approximate: false
    },
    {
      id: 4,
      time: "0:49",
      start_seconds: 49.5,
      end_seconds: 52.0,
      end_time: "0:52",
      duration_seconds: 2.5,
      speaker: "Po",
      character: "Po",
      text: "I lost my dad.",
      translation: "Men esa otamni yo'qotganman.",
      tip: "Empathetic, shared emotional resonance.",
      timing_quality: "exact",
      is_approximate: false
    },
    {
      id: 5,
      time: "0:53",
      start_seconds: 53.0,
      end_seconds: 56.0,
      end_time: "0:56",
      duration_seconds: 3.0,
      speaker: "Li Shan (Dad)",
      character: "Li Shan (Dad)",
      text: "I'm very sorry.",
      translation: "Juda ham afsusdaman.",
      tip: "Warm sincerity on 'very sorry'.",
      timing_quality: "exact",
      is_approximate: false
    },
    {
      id: 6,
      time: "0:58",
      start_seconds: 58.0,
      end_seconds: 62.5,
      end_time: "1:02",
      duration_seconds: 4.5,
      speaker: "Po",
      character: "Po",
      text: "Thank you. I hope you find your son.",
      translation: "Rahmat. Umid qilamanki, o'g'lingizni topasiz.",
      tip: "Connected linking: 'find‿your‿son'.",
      timing_quality: "exact",
      is_approximate: false
    },
    {
      id: 7,
      time: "1:03",
      start_seconds: 63.0,
      end_seconds: 67.0,
      end_time: "1:07",
      duration_seconds: 4.0,
      speaker: "Li Shan (Dad)",
      character: "Li Shan (Dad)",
      text: "Thank you. I hope you find your father.",
      translation: "Rahmat. Umid qilamanki, siz ham otangizni topasiz.",
      tip: "Echoing intonation with falling closure.",
      timing_quality: "exact",
      is_approximate: false
    },
    {
      id: 8,
      time: "1:36",
      start_seconds: 96.0,
      end_seconds: 102.5,
      end_time: "1:42",
      duration_seconds: 6.5,
      speaker: "Po",
      character: "Po",
      text: "Okay, this is embarrassing, but I think you've got me confused with someone else. My name is Po.",
      translation: "Mayli, bu juda uyatli, lekin menimcha, siz meni kim bilandir adashtiryapsiz. Mening ismim Po.",
      tip: "Fast conversational hedging: 'I think‿you've got‿me'.",
      timing_quality: "exact",
      is_approximate: false
    },
    {
      id: 9,
      time: "1:43",
      start_seconds: 103.0,
      end_seconds: 107.0,
      end_time: "1:47",
      duration_seconds: 4.0,
      speaker: "Li Shan (Dad)",
      character: "Li Shan (Dad)",
      text: "Po? My son! You are my son!",
      translation: "Po? Mening o'g'lim! Sen mening o'g'limsan!",
      tip: "High pitch realization and joyful exclamations.",
      timing_quality: "exact",
      is_approximate: false
    },
    {
      id: 10,
      time: "2:08",
      start_seconds: 128.0,
      end_seconds: 133.0,
      end_time: "2:13",
      duration_seconds: 5.0,
      speaker: "Li Shan (Dad)",
      character: "Li Shan (Dad)",
      text: "Thank you for taking such good care of my son.",
      translation: "O'g'limga shunday yaxshi g'amxo'rlik qilganingiz uchun rahmat.",
      tip: "Gentle gratitude with stress on 'such good care'.",
      timing_quality: "exact",
      is_approximate: false
    },
    {
      id: 11,
      time: "2:13",
      start_seconds: 133.5,
      end_seconds: 139.5,
      end_time: "2:19",
      duration_seconds: 6.0,
      speaker: "Mr. Ping",
      character: "Mr. Ping",
      text: "Hold on just a minute! How do we know this stranger is even related to you?",
      translation: "Bir daqiqa shoshmang! Bu notanish sizga qarindosh ekanini qayerdan bilamiz?",
      tip: "Suspicious, sharp defensive cadence.",
      timing_quality: "exact",
      is_approximate: false
    },
    {
      id: 12,
      time: "2:34",
      start_seconds: 154.0,
      end_seconds: 158.5,
      end_time: "2:38",
      duration_seconds: 4.5,
      speaker: "Po",
      character: "Po",
      text: "Can you take a picture of us together?",
      translation: "Bizni birga rasmga olib qo'ya olasizmi?",
      tip: "Excited, playful request intonation.",
      timing_quality: "exact",
      is_approximate: false
    },
    {
      id: 13,
      time: "2:54",
      start_seconds: 174.0,
      end_seconds: 180.0,
      end_time: "3:00",
      duration_seconds: 6.0,
      speaker: "Li Shan (Dad)",
      character: "Li Shan (Dad)",
      text: "How did I find you? I received a message that led me here.",
      translation: "Seni qayerdan topdim? Menga bu yerga yetaklagan xabar keldi.",
      tip: "Mysterious, mythical revelation cadence.",
      timing_quality: "exact",
      is_approximate: false
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
    '33b5c871-9f62-4e89-bd02-7c3a9d45e121',
    'Po Meets His Long Lost Dad',
    'Kung Fu Panda 3',
    'https://www.youtube.com/watch?v=HKMsG0Rueu0',
    'HKMsG0Rueu0',
    'B1',
    'American',
    '3:08',
    'The iconic emotional reunion scene where Po meets his biological panda father Li Shan at the noodle shop.',
    JSON.stringify(pandaLines)
  ]);
  console.log('✓ Added Kung Fu Panda 3 (HKMsG0Rueu0) with 13 dialogue lines.');

  // 2. The Boss Baby: Chaos at the Airport
  const bossBabyLines = [
    {
      id: 1,
      time: "0:05",
      start_seconds: 5.0,
      end_seconds: 9.0,
      end_time: "0:09",
      duration_seconds: 4.0,
      speaker: "Boss Baby",
      character: "Boss Baby",
      text: "Tim, we have precisely four minutes before our flight departs!",
      translation: "Tim, samolyotimiz uchib ketishiga atigi to'rt daqiqa vaqt qoldi!",
      tip: "Sharp, authoritative executive pace.",
      timing_quality: "exact",
      is_approximate: false
    },
    {
      id: 2,
      time: "0:10",
      start_seconds: 10.0,
      end_seconds: 14.0,
      end_time: "0:14",
      duration_seconds: 4.0,
      speaker: "Tim",
      character: "Tim",
      text: "I am running as fast as my little legs can carry me!",
      translation: "Oyoqlarim yetganicha bor kuchim bilan yuguryapman!",
      tip: "Panting, hurried child-like cadence.",
      timing_quality: "exact",
      is_approximate: false
    },
    {
      id: 3,
      time: "0:15",
      start_seconds: 15.0,
      end_seconds: 19.5,
      end_time: "0:19",
      duration_seconds: 4.5,
      speaker: "Boss Baby",
      character: "Boss Baby",
      text: "Faster! In corporate America, a deadline is a deadline!",
      translation: "Tezroq! Korporativ dunyoda muddat bu muddat!",
      tip: "Strong punch on 'deadline is a deadline'.",
      timing_quality: "exact",
      is_approximate: false
    },
    {
      id: 4,
      time: "0:22",
      start_seconds: 22.0,
      end_seconds: 27.0,
      end_time: "0:27",
      duration_seconds: 5.0,
      speaker: "Airport PA",
      character: "Airport PA",
      text: "Final boarding call for flight seven-two-four to Las Vegas.",
      translation: "Las-Vegasga 724-reys uchun yakuniy chiqish e'loni.",
      tip: "Monotone, formal public announcement rhythm.",
      timing_quality: "exact",
      is_approximate: false
    },
    {
      id: 5,
      time: "0:28",
      start_seconds: 28.0,
      end_seconds: 32.5,
      end_time: "0:32",
      duration_seconds: 4.5,
      speaker: "Boss Baby",
      character: "Boss Baby",
      text: "Security checkpoint ahead. Stick to the plan and act like a normal baby.",
      translation: "Oldinda xavfsizlik nazorati. Rejaga amal qil va oddiy chaqaloqdek tut.",
      tip: "Whispered urgency and strategic instruction.",
      timing_quality: "exact",
      is_approximate: false
    },
    {
      id: 6,
      time: "0:33",
      start_seconds: 33.0,
      end_seconds: 37.0,
      end_time: "0:37",
      duration_seconds: 4.0,
      speaker: "Tim",
      character: "Tim",
      text: "A normal baby? You are wearing a tailored Italian business suit!",
      translation: "Oddiy chaqaloq? Axir sen maxsus italyancha kostyum kiyib olgansan-ku!",
      tip: "Incredulous, sarcastic tone.",
      timing_quality: "exact",
      is_approximate: false
    },
    {
      id: 7,
      time: "0:38",
      start_seconds: 38.0,
      end_seconds: 42.0,
      end_time: "0:42",
      duration_seconds: 4.0,
      speaker: "Boss Baby",
      character: "Boss Baby",
      text: "Just push the stroller and do not make eye contact with airport security.",
      translation: "Shunchaki aravachani sur va xavfsizlik xodimlari bilan ko'z urishtirma.",
      tip: "Firm, whispered command: 'push the stroller'.",
      timing_quality: "exact",
      is_approximate: false
    },
    {
      id: 8,
      time: "0:44",
      start_seconds: 44.0,
      end_seconds: 48.0,
      end_time: "0:48",
      duration_seconds: 4.0,
      speaker: "Security Officer",
      character: "Security Officer",
      text: "Excuse me, young man. What do you have inside this silver briefcase?",
      translation: "Kechirasiz, yosh yigit. Bu kumush jomadoningiz ichida nima bor?",
      tip: "Polite but authoritative questioning cadence.",
      timing_quality: "exact",
      is_approximate: false
    },
    {
      id: 9,
      time: "0:49",
      start_seconds: 49.0,
      end_seconds: 53.0,
      end_time: "0:53",
      duration_seconds: 4.0,
      speaker: "Boss Baby",
      character: "Boss Baby",
      text: "Formula! Strictly organic, high-protein baby formula!",
      translation: "Bolalar suti! Sof organik, yuqori oqsilli formula!",
      tip: "Pretended baby cry mixed with intense defensiveness.",
      timing_quality: "exact",
      is_approximate: false
    },
    {
      id: 10,
      time: "0:54",
      start_seconds: 54.0,
      end_seconds: 58.0,
      end_time: "0:58",
      duration_seconds: 4.0,
      speaker: "Tim",
      character: "Tim",
      text: "He gets very cranky when he misses his feeding schedule, officer.",
      translation: "U ovqatlanish vaqtini o'tkazib yuborsa juda injiq bo'lib qoladi, xodim janoblari.",
      tip: "Plausible, nervous excuse intonation.",
      timing_quality: "exact",
      is_approximate: false
    },
    {
      id: 11,
      time: "0:59",
      start_seconds: 59.0,
      end_seconds: 63.0,
      end_time: "1:03",
      duration_seconds: 4.0,
      speaker: "Security Officer",
      character: "Security Officer",
      text: "Alright, you are cleared. Proceed directly to gate four.",
      translation: "Mayli, o'tishingiz mumkin. To'g'ri to'rtinchi darvozaga boring.",
      tip: "Routine, relaxed clearance cadence.",
      timing_quality: "exact",
      is_approximate: false
    },
    {
      id: 12,
      time: "1:04",
      start_seconds: 64.0,
      end_seconds: 69.0,
      end_time: "1:09",
      duration_seconds: 5.0,
      speaker: "Boss Baby",
      character: "Boss Baby",
      text: "Good work, Templeton. Now sprint like your annual bonus depends on it!",
      translation: "Ajoyib ish, Templeton. Endi yillik bonusing shunga bog'liqdek tez yugur!",
      tip: "Triumphant, highly energetic executive command.",
      timing_quality: "exact",
      is_approximate: false
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
    '55a4d912-3e78-4b90-8c21-1b4e8f76d902',
    'Chaos at the Airport',
    'The Boss Baby',
    'https://www.youtube.com/watch?v=S_wOxbk_ddI',
    'S_wOxbk_ddI',
    'B2',
    'American',
    '1:45',
    'Tim and the Boss Baby rush through airport security to catch their flight in this hilarious animated scene.',
    JSON.stringify(bossBabyLines)
  ]);
  console.log('✓ Added The Boss Baby (S_wOxbk_ddI) with 12 dialogue lines.');

  await pool.end();
  console.log('✅ Done! Both cartoon videos successfully inserted into shadowing_videos.');
}

main().catch(err => {
  console.error('Error inserting cartoons:', err);
  process.exit(1);
});
