export interface SpeakingPromptData {
  part_number: 1 | 2;
  title: string;
  prompt_text: string;
  follow_up_questions: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  is_premium: boolean;
  status: 'published';
}

export const PART_1_PROMPTS: SpeakingPromptData[] = [
  {
    part_number: 1,
    title: 'Hometown & Neighborhood',
    prompt_text: 'Let us talk about your hometown. Where is your hometown located, and what is it known for?',
    follow_up_questions: [
      'What do you like most about living in your neighborhood?',
      'Has your hometown changed significantly over the past ten years?',
      'Would you prefer to live in your hometown in the future or move elsewhere?'
    ],
    difficulty: 'easy',
    is_premium: false,
    status: 'published'
  },
  {
    part_number: 1,
    title: 'Accommodation & Living Space',
    prompt_text: 'Do you live in a house or an apartment? Can you describe your living space?',
    follow_up_questions: [
      'Which room is your favorite in your home, and why?',
      'What kind of interior design or decoration do you prefer?',
      'Do you plan to move into a different home in the near future?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 1,
    title: 'Work & Professional Career',
    prompt_text: 'Do you work or are you currently studying? What are your primary responsibilities at work?',
    follow_up_questions: [
      'Why did you choose this particular profession or career path?',
      'What do you find most satisfying about your daily job duties?',
      'Do you envision yourself continuing in this career for the long term?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 1,
    title: 'Academic Studies & Learning',
    prompt_text: 'What major or academic subject are you currently studying, and why did you select it?',
    follow_up_questions: [
      'What is the most challenging aspect of your academic courses?',
      'Do you prefer individual self-study or working collaboratively in student groups?',
      'How will your academic qualifications support your future career ambitions?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 1,
    title: 'Daily Routine & Time Management',
    prompt_text: 'Can you walk me through your typical morning and daily routine on weekdays?',
    follow_up_questions: [
      'Are you generally an early bird or a night owl?',
      'How do you manage your time when you have multiple competing deadlines?',
      'Would you like to introduce any changes to your daily schedule?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 1,
    title: 'Weather & Seasonal Climates',
    prompt_text: 'What type of weather do you enjoy the most, and how does it influence your mood?',
    follow_up_questions: [
      'Does the weather in your country vary significantly between seasons?',
      'What activities do you typically engage in when it rains outside?',
      'Do you pay attention to daily weather forecasts before leaving home?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 1,
    title: 'Colors & Visual Preferences',
    prompt_text: 'What is your favorite color, and does it hold any special personal significance for you?',
    follow_up_questions: [
      'Do you consider colors carefully when choosing clothes or decorating a room?',
      'Are there any colors that you personally dislike or avoid wearing?',
      'Do different colors carry distinct cultural meanings in your home country?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 1,
    title: 'Food & Culinary Traditions',
    prompt_text: 'What is your favorite cuisine or traditional meal, and how often do you eat it?',
    follow_up_questions: [
      'Do you enjoy cooking meals at home, or do you prefer dining at restaurants?',
      'Have your dietary habits changed in any way compared to when you were younger?',
      'What is a traditional dish from your country that foreign visitors should definitely taste?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 1,
    title: 'Sports & Physical Fitness',
    prompt_text: 'Do you practice any sports or physical workouts regularly to maintain fitness?',
    follow_up_questions: [
      'Did you play team sports during your school physical education classes?',
      'What are the most popular spectator sports among people in your country?',
      'Do you prefer watching sporting matches live in an arena or on television?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 1,
    title: 'Music & Musical Instruments',
    prompt_text: 'What genre of music do you listen to most frequently, and in what situations?',
    follow_up_questions: [
      'Can you play any musical instruments, or would you like to learn one?',
      'How does listening to music affect your concentration when studying or working?',
      'Have you ever attended a live music concert or festival?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 1,
    title: 'Reading & Literature',
    prompt_text: 'Do you read books often? What genres of literature do you find most engaging?',
    follow_up_questions: [
      'Do you prefer physical paper books or reading digital texts on an e-reader?',
      'Did your parents encourage you to read bedtime stories when you were small?',
      'How often do you visit public or university libraries to study or borrow books?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 1,
    title: 'Movies & Cinema Experiences',
    prompt_text: 'How frequently do you watch movies, and what is your favorite film genre?',
    follow_up_questions: [
      'Do you prefer watching films at home on streaming platforms or in a movie theater?',
      'Are domestic movies popular in your country, or do international releases dominate?',
      'Who is a film director or actor whose creative work you admire?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 1,
    title: 'Travel & Vacations',
    prompt_text: 'Do you enjoy traveling to unfamiliar places? Where was your last holiday trip?',
    follow_up_questions: [
      'Do you prefer relaxed beach holidays or active sightseeing tours in historic cities?',
      'What items do you always make sure to pack when embarking on a journey?',
      'Which country or destination would be at the top of your travel bucket list?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 1,
    title: 'Smartphones & Mobile Technology',
    prompt_text: 'How many hours a day do you typically spend using your mobile phone?',
    follow_up_questions: [
      'What mobile applications do you rely on the most throughout the day?',
      'Could you comfortably manage a full weekend without using your smartphone?',
      'At what age do you believe children should be given their own personal phone?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 1,
    title: 'Social Media & Virtual Networks',
    prompt_text: 'Do you maintain active accounts on popular social networking platforms?',
    follow_up_questions: [
      'How has social media transformed how you stay in contact with distant friends?',
      'What are some potential drawbacks of spending excessive time on social networks?',
      'Do you prefer posting personal updates or simply browsing other people’s content?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 1,
    title: 'Public Transportation & Commutes',
    prompt_text: 'What form of transport do you usually take when commuting to work or school?',
    follow_up_questions: [
      'Is the public transportation infrastructure efficient and punctual in your city?',
      'Do traffic congestion and rush-hour delays affect your daily travel time?',
      'What improvements would you like city authorities to make to urban transit?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 1,
    title: 'Shopping & Retail Habits',
    prompt_text: 'Do you enjoy shopping for clothes and personal goods, or do you view it as a chore?',
    follow_up_questions: [
      'Do you prefer buying items from traditional street markets or online shopping portals?',
      'What factors influence your purchase decision when buying an expensive electronic item?',
      'Have you ever made an impulse purchase that you later came to regret?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 1,
    title: 'Weekends & Leisure Time',
    prompt_text: 'How do you typically spend your weekends? Do you follow a fixed schedule?',
    follow_up_questions: [
      'Do you prefer spending your days off socializing with friends or relaxing alone at home?',
      'Is there any weekend activity or hobby you would like to take up soon?',
      'Do you think standard weekends should be extended to three days instead of two?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 1,
    title: 'Pets & Domestic Animals',
    prompt_text: 'Do you have any pets at home, or have you ever kept an animal in the past?',
    follow_up_questions: [
      'What are the most popular domestic pets among families in your society?',
      'What benefits do children gain from growing up alongside household pets?',
      'Do you think keeping large animals in small urban apartments is fair to them?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 1,
    title: 'Photography & Capturing Memories',
    prompt_text: 'Do you like taking photographs when you visit new locations or attend events?',
    follow_up_questions: [
      'Do you prefer capturing candid snapshots of people or landscape scenery?',
      'Do you ever print out physical photo albums, or do you keep everything in digital storage?',
      'What makes a photograph truly memorable and expressive in your opinion?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 1,
    title: 'Flowers, Gardens & Houseplants',
    prompt_text: 'Do you like flowers or keeping green plants in your living room or balcony?',
    follow_up_questions: [
      'On what special occasions do people commonly present flowers in your country?',
      'Have you ever tried growing vegetables, herbs, or ornamental flowers yourself?',
      'Do you believe urban green parks play a vital role in city resident well-being?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 1,
    title: 'Art Galleries & Museums',
    prompt_text: 'How often do you visit art exhibitions or historic museums in your free time?',
    follow_up_questions: [
      'Did you participate in painting or artistic handicrafts during your primary school years?',
      'Do you have any paintings, posters, or artistic sculptures decorating your walls?',
      'Should entrance tickets to national cultural museums be free of charge for the public?'
    ],
    difficulty: 'medium',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 1,
    title: 'Friendship & Social Connections',
    prompt_text: 'What qualities do you value most in a close, trustworthy friend?',
    follow_up_questions: [
      'Do you stay in touch with childhood friends you met in school?',
      'How do you usually catch up with friends when both of you have busy schedules?',
      'Is it easier to establish deep friendships during childhood or later in adulthood?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 1,
    title: 'Family & Family Gatherings',
    prompt_text: 'Can you tell me a little about your family? How many members are in your household?',
    follow_up_questions: [
      'How frequently do extended family relatives assemble for festive holiday meals?',
      'Who in your family do you share the most similar personality traits with?',
      'What family traditions have been passed down through generations in your home?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 1,
    title: 'Hobbies & Creative Pastimes',
    prompt_text: 'What hobbies or creative pastimes do you enjoy pursuing in your spare time?',
    follow_up_questions: [
      'How did you first develop an interest in this particular pastime?',
      'Has your choice of hobbies changed significantly since you were a teenager?',
      'Do you believe having a creative hobby helps people cope with professional workplace stress?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 1,
    title: 'Morning Routines & Waking Up',
    prompt_text: 'What is the very first thing you do immediately after waking up each morning?',
    follow_up_questions: [
      'Do you find it easy or difficult to jump out of bed when your alarm rings?',
      'How does your morning routine differ on weekends compared to busy weekdays?',
      'Do you believe eating a nutritious morning breakfast impacts your energy throughout the day?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 1,
    title: 'Foreign Languages & Bilingualism',
    prompt_text: 'How many languages can you speak, and when did you start studying English?',
    follow_up_questions: [
      'What do you find to be the most demanding aspect of mastering a foreign language?',
      'How do you actively practice speaking and expanding your English vocabulary?',
      'Do you think modern AI translation tools will ever make human language learning obsolete?'
    ],
    difficulty: 'medium',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 1,
    title: 'Handwriting & Keyboard Typing',
    prompt_text: 'How often do you write notes by hand with a pen compared to typing on a keyboard?',
    follow_up_questions: [
      'Were you taught formal cursive penmanship when you were attending primary school?',
      'Do you think handwritten letters feel more sincere than digital email messages?',
      'Will handwriting skills eventually fade away in future school curriculums?'
    ],
    difficulty: 'medium',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 1,
    title: 'Watches & Punctuality',
    prompt_text: 'Do you regularly wear a wrist watch, or do you rely on your smartphone to check the time?',
    follow_up_questions: [
      'Have you ever received a high-quality watch as a birthday or graduation gift?',
      'How important is punctuality when meeting business partners or attending social functions in your culture?',
      'What do you typically do when you find yourself running late for an appointment?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 1,
    title: 'Clothing & Fashion Styles',
    prompt_text: 'What style of clothing do you feel most comfortable wearing on an everyday basis?',
    follow_up_questions: [
      'Do you follow contemporary fashion trends, or do you prefer timeless, practical clothes?',
      'Do you dress differently for formal work meetings compared to casual weekend outings?',
      'Have your fashion choices evolved noticeably since your teenage school days?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 1,
    title: 'Physical Health & Nutrition',
    prompt_text: 'What daily habits do you maintain to safeguard your physical health and wellness?',
    follow_up_questions: [
      'Do you pay close attention to the nutritional value and fresh ingredients of what you eat?',
      'How do you unwind and alleviate mental stress after demanding work assignments?',
      'What role do regular sleep schedules play in keeping your immune system robust?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 1,
    title: 'Public Parks & Botanical Gardens',
    prompt_text: 'Are there well-maintained public parks near your home, and how often do you visit them?',
    follow_up_questions: [
      'What activities do families and young people typically enjoy doing in public gardens?',
      'Do you prefer strolling in tranquil natural surroundings or dynamic urban plazas?',
      'Should city planners prioritize creating more tree-filled parklands in urban centers?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 1,
    title: 'Noise Levels & Quiet Spaces',
    prompt_text: 'Do you live in a quiet residential district or a bustling, noisy neighborhood?',
    follow_up_questions: [
      'What sounds or urban noises do you find most irritating when trying to concentrate?',
      'Where do you go in your town when you crave peaceful silence and solitary reflection?',
      'Can you focus effectively on demanding tasks when background noise is present?'
    ],
    difficulty: 'medium',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 1,
    title: 'Sleep Habits & Dreams',
    prompt_text: 'How many hours of restful sleep do you normally achieve each night?',
    follow_up_questions: [
      'Do you remember your night dreams vividly after you open your eyes in the morning?',
      'Do you ever take afternoon power naps to boost your productivity?',
      'What steps do you take when you encounter difficulty drifting off to sleep?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 1,
    title: 'Tea & Coffee Culture',
    prompt_text: 'Do you prefer drinking freshly brewed tea or roasted coffee in the morning?',
    follow_up_questions: [
      'Is drinking tea or coffee an integral part of welcoming guests in your culture?',
      'How has coffee shop culture grown among students and professionals in your area?',
      'At what age did you first start drinking caffeinated beverages?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 1,
    title: 'Festivals & National Celebrations',
    prompt_text: 'What is the most celebrated holiday or national festival in your country?',
    follow_up_questions: [
      'How does your family observe and prepare for this celebration?',
      'Do public events like fireworks, concerts, or street parades accompany the holiday?',
      'Do you prefer traditional national festivities or modern international holidays like New Year?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 1,
    title: 'Gift Giving & Celebratory Presents',
    prompt_text: 'When do you usually present gifts to your family members and close acquaintances?',
    follow_up_questions: [
      'Do you find it difficult to pick out the perfect gift for someone special?',
      'Do you prefer receiving practical, functional items or surprise sentimental gifts?',
      'Have you ever handcrafted a handmade present instead of buying one in a store?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 1,
    title: 'History & Ancient Landmarks',
    prompt_text: 'Did you enjoy studying world or national history lessons during your school education?',
    follow_up_questions: [
      'Are there ancient monuments, castles, or historic heritage sites in your home region?',
      'Do you think it is important for young generations to understand their cultural heritage?',
      'If you possessed a time machine, which historical era would you choose to visit?'
    ],
    difficulty: 'medium',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 1,
    title: 'The Sea, Rivers & Water Activities',
    prompt_text: 'Do you enjoy spending time near rivers, lakes, or coastal seaside beaches?',
    follow_up_questions: [
      'Can you swim well, and did you learn swimming techniques at an early age?',
      'What water-based activities or sports have you tried or would like to experience?',
      'Why do you think so many travelers feel drawn to waterfront holiday destinations?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 1,
    title: 'Memory & Retaining Information',
    prompt_text: 'Do you consider yourself someone with a sharp memory for names and telephone numbers?',
    follow_up_questions: [
      'What memory tricks or digital calendar tools do you use to remember critical appointments?',
      'What is your earliest childhood memory that you can still clearly picture?',
      'Why do you think some people retain visual images better than spoken words?'
    ],
    difficulty: 'medium',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 1,
    title: 'Lost Items & Misplacing Belongings',
    prompt_text: 'Have you ever misplaced an essential item like your keys, wallet, or mobile phone?',
    follow_up_questions: [
      'How did you react, and were you able to locate the lost belonging eventually?',
      'What practical measures do you take to avoid forgetting valuables when traveling?',
      'What should a person do if they find an unattended item in a public subway station?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 1,
    title: 'Cash, Cards & Electronic Payments',
    prompt_text: 'Do you usually carry physical cash notes in your wallet or make contactless card payments?',
    follow_up_questions: [
      'How widespread is mobile QR-code scanning or phone payments in your city?',
      'Are there any circumstances where physical paper currency remains essential?',
      'Do you foresee a fully cashless society emerging in your country within the next decade?'
    ],
    difficulty: 'medium',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 1,
    title: 'Maps & GPS Satellite Navigation',
    prompt_text: 'Do you use digital map apps on your phone frequently when navigating to new destinations?',
    follow_up_questions: [
      'Can you read traditional paper folded maps, or do you find them confusing?',
      'Have you ever ended up completely lost because a digital navigation map led you astray?',
      'Do you prefer asking local passersby for walking directions or relying purely on GPS technology?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 1,
    title: 'Scientific Discoveries & Inventions',
    prompt_text: 'Were you interested in scientific subjects like chemistry and physics in school?',
    follow_up_questions: [
      'Which modern technological invention has had the most profound impact on daily life?',
      'Do you enjoy watching scientific documentaries or reading space exploration news?',
      'What major scientific problem do you hope researchers solve during your lifetime?'
    ],
    difficulty: 'medium',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 1,
    title: 'Names, Nicknames & Family Naming',
    prompt_text: 'Does your given name carry any special historic or linguistic meaning?',
    follow_up_questions: [
      'Who selected your name when you were born, and are there nicknames friends call you?',
      'Are there traditional customs regarding how newborn babies are named in your country?',
      'Would you ever contemplate officially changing your legal name in the future?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 1,
    title: 'Concentration & Staying Focused',
    prompt_text: 'When do you find it easiest to maintain intense focus and concentration on complex tasks?',
    follow_up_questions: [
      'What environmental distractions tend to disrupt your workflow most frequently?',
      'Do you listen to background music or white noise to maintain deep focus?',
      'What productive steps do you take when you realize your mind has begun wandering?'
    ],
    difficulty: 'medium',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 1,
    title: 'Bags, Backpacks & Carrying Belongings',
    prompt_text: 'What type of bag or backpack do you typically carry when you leave your house?',
    follow_up_questions: [
      'Do you consider aesthetic style or ergonomic functionality more when buying a bag?',
      'What essential items do you always keep inside your everyday bag?',
      'Do you carry different styles of bags for travel journeys versus work commutes?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 1,
    title: 'Mirrors & Personal Reflections',
    prompt_text: 'How often do you check your reflection in a mirror throughout the course of a day?',
    follow_up_questions: [
      'Do you have decorative wall mirrors positioned around your home?',
      'Do you ever use mirrors to make smaller rooms appear more spacious and bright?',
      'Are you the kind of person who buys mirrors as interior home decor presents?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 1,
    title: 'Personal Goals & Future Aspirations',
    prompt_text: 'What is a major personal or career goal you are currently striving to accomplish?',
    follow_up_questions: [
      'How do you measure steady progress toward achieving long-term milestones?',
      'Who provides you with encouragement and mentorship when you face setbacks?',
      'Do you prefer setting rigid annual goals or remaining flexible to unexpected opportunities?'
    ],
    difficulty: 'medium',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 1,
    title: 'Breaks, Short Vacations & Rest Periods',
    prompt_text: 'How often do you take short rest breaks when working or studying for long hours?',
    follow_up_questions: [
      'What do you typically do during a 10-minute break to recharge your mental energy?',
      'Do you prefer taking several short mini-breaks throughout the year or one prolonged vacation?',
      'Why is regular physical rest crucial for avoiding burnout and sustaining long-term productivity?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  }
];

export const PART_2_PROMPTS: SpeakingPromptData[] = [
  {
    part_number: 2,
    title: 'Describe a person who has greatly influenced your life',
    prompt_text: '<h3>Candidate Task Card (Part 2)</h3><p>Describe a person who has had a powerful and lasting influence on your life choices.</p><p>You should say:</p><ul><li>Who this individual is and your relationship to them</li><li>How you first met or interacted with them</li><li>What specific qualities, advice, or actions impressed you</li></ul><p>and explain how this person has helped shape who you are today.</p>',
    follow_up_questions: [
      'Do you still maintain regular contact with this individual today?',
      'How do role models and mentors influence the aspirations of young adults?'
    ],
    difficulty: 'medium',
    is_premium: false,
    status: 'published'
  },
  {
    part_number: 2,
    title: 'Describe a memorable journey you took by public transport',
    prompt_text: '<h3>Candidate Task Card (Part 2)</h3><p>Describe a memorable journey you took using public transportation (such as a train, coach, or ferry).</p><p>You should say:</p><ul><li>Where you departed from and where you were going</li><li>What mode of transport you took and who was with you</li><li>What scenic views or unexpected events occurred during the trip</li></ul><p>and explain why this specific journey made such a lasting impression on you.</p>',
    follow_up_questions: [
      'Do you generally prefer traveling by train or by airplane?',
      'How can governments incentivize more citizens to choose public transport over private cars?'
    ],
    difficulty: 'medium',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 2,
    title: 'Describe a useful skill you would like to master in the future',
    prompt_text: '<h3>Candidate Task Card (Part 2)</h3><p>Describe a practical or creative skill you would love to learn and master in the future.</p><p>You should say:</p><ul><li>What the skill is and why you find it appealing</li><li>How and where you plan to acquire this skill</li><li>What resources, tools, or time commitment it will require</li></ul><p>and explain how mastering this skill will enrich your life or career.</p>',
    follow_up_questions: [
      'Is it harder for adults to learn new skills than it is for children?',
      'What skills are becoming indispensable in the automated workplace of the 21st century?'
    ],
    difficulty: 'medium',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 2,
    title: 'Describe an exciting live event or festival you attended',
    prompt_text: '<h3>Candidate Task Card (Part 2)</h3><p>Describe an exciting live public event, sporting contest, or music festival that you attended.</p><p>You should say:</p><ul><li>What event it was and where it took place</li><li>Who accompanied you to the event</li><li>What the overall atmosphere and key highlights were</li></ul><p>and explain why you found the experience so enjoyable and memorable.</p>',
    follow_up_questions: [
      'Do live events generate a different feeling than watching recorded broadcasts?',
      'How do large cultural festivals benefit local economies and tourism sectors?'
    ],
    difficulty: 'medium',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 2,
    title: 'Describe a quiet spot in your city you visit to relax',
    prompt_text: '<h3>Candidate Task Card (Part 2)</h3><p>Describe a peaceful, quiet place in your town or city that you enjoy visiting when you need to unwind.</p><p>You should say:</p><ul><li>Where this place is situated</li><li>How frequently you go there and what you do there</li><li>What makes this location so serene and tranquil</li></ul><p>and explain why this spot helps you decompress and regain mental clarity.</p>',
    follow_up_questions: [
      'Why is it becoming harder to find truly quiet environments in modern cities?',
      'What can urban city planners do to reduce noise pollution in residential neighborhoods?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 2,
    title: 'Describe a book that had a significant impact on your perspective',
    prompt_text: '<h3>Candidate Task Card (Part 2)</h3><p>Describe an insightful book that you read which made a lasting impression on your worldview.</p><p>You should say:</p><ul><li>What the title and genre of the book was</li><li>When and why you decided to read it</li><li>What core theme, narrative, or philosophical idea it explored</li></ul><p>and explain how reading this book altered your perspectives or actions.</p>',
    follow_up_questions: [
      'Do people still read as deeply today given the abundance of short online content?',
      'Should reading fiction be given the same priority as non-fiction in schools?'
    ],
    difficulty: 'medium',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 2,
    title: 'Describe a piece of modern technology that simplifies your life',
    prompt_text: '<h3>Candidate Task Card (Part 2)</h3><p>Describe a piece of electronic equipment or smart technology that you rely on every day.</p><p>You should say:</p><ul><li>What the device is and how long you have owned it</li><li>What main functions and features you utilize</li><li>How it compares to traditional methods or older devices</li></ul><p>and explain how this technology saves you time or boosts your efficiency.</p>',
    follow_up_questions: [
      'Has society become overly dependent on automated technological appliances?',
      'What new piece of smart home technology do you predict will become common next?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 2,
    title: 'Describe an engaging conversation you had with a stranger',
    prompt_text: '<h3>Candidate Task Card (Part 2)</h3><p>Describe an intriguing or unexpected conversation you had with someone you had never met before.</p><p>You should say:</p><ul><li>Where and under what circumstances you encountered this stranger</li><li>What topics or experiences you discussed</li><li>How long the conversation lasted</li></ul><p>and explain what made this interaction so memorable and thought-provoking.</p>',
    follow_up_questions: [
      'Is it typical for people in your culture to strike up conversations with strangers on public transit?',
      'What benefits can talking to diverse people from different walks of life offer?'
    ],
    difficulty: 'medium',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 2,
    title: 'Describe a time when you helped someone solve a problem',
    prompt_text: '<h3>Candidate Task Card (Part 2)</h3><p>Describe an occasion when you stepped in to offer meaningful assistance or support to someone.</p><p>You should say:</p><ul><li>Who the person was and what problem they faced</li><li>What specific assistance or advice you provided</li><li>How they responded to your support</li></ul><p>and explain how you felt after helping this individual overcome their difficulty.</p>',
    follow_up_questions: [
      'Are people in your community generally willing to help neighbors in distress?',
      'Why is developing empathy and community volunteering essential for children?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 2,
    title: 'Describe an ambition you have been working toward for a long time',
    prompt_text: '<h3>Candidate Task Card (Part 2)</h3><p>Describe a long-term goal or personal ambition that you have not yet completely achieved.</p><p>You should say:</p><ul><li>What the ambition is and when you first set it</li><li>What deliberate steps you have taken so far toward reaching it</li><li>What obstacles or challenges you have encountered along the way</li></ul><p>and explain why achieving this ambition means so much to your future.</p>',
    follow_up_questions: [
      'What qualities differentiate individuals who achieve their ambitions from those who give up?',
      'How does parental expectation influence the career ambitions of young graduates?'
    ],
    difficulty: 'medium',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 2,
    title: 'Describe a historical period or culture that you find captivating',
    prompt_text: '<h3>Candidate Task Card (Part 2)</h3><p>Describe a period of human history or ancient civilization that you find exceptionally interesting.</p><p>You should say:</p><ul><li>Which historical era or civilization it is</li><li>How you first learned about this time period</li><li>What notable cultural accomplishments, battles, or lifestyle traits characterized it</li></ul><p>and explain why you find this particular era so captivating.</p>',
    follow_up_questions: [
      'Why do you think learning from historical mistakes is crucial for modern policymakers?',
      'How can museums make ancient history more interactive and captivating for teenagers?'
    ],
    difficulty: 'hard',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 2,
    title: 'Describe a traditional celebration or cultural festival in your country',
    prompt_text: '<h3>Candidate Task Card (Part 2)</h3><p>Describe a traditional celebration, wedding ceremony, or festival celebrated in your homeland.</p><p>You should say:</p><ul><li>What festival it is and what historical or religious significance it holds</li><li>When and where it is celebrated</li><li>What special rituals, foods, and clothes are associated with it</li></ul><p>and explain why this celebration remains important for preserving your culture.</p>',
    follow_up_questions: [
      'Are younger generations celebrating traditional festivals in the same manner as older generations?',
      'How can traditional celebrations help foster unity among diverse multicultural citizens?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 2,
    title: 'Describe a photograph that evokes deep emotional memories',
    prompt_text: '<h3>Candidate Task Card (Part 2)</h3><p>Describe a special photograph of yourself, family, or friends that holds strong sentimental value.</p><p>You should say:</p><ul><li>When and where the photograph was taken</li><li>Who appears in the picture with you</li><li>What was happening at that precise moment</li></ul><p>and explain why this photograph is so meaningful and treasured by you.</p>',
    follow_up_questions: [
      'Has the ease of taking hundreds of phone photos diminished the special value of individual pictures?',
      'Why do people maintain physical photo albums even when cloud storage is widely available?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 2,
    title: 'Describe a creative hobby or craft that you enjoy doing',
    prompt_text: '<h3>Candidate Task Card (Part 2)</h3><p>Describe a creative activity, craft, or artistic hobby that you enjoy participating in.</p><p>You should say:</p><ul><li>What the creative activity is and how you do it</li><li>How you first picked up this creative hobby</li><li>What tools, materials, or equipment are needed</li></ul><p>and explain how engaging in this creative outlet makes you feel.</p>',
    follow_up_questions: [
      'Should schools dedicate equal funding to creative arts as they do to science subjects?',
      'How can creative thinking benefit professionals working in corporate analytical fields?'
    ],
    difficulty: 'medium',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 2,
    title: 'Describe a difficult decision that took you a long time to make',
    prompt_text: '<h3>Candidate Task Card (Part 2)</h3><p>Describe a challenging life, academic, or professional decision you had to make.</p><p>You should say:</p><ul><li>What decision you were confronted with</li><li>What potential options, risks, and benefits were involved</li><li>Who you consulted for guidance before deciding</li></ul><p>and explain whether you feel you made the right decision in hindsight.</p>',
    follow_up_questions: [
      'Why do many young adults struggle with making independent life decisions?',
      'Should people rely more on gut instincts or systematic logical evaluation when deciding important matters?'
    ],
    difficulty: 'medium',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 2,
    title: 'Describe an eco-friendly practice you adopted to protect nature',
    prompt_text: '<h3>Candidate Task Card (Part 2)</h3><p>Describe a positive environmental habit or practice you have adopted to reduce your ecological footprint.</p><p>You should say:</p><ul><li>What the habit is (e.g., recycling, saving water, cutting single-use plastics)</li><li>When and why you decided to start doing it</li><li>How easy or demanding it was to incorporate into your lifestyle</li></ul><p>and explain what overall environmental impact collective actions like this can achieve.</p>',
    follow_up_questions: [
      'Are individual consumer efforts enough to combat climate change, or are government regulations primary?',
      'What environmental initiatives in your community have successfully educated the public?'
    ],
    difficulty: 'medium',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 2,
    title: 'Describe an outdoor childhood game or activity you loved',
    prompt_text: '<h3>Candidate Task Card (Part 2)</h3><p>Describe an outdoor game or recreational activity that you frequently enjoyed during your childhood.</p><p>You should say:</p><ul><li>What the game or activity was and where you played it</li><li>Who you played with and what the primary rules were</li><li>What made this game so exciting and fun for you</li></ul><p>and explain how childhood outdoor play compares with the entertainment habits of today’s children.</p>',
    follow_up_questions: [
      'Are children today spending too much sedentary time in front of video screens?',
      'What benefits does unstructured outdoor play provide for developing physical coordination and social skills?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 2,
    title: 'Describe a museum or historical exhibition that left a strong impression',
    prompt_text: '<h3>Candidate Task Card (Part 2)</h3><p>Describe an impressive museum, science center, or art gallery that you visited.</p><p>You should say:</p><ul><li>Where the museum was located and when you visited it</li><li>What kind of exhibits, artifacts, or displays were featured</li><li>What specific gallery section or piece stood out the most to you</li></ul><p>and explain why visiting this museum was such an enriching educational experience.</p>',
    follow_up_questions: [
      'How are modern museums utilizing interactive digital screens and VR to engage visitors?',
      'Should national governments prioritize funding heritage preservation over contemporary arts?'
    ],
    difficulty: 'medium',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 2,
    title: 'Describe an occasion when you received unexpected good news',
    prompt_text: '<h3>Candidate Task Card (Part 2)</h3><p>Describe a specific time when you received surprising and uplifting good news.</p><p>You should say:</p><ul><li>What the good news was about</li><li>When and how you received this news (via email, call, or letter)</li><li>Who you were with when you heard it</li></ul><p>and explain how you reacted and celebrated this positive announcement.</p>',
    follow_up_questions: [
      'How does sharing positive news with family amplify personal joy?',
      'Why does mainstream news media tend to emphasize negative headlines over inspiring stories?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 2,
    title: 'Describe an elderly person whose wisdom you deeply respect',
    prompt_text: '<h3>Candidate Task Card (Part 2)</h3><p>Describe an older person (a grandparent, teacher, or community elder) whom you admire.</p><p>You should say:</p><ul><li>Who this person is and how you are acquainted with them</li><li>What life experiences, hardships, or achievements they have navigated</li><li>What valuable life lessons or guidance they have shared with you</li></ul><p>and explain why you hold such deep respect and reverence for this individual.</p>',
    follow_up_questions: [
      'What vital roles do senior citizens play in preserving familial heritage and values?',
      'How does respect for elderly generations differ between Western and Eastern cultural traditions?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 2,
    title: 'Describe an application or website that you find indispensable',
    prompt_text: '<h3>Candidate Task Card (Part 2)</h3><p>Describe a mobile app or website that you use continually for work, study, or daily life.</p><p>You should say:</p><ul><li>What the application is and how you first discovered it</li><li>What primary services or tools it provides</li><li>How frequently you open and interact with it</li></ul><p>and explain why this software application has become so indispensable to your routine.</p>',
    follow_up_questions: [
      'What security concerns should users keep in mind when sharing personal data on apps?',
      'Will future apps rely entirely on voice-activated artificial intelligence assistants?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 2,
    title: 'Describe a thoughtful gift you gave to someone that took effort to choose',
    prompt_text: '<h3>Candidate Task Card (Part 2)</h3><p>Describe a gift that you spent considerable thought, time, or creativity selecting for a friend or relative.</p><p>You should say:</p><ul><li>Who the recipient was and what occasion was being marked</li><li>What gift you chose and why you selected that specific item</li><li>How you prepared or presented the gift to them</li></ul><p>and explain how the recipient reacted upon opening your present.</p>',
    follow_up_questions: [
      'Is the sentimental value of a present always more important than its commercial price tag?',
      'How has the rise of digital gift cards and online registries transformed gift-giving traditions?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 2,
    title: 'Describe an unforgettable meal you shared with cherished company',
    prompt_text: '<h3>Candidate Task Card (Part 2)</h3><p>Describe a memorable meal or dinner party you shared with close friends or family.</p><p>You should say:</p><ul><li>When and where this meal took place</li><li>Who was present at the table with you</li><li>What special dishes or beverages were prepared and served</li></ul><p>and explain why this communal dining experience left such a warm impression on you.</p>',
    follow_up_questions: [
      'Why is communal dining considered such a powerful bonding ritual across all cultures?',
      'Has fast-food culture weakened the tradition of family members sitting together for dinner?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 2,
    title: 'Describe an impressive piece of architecture or historical building',
    prompt_text: '<h3>Candidate Task Card (Part 2)</h3><p>Describe an impressive architectural building or historical monument that caught your attention.</p><p>You should say:</p><ul><li>Where this building is located and what purpose it serves</li><li>What its architectural style, materials, and exterior design look like</li><li>When and why you had the opportunity to view or enter it</li></ul><p>and explain what made this architectural structure so striking and magnificent.</p>',
    follow_up_questions: [
      'Should historic city quarters be protected from contemporary glass skyscrapers?',
      'What balance should modern urban architects strike between aesthetic beauty and energy sustainability?'
    ],
    difficulty: 'medium',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 2,
    title: 'Describe a major accomplishment that made you feel immensely proud',
    prompt_text: '<h3>Candidate Task Card (Part 2)</h3><p>Describe a personal victory, academic milestone, or professional accomplishment you reached.</p><p>You should say:</p><ul><li>What you accomplished and when it occurred</li><li>What difficulties, doubts, or preparation were involved</li><li>Who supported, mentored, or cheered for you during the process</li></ul><p>and explain why achieving this milestone gave you such immense pride and self-confidence.</p>',
    follow_up_questions: [
      'How should parents praise children to encourage resilience rather than fear of failure?',
      'Does society place excessive emphasis on visible accolades and titles over quiet dedication?'
    ],
    difficulty: 'medium',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 2,
    title: 'Describe a thought-provoking movie or documentary you watched',
    prompt_text: '<h3>Candidate Task Card (Part 2)</h3><p>Describe an influential film, cinema release, or documentary that made you reflect deeply.</p><p>You should say:</p><ul><li>What the title was and what central theme or true story it covered</li><li>Where and with whom you watched the production</li><li>What cinematic performances or factual revelations resonated most</li></ul><p>and explain why this movie or documentary had such a powerful emotional effect on you.</p>',
    follow_up_questions: [
      'Can cinema and documentaries genuinely stimulate societal change and policy reforms?',
      'Why are true-crime and biographical documentaries gaining so much global popularity?'
    ],
    difficulty: 'medium',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 2,
    title: 'Describe a captivating piece of art, sculpture, or painting you saw',
    prompt_text: '<h3>Candidate Task Card (Part 2)</h3><p>Describe a memorable painting, mural, or sculpted artwork that resonated with you.</p><p>You should say:</p><ul><li>What the artwork depicted and who created it (if known)</li><li>Where and when you viewed this artistic piece</li><li>What colors, techniques, or themes stood out in the work</li></ul><p>and explain why you found this particular piece of art so captivating.</p>',
    follow_up_questions: [
      'Does art require formal training to appreciate, or is appreciation purely emotional and subjective?',
      'Should public street art and murals be encouraged by municipal councils in drab urban centers?'
    ],
    difficulty: 'medium',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 2,
    title: 'Describe a thrilling sports match or competition you witnessed',
    prompt_text: '<h3>Candidate Task Card (Part 2)</h3><p>Describe an intense sporting match, athletic competition, or tournament game you watched.</p><p>You should say:</p><ul><li>What sport it was and which rival teams or athletes were competing</li><li>Where you watched the match (in an arena or on television)</li><li>What dramatic twists, scoring moments, or comebacks unfolded</li></ul><p>and explain why this sporting encounter was so thrilling and unforgettable.</p>',
    follow_up_questions: [
      'Why do professional sports foster such intense passion and emotional loyalty among spectators?',
      'Are elite athletes positive moral role models for aspiring young sportsmen and women?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 2,
    title: 'Describe a successful team project you participated in',
    prompt_text: '<h3>Candidate Task Card (Part 2)</h3><p>Describe a collaborative project at work, university, or in your community where teamwork was vital.</p><p>You should say:</p><ul><li>What the project objective was and who your team members were</li><li>What specific role and assignments you were responsible for</li><li>How your team handled disagreements or tight deadlines</li></ul><p>and explain what factors contributed to your team’s ultimate success.</p>',
    follow_up_questions: [
      'What core leadership qualities ensure that diverse teams collaborate cohesively?',
      'Can team collaboration be equally effective in remote virtual environments versus in-person offices?'
    ],
    difficulty: 'medium',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 2,
    title: 'Describe an item of clothing or uniform you wore on a special occasion',
    prompt_text: '<h3>Candidate Task Card (Part 2)</h3><p>Describe a formal dress, traditional costume, or special attire you wore for an important event.</p><p>You should say:</p><ul><li>What the clothing item looked like and who selected or made it</li><li>What special occasion or ceremony you wore it to attend</li><li>How comfortable and confident you felt wearing it</li></ul><p>and explain why this specific outfit was so appropriate and memorable for the event.</p>',
    follow_up_questions: [
      'Do formal dress codes still hold relevance in progressive modern workplaces?',
      'How does fast-fashion mass production impact environmental sustainability globally?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 2,
    title: 'Describe a fascinating trip you took to another city or country',
    prompt_text: '<h3>Candidate Task Card (Part 2)</h3><p>Describe an exciting journey you undertook when visiting a foreign country or unfamiliar city.</p><p>You should say:</p><ul><li>Where you traveled and how long your visit lasted</li><li>What local sights, foods, and cultural customs you experienced</li><li>Who accompanied you or whom you met during the journey</li></ul><p>and explain why this international or domestic travel destination fascinated you so much.</p>',
    follow_up_questions: [
      'How does firsthand exposure to foreign cultures broaden an individual’s worldview?',
      'What responsibilities do tourists carry to respect the cultural sensitivities of host communities?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 2,
    title: 'Describe a foreign language you would like to become fluent in',
    prompt_text: '<h3>Candidate Task Card (Part 2)</h3><p>Describe a language (other than your native tongue and English) that you would love to speak fluently.</p><p>You should say:</p><ul><li>What language it is and where it is spoken</li><li>Why you are drawn to learning this specific language</li><li>How you would go about mastering its grammar, pronunciation, and vocabulary</li></ul><p>and explain what career, travel, or cultural doors fluency in this language would unlock.</p>',
    follow_up_questions: [
      'Why do some languages dominate global commerce and diplomacy while smaller dialects decline?',
      'What are the cognitive and neurological benefits of maintaining bilingualism throughout life?'
    ],
    difficulty: 'medium',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 2,
    title: 'Describe an inspirational teacher or lecturer from your schooling',
    prompt_text: '<h3>Candidate Task Card (Part 2)</h3><p>Describe a dedicated teacher, tutor, or university professor who had a profound effect on your education.</p><p>You should say:</p><ul><li>Who this educator was and what subject they taught you</li><li>What instructional methods, patience, or passion distinguished their teaching style</li><li>How they supported and encouraged you when you struggled</li></ul><p>and explain why this teacher remains an enduring inspiration in your academic journey.</p>',
    follow_up_questions: [
      'What pedagogical qualities make an outstanding educator truly transformative for young students?',
      'Will generative AI tutoring ever completely replace human teachers in classroom settings?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 2,
    title: 'Describe a time when you solved an unexpected problem independently',
    prompt_text: '<h3>Candidate Task Card (Part 2)</h3><p>Describe a challenging situation or breakdown where you took initiative to solve the issue on your own.</p><p>You should say:</p><ul><li>What the unexpected problem was and where it occurred</li><li>Why there was nobody readily available to resolve it for you</li><li>What logical steps or resourceful actions you took to fix it</li></ul><p>and explain what you learned about self-reliance and problem-solving from the experience.</p>',
    follow_up_questions: [
      'How can educational curricula better cultivate practical problem-solving and critical thinking?',
      'Why is panic management the most critical first step when unexpected crises emerge?'
    ],
    difficulty: 'medium',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 2,
    title: 'Describe a creative commercial or advertisement that left an impression',
    prompt_text: '<h3>Candidate Task Card (Part 2)</h3><p>Describe a memorable video commercial, billboard, or online advertisement that captured your interest.</p><p>You should say:</p><ul><li>What product, brand, or social awareness campaign was being advertised</li><li>Where and when you first encountered this advertisement</li><li>What visual storytelling, humor, or musical elements made it standout</li></ul><p>and explain why you think this advertisement was effective in communicating its message.</p>',
    follow_up_questions: [
      'Do modern targeted algorithms make online advertisements overly intrusive on user privacy?',
      'Should strict regulations be placed on commercial marketing directed at young children?'
    ],
    difficulty: 'medium',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 2,
    title: 'Describe a daily routine or healthy ritual that boosts your well-being',
    prompt_text: '<h3>Candidate Task Card (Part 2)</h3><p>Describe a daily habit, morning routine, or exercise ritual that keeps you balanced and energetic.</p><p>You should say:</p><ul><li>What the routine or ritual involves</li><li>How long you have adhered to this daily practice</li><li>How and when during the day you carry it out</li></ul><p>and explain what physical or mental benefits this habit consistently delivers to your life.</p>',
    follow_up_questions: [
      'Why do many people find it notoriously difficult to establish and sustain positive lifestyle habits?',
      'How does workplace hustle culture interfere with maintaining adequate self-care and rest?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 2,
    title: 'Describe a theatrical play, concert, or performance you enjoyed',
    prompt_text: '<h3>Candidate Task Card (Part 2)</h3><p>Describe an impressive stage play, orchestral concert, stand-up comedy, or performance you attended.</p><p>You should say:</p><ul><li>What the performance was and where the venue was located</li><li>Who performed on stage and who accompanied you in the audience</li><li>What stagecraft, musical talent, or storytelling elevated the show</li></ul><p>and explain why this artistic performance left such a captivating impression on you.</p>',
    follow_up_questions: [
      'Why do live theater and orchestral music require continuing state subsidies to survive?',
      'How do live theatrical performances convey emotional nuance differently than cinema films?'
    ],
    difficulty: 'medium',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 2,
    title: 'Describe an occasion when you felt completely peaceful and relaxed',
    prompt_text: '<h3>Candidate Task Card (Part 2)</h3><p>Describe a specific day or getaway when you felt entirely free of stress and thoroughly at peace.</p><p>You should say:</p><ul><li>Where you were located and who was with you (or if you were alone)</li><li>What you did during that day</li><li>What environmental factors contributed to your peaceful state of mind</li></ul><p>and explain why this specific experience of calm relaxation was so memorable to you.</p>',
    follow_up_questions: [
      'Why are modern working professionals finding it increasingly difficult to truly switch off from work duties?',
      'What role does immersion in natural wilderness play in psychological stress recovery?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 2,
    title: 'Describe an essential law or safety rule that you strongly support',
    prompt_text: '<h3>Candidate Task Card (Part 2)</h3><p>Describe an important legislation, environmental regulation, or safety law in your country.</p><p>You should say:</p><ul><li>What the law or regulation is and when it applies</li><li>How it is enforced by authorities in society</li><li>What consequences or penalties exist for breaking it</li></ul><p>and explain why you believe this rule is so vital for maintaining public safety and social order.</p>',
    follow_up_questions: [
      'What causes citizens to sometimes disregard municipal traffic or environmental regulations?',
      'How should governments educate the public before enacting contentious new statutory laws?'
    ],
    difficulty: 'hard',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 2,
    title: 'Describe a stunning natural landscape or natural wonder you visited',
    prompt_text: '<h3>Candidate Task Card (Part 2)</h3><p>Describe an awe-inspiring natural scenery, mountain range, waterfall, or coastline you saw.</p><p>You should say:</p><ul><li>Where this natural location is located and when you traveled there</li><li>What geographic features, wildlife, or vista made it breathtaking</li><li>Who you shared this sightseeing experience with</li></ul><p>and explain how being in the presence of this natural wonder made you feel.</p>',
    follow_up_questions: [
      'How can national eco-tourism authorities protect delicate natural reserves from overcrowding and littering?',
      'Why is human exposure to pristine wilderness essential for fostering ecological conservation values?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 2,
    title: 'Describe a local family-run business in your neighborhood you like',
    prompt_text: '<h3>Candidate Task Card (Part 2)</h3><p>Describe a local independent shop, bakery, or cafe in your neighborhood that you frequent.</p><p>You should say:</p><ul><li>What business it is and where it is situated</li><li>What products, food, or services they provide</li><li>What personal touch or quality distinguishes it from large corporate chains</li></ul><p>and explain why you choose to support this local independent enterprise.</p>',
    follow_up_questions: [
      'What economic and community benefits do small independent businesses provide over multinational chains?',
      'What commercial challenges do brick-and-mortar storefronts face in competing against e-commerce giants?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 2,
    title: 'Describe a celebrated public figure or cultural icon from your country',
    prompt_text: '<h3>Candidate Task Card (Part 2)</h3><p>Describe a renowned scientist, writer, athlete, or historical figure from your home country.</p><p>You should say:</p><ul><li>Who this prominent person is and what field they achieved fame in</li><li>What notable contributions or monumental achievements they made</li><li>How their work or legacy is remembered in national education and culture</li></ul><p>and explain why you personally admire and look up to this celebrated icon.</p>',
    follow_up_questions: [
      'Do modern celebrities and internet influencers carry too much unearned influence over youth culture?',
      'What responsibilities come along with occupying a position of national fame and public visibility?'
    ],
    difficulty: 'medium',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 2,
    title: 'Describe a time when you arrived unexpectedly late for an appointment',
    prompt_text: '<h3>Candidate Task Card (Part 2)</h3><p>Describe an occasion when delays caused you to arrive noticeably late for an important gathering.</p><p>You should say:</p><ul><li>What event, interview, or appointment you were traveling to attend</li><li>What unforeseen circumstances or delays caused you to be late</li><li>How you attempted to communicate your delay to the organizers</li></ul><p>and explain what consequences followed your tardiness and how you handled the situation.</p>',
    follow_up_questions: [
      'How does cultural tolerance for tardiness vary across different international business settings?',
      'What practical contingency planning can professionals practice to guarantee prompt arrival?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 2,
    title: 'Describe a valuable piece of advice you were given that helped you',
    prompt_text: '<h3>Candidate Task Card (Part 2)</h3><p>Describe an insightful recommendation or words of wisdom that a mentor or friend shared with you.</p><p>You should say:</p><ul><li>Who offered this advice and in what context or crisis</li><li>What the specific advice was</li><li>How you decided to put the advice into active practice</li></ul><p>and explain how following this guidance benefited your situation and life path.</p>',
    follow_up_questions: [
      'Why do people frequently resist constructive advice even when they actively ask for it?',
      'Should young professionals seek structured mentorship programs early in their corporate careers?'
    ],
    difficulty: 'medium',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 2,
    title: 'Describe a cherished childhood toy or game that you remember fondly',
    prompt_text: '<h3>Candidate Task Card (Part 2)</h3><p>Describe a beloved toy, board game, or keepsake that you treasured during your early childhood.</p><p>You should say:</p><ul><li>What the toy or game was and who gave it to you</li><li>How often you played with it and where</li><li>What imaginative stories or play scenarios you created around it</li></ul><p>and explain why this toy or game holds such affectionate nostalgia in your memories.</p>',
    follow_up_questions: [
      'How do classic tactile wooden toys compare with modern interactive electronic gadgets for young children?',
      'Why do adults sometimes experience deep nostalgia and preserve childhood objects into later life?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 2,
    title: 'Describe a career or dream job you would love to pursue in the future',
    prompt_text: '<h3>Candidate Task Card (Part 2)</h3><p>Describe an exciting profession, vocation, or dream career you aspire to work in.</p><p>You should say:</p><ul><li>What the job or profession is and what core tasks it entails</li><li>What qualifications, technical certifications, and experience are mandatory</li><li>Why you find this particular vocation so appealing and purposeful</li></ul><p>and explain what steps you are currently taking to position yourself for this career.</p>',
    follow_up_questions: [
      'Should young people prioritize high salary potential over personal vocational passion when choosing careers?',
      'How is artificial intelligence reshaping job market security across white-collar professions?'
    ],
    difficulty: 'medium',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 2,
    title: 'Describe a volunteer experience or community service project you joined',
    prompt_text: '<h3>Candidate Task Card (Part 2)</h3><p>Describe a charitable initiative, clean-up campaign, or volunteer work you participated in.</p><p>You should say:</p><ul><li>What the volunteer project was and what organization arranged it</li><li>Where it took place and what specific tasks you performed</li><li>Who else took part alongside you</li></ul><p>and explain why contributing your time to this social cause felt rewarding.</p>',
    follow_up_questions: [
      'Should high schools make community service hours mandatory for secondary graduation?',
      'How does volunteering foster civic responsibility and cross-generational social solidarity?'
    ],
    difficulty: 'medium',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 2,
    title: 'Describe a revolutionary invention that transformed the modern world',
    prompt_text: '<h3>Candidate Task Card (Part 2)</h3><p>Describe a historic or contemporary scientific invention that drastically reshaped human civilization.</p><p>You should say:</p><ul><li>What the invention is (e.g., the internet, antibiotics, the wheel, electricity)</li><li>Who invented or pioneered it and in what time period</li><li>How society functioned prior to this breakthrough discovery</li></ul><p>and explain why you consider this invention among the most revolutionary in human history.</p>',
    follow_up_questions: [
      'Can technological innovation ever outpace human ethical wisdom and cause societal harm?',
      'What future scientific breakthrough will have the biggest impact on human lifespan and health?'
    ],
    difficulty: 'hard',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 2,
    title: 'Describe a memorable family tradition that has been kept for generations',
    prompt_text: '<h3>Candidate Task Card (Part 2)</h3><p>Describe a special custom, annual holiday ritual, or tradition that your family faithfully observes.</p><p>You should say:</p><ul><li>What the family tradition is and when it takes place</li><li>Who participates and what special steps or preparations are required</li><li>How far back in your family history this custom originated</li></ul><p>and explain why continuing this tradition strengthens your family bonds and heritage.</p>',
    follow_up_questions: [
      'Why are family traditions in danger of fading away as younger generations relocate abroad?',
      'How can families adapt century-old customs to fit busy contemporary working lifestyles?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    part_number: 2,
    title: 'Describe a time when you received outstanding customer service',
    prompt_text: '<h3>Candidate Task Card (Part 2)</h3><p>Describe an instance at a hotel, store, restaurant, or airline where the staff provided exceptional service.</p><p>You should say:</p><ul><li>Where you were and what service or product you were receiving</li><li>What specific helpful actions the employee or staff took to assist you</li><li>How their warmth, efficiency, or problem-solving exceeded your expectations</li></ul><p>and explain why this high standard of customer care made such a memorable impression on you.</p>',
    follow_up_questions: [
      'Why is genuine human empathy and attentiveness impossible for automated chatbots to replicate?',
      'How does excellent customer service directly influence brand reputation and customer loyalty?'
    ],
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  }
];
