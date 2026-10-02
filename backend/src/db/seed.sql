-- ====================================================
-- FOX FORD — Seed Data for PostgreSQL
-- Question Types, Plans, Tags, Band Score Mappings, Sample Tests & Admin
-- ====================================================

-- 1. IELTS Question Types
INSERT INTO question_types (name, slug, skill, description) VALUES
('Multiple Choice', 'multiple_choice', 'reading', 'Choose the correct answer from four options (A, B, C, or D)'),
('Multiple Response', 'multiple_select', 'reading', 'Choose two or more correct answers from a list of options'),
('True / False / Not Given', 'true_false_not_given', 'reading', 'Identify whether facts match the passage (True, False, or Not Given)'),
('Yes / No / Not Given', 'yes_no_not_given', 'reading', 'Identify whether the writer''s claims agree with the passage'),
('Matching Headings', 'matching_headings', 'reading', 'Match paragraph headings to the correct sections of the text'),
('Matching Information', 'matching_information', 'reading', 'Locate specific information within the paragraphs'),
('Matching Features', 'matching_features', 'reading', 'Match people, dates or theories to characteristics'),
('Matching Sentence Endings', 'matching_sentence_endings', 'reading', 'Complete sentences by choosing the right endings from a list'),
('Sentence Completion', 'sentence_completion', 'reading', 'Fill in missing words in a sentence directly from the text'),
('Summary Completion', 'summary_completion', 'reading', 'Fill in gaps in a summarized version of the passage'),
('Note Completion', 'note_completion', 'listening', 'Complete gaps in a set of notes from audio listening'),
('Table Completion', 'table_completion', 'reading', 'Fill in missing information inside a structured table'),
('Flow Chart Completion', 'flow_chart_completion', 'reading', 'Complete the sequence of stages in a process flow chart'),
('Diagram Label Completion', 'diagram_label_completion', 'reading', 'Label parts of a diagram based on the description in the text'),
('Short Answer', 'short_answer', 'reading', 'Answer questions using words directly from the text'),
('Plan / Map / Diagram', 'plan_map_diagram', 'listening', 'Identify locations or features on a map/plan as described in audio'),
('Form Completion', 'form_completion', 'listening', 'Complete forms with personal details, numbers, dates or names'),
('Writing Task 1', 'writing_task_1', 'writing', 'Summarise, describe or explain information from a graph, table, chart or diagram'),
('Writing Task 2', 'writing_task_2', 'writing', 'Write an essay in response to a point of view, argument or problem'),
('Speaking Part 1', 'speaking_part_1', 'speaking', 'Answer general questions on familiar topics such as home, family, work and studies'),
('Speaking Part 2', 'speaking_part_2', 'speaking', 'Speak for up to 2 minutes on a particular topic given on a task card'),
('Speaking Part 3', 'speaking_part_3', 'speaking', 'Discuss more abstract ideas and issues related to the topic in Part 2')
ON CONFLICT (slug) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- 1b. Promo Coupons
INSERT INTO coupons (code, discount_type, discount_value, max_uses, is_active) VALUES
('FOXFORD20', 'percentage', 20, 500, true),
('IELTS2026', 'percentage', 25, 100, true),
('WELCOME5', 'fixed_usd', 5, 200, true)
ON CONFLICT (code) DO NOTHING;

-- 2. Standard Membership Plans
INSERT INTO plans (name, slug, price, currency, interval, features, is_active, sort_order) VALUES
('Free Trial', 'free', 0, 'USD', 'monthly', ARRAY['3 Full Mock Tests', 'Basic Reading & Listening Practice', 'Vocabulary Flashcards', 'Community Support'], true, 1),
('Monthly Pro', 'monthly', 1900, 'USD', 'monthly', ARRAY['Unlimited Reading & Listening Tests', 'AI Writing Evaluation with Band Score', 'AI Speaking Examiner Simulation', 'Full Answer Explanations', 'Telegram Bot Notifications'], true, 2),
('Yearly Premium', 'yearly', 14900, 'USD', 'yearly', ARRAY['All Monthly Pro Features', 'Save 35% compared to monthly', 'Personalized IELTS Study Plan', 'Priority AI Grading Queue', 'Downloadable Cambridge PDFs'], true, 3),
('Lifetime Access', 'lifetime', 29900, 'USD', 'lifetime', ARRAY['Permanent Full Access', 'All Future Updates Included', '1-on-1 Mentor Strategy Session', 'VIP Telegram Channel Access'], true, 4)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  features = EXCLUDED.features;

-- 3. Content Tags
INSERT INTO tags (name, slug, color) VALUES
('Cambridge 19', 'cambridge-19', '#f59e0b'),
('Cambridge 18', 'cambridge-18', '#10b981'),
('Academic', 'academic', '#3b82f6'),
('General Training', 'general-training', '#8b5cf6'),
('Environment', 'environment', '#059669'),
('Technology', 'technology', '#0284c7'),
('History', 'history', '#d97706'),
('Education', 'education', '#e11d48')
ON CONFLICT (slug) DO NOTHING;

-- 4. Band Score Mappings (Raw 0-40 score -> Band 0-9.0 for Academic Reading)
DELETE FROM band_score_mappings WHERE skill = 'reading';
INSERT INTO band_score_mappings (skill, test_type, raw_score_min, raw_score_max, band_score) VALUES
('reading', 'academic', 39, 40, 9.0),
('reading', 'academic', 37, 38, 8.5),
('reading', 'academic', 35, 36, 8.0),
('reading', 'academic', 33, 34, 7.5),
('reading', 'academic', 30, 32, 7.0),
('reading', 'academic', 27, 29, 6.5),
('reading', 'academic', 23, 26, 6.0),
('reading', 'academic', 19, 22, 5.5),
('reading', 'academic', 15, 18, 5.0),
('reading', 'academic', 13, 14, 4.5),
('reading', 'academic', 10, 12, 4.0),
('reading', 'academic', 8, 9, 3.5),
('reading', 'academic', 6, 7, 3.0),
('reading', 'academic', 4, 5, 2.5),
('reading', 'academic', 0, 3, 2.0);

-- Band Score Mappings (Listening 0-40)
DELETE FROM band_score_mappings WHERE skill = 'listening';
INSERT INTO band_score_mappings (skill, test_type, raw_score_min, raw_score_max, band_score) VALUES
('listening', 'academic', 39, 40, 9.0),
('listening', 'academic', 37, 38, 8.5),
('listening', 'academic', 35, 36, 8.0),
('listening', 'academic', 32, 34, 7.5),
('listening', 'academic', 30, 31, 7.0),
('listening', 'academic', 26, 29, 6.5),
('listening', 'academic', 23, 25, 6.0),
('listening', 'academic', 18, 22, 5.5),
('listening', 'academic', 16, 17, 5.0),
('listening', 'academic', 13, 15, 4.5),
('listening', 'academic', 10, 12, 4.0),
('listening', 'academic', 8, 9, 3.5),
('listening', 'academic', 6, 7, 3.0),
('listening', 'academic', 4, 5, 2.5),
('listening', 'academic', 0, 3, 2.0);

-- 5. Default Super Admin Account (Password: AdminPassword123!)
-- Hash generated with bcrypt cost 10: $2b$10$tZ2yYq/9X70g1uFkWsPBOe0F4aI/5iJomxJb0jQ1L3qW2k3e7uQ/G
INSERT INTO users (id, email, password_hash, role)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'xudayberganovbackend@gmail.com',
  '$2b$10$Y1Kq33M4P.Hw2F7r0cK0xe4l3mXlM6S7H5jM0FqL9X0Q1P2W3E4R5',
  'admin'
)
ON CONFLICT (email) DO UPDATE SET role = 'admin';

INSERT INTO profiles (user_id, first_name, last_name, role, target_band, onboarding_completed)
SELECT id, 'Admin', 'Foxford', 'admin', 9.0, true
FROM users WHERE email = 'xudayberganovbackend@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- 6. Starter Vocabulary Words
INSERT INTO vocabulary_words (word, definition, example_sentence, pronunciation, part_of_speech, topic, difficulty, status) VALUES
('Ubiquitous', 'Present, appearing, or found everywhere', 'Mobile phones are now ubiquitous in modern society.', '/juːˈbɪk.wə.təs/', 'adjective', 'Technology', 'hard', 'published'),
('Detrimental', 'Tending to cause harm or damage', 'Excessive sugar consumption has a detrimental effect on health.', '/ˌdet.rəˈmen.təl/', 'adjective', 'Health', 'medium', 'published'),
('Mitigate', 'Make something bad less severe, serious, or painful', 'Governments must take swift action to mitigate climate change.', '/ˈmɪt.ə.ɡeɪt/', 'verb', 'Environment', 'medium', 'published'),
('Proliferation', 'Rapid increase in the number or amount of something', 'The proliferation of social media platforms has transformed communication.', '/prəˌlɪf.əˈreɪ.ʃən/', 'noun', 'Technology', 'hard', 'published'),
('Exacerbate', 'Make a problem, bad situation, or negative feeling worse', 'Traffic congestion is exacerbated by ongoing road construction.', '/ɪɡˈzæs.ə.beɪt/', 'verb', 'Society', 'hard', 'published'),
('Plausible', 'Seeming reasonable, probable or likely to be true', 'He offered a plausible explanation for his absence from the exam.', '/ˈplɔː.zə.bəl/', 'adjective', 'General', 'medium', 'published'),
('Advocate', 'Publicly recommend or support a particular cause or policy', 'Educational reformers advocate for interactive learning environments.', '/ˈæd.və.keɪt/', 'verb', 'Education', 'easy', 'published'),
('Sustainable', 'Able to be maintained at a certain rate or level without depleting natural resources', 'Sustainable urban planning reduces long-term ecological footprints.', '/səˈsteɪ.nə.bəl/', 'adjective', 'Environment', 'medium', 'published')
ON CONFLICT (word) DO NOTHING;

-- 7. Starter Speaking Prompts (Parts 1, 2, 3)
INSERT INTO speaking_prompts (part_number, title, prompt_text, follow_up_questions, difficulty, is_premium, status) VALUES
(1, 'Hometown & Living Environment', 'Let us talk about your hometown. Where is your hometown located, and what do you like most about living there?', '{"Has your hometown changed much since you were a child?","What kind of public transport facilities are available in your area?","Do you think your hometown is a good place for young people to live?"}', 'easy', false, 'published'),
(1, 'Work & Academic Studies', 'Do you work or are you a student? What is your typical daily study or work routine?', '{"Why did you choose that particular field or subject?","What do you find most rewarding about your daily tasks?","Do you plan to continue in this field in the future?"}', 'easy', false, 'published'),
(2, 'Describe a Memorable Journey You Took', '<h3>Candidate Task Card (Part 2)</h3><p>Describe a memorable journey you took that made a lasting impression on you.</p><p>You should say:</p><ul><li>Where you went and who accompanied you</li><li>How you traveled there</li><li>What you did during the trip</li></ul><p>and explain why this journey was especially memorable to you.</p>', '{"Do you prefer traveling alone or with other people?","What are some of the advantages of domestic travel over international travel?"}', 'medium', false, 'published'),
(2, 'Describe an Inspiring Person You Know', '<h3>Candidate Task Card (Part 2)</h3><p>Describe an inspiring person you know or have heard about who motivated you.</p><p>You should say:</p><ul><li>Who this person is and how you know them</li><li>What notable achievements they have made</li><li>How they influenced your perspective or goals</li></ul><p>and explain why you admire this individual.</p>', '{"What qualities make someone a great role model for youth?","Do you think modern public figures carry more influence than in the past?"}', 'medium', false, 'published'),
(3, 'Global Tourism and Cultural Heritage', 'Let us discuss global tourism and its broader cultural impacts. In what ways can mass tourism affect traditional local communities and historic sites?', '{"Should governments impose quotas on tourist numbers at delicate heritage landmarks?","How does international travel help break cultural stereotypes among diverse nations?","Will virtual reality ever substitute physical international vacations in the future?"}', 'hard', false, 'published'),
(3, 'Artificial Intelligence & Future of Communication', 'Let us explore the influence of digital technology on interpersonal relationships. How has instant messaging changed the way family members interact?', '{"Do automated translation apps reduce the incentive to learn foreign languages?","What ethical responsibilities do social media companies bear regarding user mental well-being?"}', 'hard', false, 'published')
ON CONFLICT DO NOTHING;

-- 8. Starter Writing Prompts (Task 1 & Task 2)
INSERT INTO writing_prompts (task_type, title, prompt_text, image_url, difficulty, is_premium, status) VALUES
('task_1', 'Internet Usage Growth in Four Countries (2000–2020)', 'The line graph illustrates the percentage of the population accessing the internet across four distinct nations from 2000 to 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.', '/uploads/internet-usage-2000-2020.png', 'medium', false, 'published'),
('task_1', 'Full-Time and Part-Time Further Education by Gender in the UK', 'The chart below shows the number of men and women in further education in Britain across three periods and whether they were studying full-time or part-time. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.', '/uploads/men-women-further-education.jpg', 'medium', true, 'published'),
('task_1', 'Carbon Dioxide (CO2) Emissions per Capita in Four Nations (1975–2020)', 'The line chart below illustrates the annual average carbon dioxide (CO2) emissions per person in metric tons across four countries (USA, UK, Sweden, and China) between 1975 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.', '/uploads/co2-emissions-1975-2020.jpg', 'medium', true, 'published'),
('task_1', 'Electricity Generated from Renewable Sources in Six European Countries (2010 vs 2020)', 'The grouped bar chart below shows the percentage of electricity generated from renewable sources (such as wind, solar, and hydro) in six European countries in the years 2010 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.', '/uploads/renewable-energy-consumption.jpg', 'medium', true, 'published'),
('task_1', 'The Stages of Water Purification and Treatment for Domestic Supply', 'The diagram below shows the sequential stages involved in the collection, purification, and treatment of water for domestic consumption. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.', '/uploads/water-purification-process.jpg', 'hard', true, 'published'),
('task_1', 'Gross Domestic Product (GDP) Contribution by Sector in India (1960–2000)', 'The charts below provide an overview of the percentage contribution of three primary economic sectors—Agriculture, Industry, and Services—to India''s total Gross Domestic Product between 1960 and 2000. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.', '/uploads/india-gdp-sectors.jpg', 'medium', true, 'published'),
('task_1', 'Development of Greenfield Village and Surrounding Infrastructure (1995 vs Present)', 'The two maps below show the structural changes and infrastructural developments that took place in Greenfield village between 1995 and the present day. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.', '/uploads/map-k5002.png', 'hard', true, 'published'),
('task_2', 'Digital Technology in Education', 'Some educators argue that digital tablets and online resources should completely replace traditional printed textbooks in schools. Others believe that paper books remain essential for effective learning. Discuss both views and give your own opinion. Write at least 250 words.', NULL, 'medium', false, 'published'),
('task_2', 'Urbanization and Rural Depopulation', 'In many countries, young people are leaving rural communities to pursue work and life in major metropolitan cities. What problems does this cause, and what solutions can governments implement to revitalize rural areas? Write at least 250 words.', NULL, 'hard', true, 'published'),
('task_2', 'Artificial Intelligence and Future Employment', 'Advancements in Artificial Intelligence and automation will soon make many traditional professions obsolete. Do the advantages of widespread AI automation outweigh the potential disadvantages for human society? Write at least 250 words.', NULL, 'hard', true, 'published'),
('task_2', 'University Tuition Fees vs Free Higher Education', 'Some people think that university education should be free for all students, paid for by the state. Others believe that students should pay their own tuition fees since higher qualifications directly benefit their future earning potential. Discuss both views and give your own opinion. Write at least 250 words.', NULL, 'medium', true, 'published'),
('task_2', 'Environmental Protection: Individual Action vs Government Regulation', 'Some people argue that climate change and environmental destruction can only be solved through strict government legislation and corporate penalties. Others believe individual lifestyle changes are far more critical. Discuss both views and give your opinion. Write at least 250 words.', NULL, 'medium', true, 'published'),
('task_2', 'Plastic Packaging and Consumer Goods', 'Plastic waste in oceans and landfills has reached alarming levels worldwide. Many environmentalists advocate for an immediate, total ban on single-use plastic packaging. To what extent do you agree or disagree? Write at least 250 words.', NULL, 'easy', true, 'published'),
('task_2', 'Remote Working and Telecommuting', 'An increasing number of employees now work remotely from home rather than commuting to traditional corporate offices. Discuss the advantages and disadvantages of this modern working trend for both employers and workers. Write at least 250 words.', NULL, 'medium', true, 'published'),
('task_2', 'Statutory Retirement Age and Aging Societies', 'Due to rising life expectancies and pension shortfalls, several governments are raising the mandatory retirement age to 70. Is this a positive or negative development for society as a whole? Write at least 250 words.', NULL, 'medium', true, 'published'),
('task_2', 'Taxation on Sugar and Processed Foods', 'Obesity and lifestyle-related diseases have surged globally. Some health policy makers propose introducing heavy taxes on sugary drinks and fast food to deter unhealthy consumption. To what extent do you agree or disagree with this policy? Write at least 250 words.', NULL, 'easy', true, 'published'),
('task_2', 'Public Healthcare vs Private Medical Care', 'Healthcare is a fundamental human right that should be financed entirely by national taxation. Private healthcare creates an unequal two-tier system favoring the wealthy. To what extent do you agree or disagree? Write at least 250 words.', NULL, 'hard', true, 'published'),
('task_2', 'Prison Incarceration vs Community Service Rehabilitation', 'Some criminologists claim that locking non-violent offenders in prison does not deter future crime and that community service and rehabilitation programs are far more effective. Discuss both views and give your opinion. Write at least 250 words.', NULL, 'hard', true, 'published'),
('task_2', 'Youth Crime and Parental Responsibility', 'In many countries, youth delinquency and juvenile offenses are on the rise. Some believe that parents should be held legally responsible and fined for crimes committed by their minor children. To what extent do you agree or disagree? Write at least 250 words.', NULL, 'medium', true, 'published'),
('task_2', 'Mass Tourism and Cultural Preservation', 'International mass tourism brings substantial economic wealth to developing countries, but it frequently erodes indigenous traditions and degrades historical landmarks. Do the economic benefits of international tourism outweigh the cultural damage? Write at least 250 words.', NULL, 'medium', true, 'published'),
('task_2', 'Global Uniformity and Loss of National Identity', 'Global communication, multinational retail brands, and Hollywood cinema are causing distinct national cultures to merge into a single, uniform Western culture. Is this homogenization of culture a positive or negative development? Write at least 250 words.', NULL, 'hard', true, 'published'),
('task_2', 'Preservation of Endangered Languages', 'Every few weeks, an indigenous minority language becomes extinct. Some people believe that governments should spend public money to preserve vanishing languages, while others argue it is a natural linguistic evolution that fosters unity. Discuss both views and give your opinion. Write at least 250 words.', NULL, 'hard', true, 'published'),
('task_2', 'Advertising Aimed at Young Children', 'Companies spend billions marketing confectionery, fast food, and toys directly to young children via television and internet video channels. What problems does commercial advertising to minors cause, and should governments enforce strict bans? Write at least 250 words.', NULL, 'medium', true, 'published'),
('task_2', 'Social Media Influencers and Celebrity Culture', 'Young people today are heavily influenced by internet personalities and social media celebrities rather than teachers, scientists, or family members. Why is this happening, and is this trend beneficial or harmful to youth development? Write at least 250 words.', NULL, 'easy', true, 'published'),
('task_2', 'Space Exploration vs Poverty Alleviation', 'Trillions of dollars are invested in space exploration, lunar bases, and missions to Mars. Critics argue that public funding should be redirected towards eradicating immediate poverty, hunger, and disease on Earth. To what extent do you agree or disagree? Write at least 250 words.', NULL, 'medium', true, 'published'),
('task_2', 'Public Funding for the Arts vs Basic Public Services', 'Governments should invest tax revenue exclusively in essential public infrastructure like hospitals, roads, and schools rather than subsidizing opera houses, theater, museums, and fine art galleries. To what extent do you agree or disagree? Write at least 250 words.', NULL, 'medium', true, 'published'),
('task_2', 'Autonomous Driverless Vehicles on Public Roads', 'Driverless self-driving cars and automated cargo trucks are being tested in several urban cities. Discuss the potential benefits and safety risks of replacing human drivers with autonomous artificial intelligence systems. Write at least 250 words.', NULL, 'medium', true, 'published'),
('task_2', 'Urban Traffic Congestion and Public Transit Subsidies', 'The most effective way to eliminate chronic traffic congestion and air pollution in metropolitan centers is to make all urban buses, trams, and metro systems completely free of charge. To what extent do you agree or disagree? Write at least 250 words.', NULL, 'easy', true, 'published'),
('task_2', 'Gender Equality in Senior Corporate Leadership', 'Despite legal equality, women remain significantly underrepresented in corporate executive boards and political offices. Should governments introduce mandatory gender quotas to achieve equal representation? Discuss both views and give your opinion. Write at least 250 words.', NULL, 'hard', true, 'published'),
('task_2', 'Cashless Society: Digital Payments vs Physical Currency', 'In many countries, smartphone payment apps and debit cards have largely replaced paper banknotes and coins. What are the advantages and disadvantages of moving towards a completely cashless society? Write at least 250 words.', NULL, 'medium', true, 'published'),
('task_2', 'Work-Life Balance and the Four-Day Work Week', 'Several progressive companies and European nations have introduced a mandatory four-day working week with no reduction in pay. Do the advantages of a shorter work week outweigh the disadvantages for economic productivity? Write at least 250 words.', NULL, 'medium', true, 'published'),
('task_2', 'School Curriculum: Practical Life Skills vs Academic Theory', 'Secondary schools focus too heavily on theoretical subjects such as advanced algebra and classical history while neglecting essential life skills like personal finance, cooking, and emotional resilience. To what extent do you agree or disagree? Write at least 250 words.', NULL, 'easy', true, 'published'),
('task_2', 'Mass Media Objectivity and Fake News', 'With the exponential rise of decentralized social media algorithms, citizens find it increasingly difficult to discern objective truth from fabricated news. What problems does the proliferation of misinformation cause, and what measures can be taken to counter it? Write at least 250 words.', NULL, 'hard', true, 'published'),
('task_2', 'Animal Testing for Medical Research vs Cosmetic Products', 'Some people argue that using laboratory animals for scientific experiments is cruel and should be entirely outlawed. Others contend that animal testing remains vital for developing life-saving pharmaceutical drugs. Discuss both views and give your opinion. Write at least 250 words.', NULL, 'medium', true, 'published'),
('task_2', 'International Aid: Financial Grants vs Technical Expertise', 'Developed nations often send billions in direct monetary aid to developing economies, yet poverty persists. Many economists claim that transferring technology, education, and technical expertise is much more effective than sending cash. To what extent do you agree or disagree? Write at least 250 words.', NULL, 'hard', true, 'published'),
('task_2', 'CCTV Surveillance and Public Privacy Rights', 'Facial recognition cameras and pervasive CCTV surveillance now monitor public thoroughfares in major cities. Do the crime-prevention benefits of continuous public surveillance justify the reduction in citizens'' personal privacy? Write at least 250 words.', NULL, 'medium', true, 'published'),
('task_2', 'Fast Fashion and Consumerism', 'The modern phenomenon of "fast fashion"—cheap, mass-produced clothing discarded after minimal wear—is causing severe environmental pollution. What are the causes of this consumer trend, and what steps can individuals and governments take to curb it? Write at least 250 words.', NULL, 'medium', true, 'published')
ON CONFLICT DO NOTHING;

