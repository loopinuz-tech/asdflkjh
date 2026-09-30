const path = require('path');
const pg = require(path.resolve('backend/node_modules/pg'));
require(path.resolve('backend/node_modules/dotenv')).config({ path: path.resolve('backend/.env') });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function seedPrompts() {
  const client = await pool.connect();
  try {
    console.log('Seeding official IELTS Speaking & Writing Task 2 prompts...');

    // 1. Speaking Prompts
    const speakingData = [
      {
        part_number: 1,
        title: 'Hometown & Living Environment',
        prompt_text: 'Let us talk about your hometown. Where is your hometown located, and what do you like most about living there?',
        follow_up_questions: [
          'Has your hometown changed much since you were a child?',
          'What kind of public transport facilities are available in your area?',
          'Do you think your hometown is a good place for young people to live?'
        ],
        difficulty: 'easy',
        is_premium: false,
        status: 'published'
      },
      {
        part_number: 1,
        title: 'Work & Academic Studies',
        prompt_text: 'Do you work or are you a student? What is your typical daily study or work routine?',
        follow_up_questions: [
          'Why did you choose that particular field or subject?',
          'What do you find most rewarding about your daily tasks?',
          'Do you plan to continue in this field in the future?'
        ],
        difficulty: 'easy',
        is_premium: false,
        status: 'published'
      },
      {
        part_number: 2,
        title: 'Describe a Memorable Journey You Took',
        prompt_text: '<h3>Candidate Task Card (Part 2)</h3><p>Describe a memorable journey you took that made a lasting impression on you.</p><p>You should say:</p><ul><li>Where you went and who accompanied you</li><li>How you traveled there</li><li>What you did during the trip</li></ul><p>and explain why this journey was especially memorable to you.</p>',
        follow_up_questions: [
          'Do you prefer traveling alone or with other people?',
          'What are some of the advantages of domestic travel over international travel?'
        ],
        difficulty: 'medium',
        is_premium: false,
        status: 'published'
      },
      {
        part_number: 2,
        title: 'Describe an Inspiring Person You Know',
        prompt_text: '<h3>Candidate Task Card (Part 2)</h3><p>Describe an inspiring person you know or have heard about who motivated you.</p><p>You should say:</p><ul><li>Who this person is and how you know them</li><li>What notable achievements they have made</li><li>How they influenced your perspective or goals</li></ul><p>and explain why you admire this individual.</p>',
        follow_up_questions: [
          'What qualities make someone a great role model for youth?',
          'Do you think modern public figures carry more influence than in the past?'
        ],
        difficulty: 'medium',
        is_premium: false,
        status: 'published'
      },
      {
        part_number: 3,
        title: 'Global Tourism and Cultural Heritage',
        prompt_text: 'Let us discuss global tourism and its broader cultural impacts. In what ways can mass tourism affect traditional local communities and historic sites?',
        follow_up_questions: [
          'Should governments impose quotas on tourist numbers at delicate heritage landmarks?',
          'How does international travel help break cultural stereotypes among diverse nations?',
          'Will virtual reality ever substitute physical international vacations in the future?'
        ],
        difficulty: 'hard',
        is_premium: false,
        status: 'published'
      },
      {
        part_number: 3,
        title: 'Artificial Intelligence & Future of Communication',
        prompt_text: 'Let us explore the influence of digital technology on interpersonal relationships. How has instant messaging changed the way family members interact?',
        follow_up_questions: [
          'Do automated translation apps reduce the incentive to learn foreign languages?',
          'What ethical responsibilities do social media companies bear regarding user mental well-being?'
        ],
        difficulty: 'hard',
        is_premium: false,
        status: 'published'
      }
    ];

    for (const sp of speakingData) {
      await client.query(`
        INSERT INTO speaking_prompts (part_number, title, prompt_text, follow_up_questions, difficulty, is_premium, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT DO NOTHING;
      `, [sp.part_number, sp.title, sp.prompt_text, sp.follow_up_questions, sp.difficulty, sp.is_premium, sp.status]);
    }
    console.log(`Seeded ${speakingData.length} speaking prompts.`);

    // 2. Writing Task 2 Prompts
    const writingTask2 = [
      {
        task_type: 'task_2',
        title: 'Digital Technology in Education',
        prompt_text: 'Some educators argue that digital tablets and online resources should completely replace traditional printed textbooks in schools. Others believe that paper books remain essential for effective learning. Discuss both views and give your own opinion.',
        difficulty: 'medium',
        is_premium: false,
        status: 'published'
      },
      {
        task_type: 'task_2',
        title: 'Urbanization and Rural Depopulation',
        prompt_text: 'In many countries, young people are leaving rural communities to pursue work and life in major metropolitan cities. What problems does this cause, and what solutions can governments implement to revitalize rural areas?',
        difficulty: 'hard',
        is_premium: false,
        status: 'published'
      }
    ];

    for (const wp of writingTask2) {
      await client.query(`
        INSERT INTO writing_prompts (task_type, title, prompt_text, difficulty, is_premium, status)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT DO NOTHING;
      `, [wp.task_type, wp.title, wp.prompt_text, wp.difficulty, wp.is_premium, wp.status]);
    }
    console.log(`Seeded ${writingTask2.length} writing Task 2 prompts.`);

    const countSp = await client.query('SELECT count(*) FROM speaking_prompts');
    const countWp = await client.query('SELECT count(*) FROM writing_prompts');
    console.log('Total speaking_prompts now:', countSp.rows[0].count);
    console.log('Total writing_prompts now:', countWp.rows[0].count);

  } catch (err) {
    console.error('Error seeding prompts:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

seedPrompts();
