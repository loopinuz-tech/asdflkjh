import { query } from '../config/db.js'

async function runMigration() {
  console.log('--- Starting Migration: Coupons Table & 22+ Question Types ---')

  // 1. Create coupons table
  await query(`
    CREATE TABLE IF NOT EXISTS coupons (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code VARCHAR(50) NOT NULL UNIQUE,
      discount_type VARCHAR(20) NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed_usd', 'fixed_uzs')),
      discount_value NUMERIC(10,2) NOT NULL,
      min_order_amount NUMERIC(10,2) DEFAULT 0,
      max_uses INTEGER DEFAULT NULL,
      used_count INTEGER DEFAULT 0,
      expires_at TIMESTAMPTZ DEFAULT NULL,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)
  console.log('✓ Coupons table ready')

  // 2. Insert sample coupons
  await query(`
    INSERT INTO coupons (code, discount_type, discount_value, max_uses, is_active)
    VALUES
      ('FOXFORD20', 'percentage', 20, 500, true),
      ('IELTS2026', 'percentage', 25, 100, true),
      ('WELCOME5', 'fixed_usd', 5, 200, true)
    ON CONFLICT (code) DO UPDATE SET is_active = true;
  `)
  console.log('✓ Sample coupons initialized (FOXFORD20, IELTS2026, WELCOME5)')

  // 3. Ensure all 22 question types exist in question_types
  const types: [string, string, string, string][] = [
    ['multiple_choice', 'Multiple Choice', 'reading', 'Choose the correct answer from four options (A, B, C, or D)'],
    ['multiple_response', 'Multiple Response', 'reading', 'Choose two or more correct answers from a list of options'],
    ['multiple_select', 'Multiple Select', 'reading', 'Choose two or more correct answers from a list of options'],
    ['true_false_not_given', 'True / False / Not Given', 'reading', 'Identify whether facts match the passage (True, False, or Not Given)'],
    ['yes_no_not_given', 'Yes / No / Not Given', 'reading', 'Identify whether the writer\'s claims agree with the passage'],
    ['matching_headings', 'Matching Headings', 'reading', 'Match paragraph headings to the correct sections of the text'],
    ['matching_information', 'Matching Information', 'reading', 'Locate specific information within the paragraphs'],
    ['matching_features', 'Matching Features', 'reading', 'Match people, dates or theories to characteristics'],
    ['matching_sentence_endings', 'Matching Sentence Endings', 'reading', 'Complete sentences by choosing the right endings from a list'],
    ['sentence_completion', 'Sentence Completion', 'reading', 'Fill in missing words in a sentence directly from the text'],
    ['summary_completion', 'Summary Completion', 'reading', 'Fill in gaps in a summarized version of the passage'],
    ['note_completion', 'Note Completion', 'listening', 'Complete gaps in a set of notes from audio listening'],
    ['table_completion', 'Table Completion', 'reading', 'Fill in missing information inside a structured table'],
    ['flow_chart_completion', 'Flow Chart Completion', 'reading', 'Complete the sequence of stages in a process flow chart'],
    ['diagram_label_completion', 'Diagram Label Completion', 'reading', 'Label parts of a diagram based on the description in the text'],
    ['short_answer', 'Short Answer', 'reading', 'Answer questions using words directly from the text'],
    ['plan_map_diagram', 'Plan / Map / Diagram', 'listening', 'Identify locations or features on a map/plan as described in audio'],
    ['form_completion', 'Form Completion', 'listening', 'Complete forms with personal details, numbers, dates or names'],
    ['writing_task_1', 'Writing Task 1', 'writing', 'Summarise, describe or explain information from a graph, table, chart or diagram'],
    ['writing_task_2', 'Writing Task 2', 'writing', 'Write an essay in response to a point of view, argument or problem'],
    ['speaking_part_1', 'Speaking Part 1', 'speaking', 'Answer general questions on familiar topics such as home, family, work and studies'],
    ['speaking_part_2', 'Speaking Part 2', 'speaking', 'Speak for up to 2 minutes on a particular topic given on a task card'],
    ['speaking_part_3', 'Speaking Part 3', 'speaking', 'Discuss more abstract ideas and issues related to the topic in Part 2']
  ]

  for (const [slug, name, skill, desc] of types) {
    await query(`
      INSERT INTO question_types (slug, name, skill, description)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (slug) DO UPDATE SET name = $2, skill = $3, description = $4;
    `, [slug, name, skill, desc])
  }
  console.log(`✓ Synchronized ${types.length} IELTS question types`)

  console.log('--- Migration completed successfully! ---')
  process.exit(0)
}

runMigration().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
