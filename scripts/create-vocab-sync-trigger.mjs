import pg from 'pg'

const DATABASE_URL = 'postgresql://foxford_user:O0enoQfkTGi8uQatDUaKWeCD89SPW3kK@dpg-dat3jrnlk1mc73e4t340-a.oregon-postgres.render.com/foxford'

const client = new pg.Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function run() {
  await client.connect()
  console.log('Connected to PostgreSQL...')

  await client.query(`
    CREATE OR REPLACE FUNCTION sync_vocabulary_words_columns()
    RETURNS TRIGGER AS $$
    BEGIN
      -- Sync Uzbek translations
      IF NEW.translation IS NOT NULL AND NEW.translation_uz IS NULL THEN
        NEW.translation_uz := NEW.translation;
      ELSIF NEW.translation_uz IS NOT NULL AND NEW.translation IS NULL THEN
        NEW.translation := NEW.translation_uz;
      END IF;

      -- Sync 2nd example sentences
      IF NEW.context_sentence IS NOT NULL AND NEW.example_sentence_2 IS NULL THEN
        NEW.example_sentence_2 := NEW.context_sentence;
      ELSIF NEW.example_sentence_2 IS NOT NULL AND NEW.context_sentence IS NULL THEN
        NEW.context_sentence := NEW.example_sentence_2;
      END IF;

      -- If antonyms is empty array or null, but passed in metadata or antonyms
      IF NEW.antonyms IS NULL THEN
        NEW.antonyms := ARRAY[]::text[];
      END IF;

      IF NEW.synonyms IS NULL THEN
        NEW.synonyms := ARRAY[]::text[];
      END IF;

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trg_sync_vocabulary_words_columns ON vocabulary_words;
    CREATE TRIGGER trg_sync_vocabulary_words_columns
    BEFORE INSERT OR UPDATE ON vocabulary_words
    FOR EACH ROW
    EXECUTE FUNCTION sync_vocabulary_words_columns();
  `)

  // Update existing rows
  await client.query(`
    UPDATE vocabulary_words
    SET translation = COALESCE(translation, translation_uz),
        translation_uz = COALESCE(translation_uz, translation),
        context_sentence = COALESCE(context_sentence, example_sentence_2),
        example_sentence_2 = COALESCE(example_sentence_2, context_sentence);
  `)

  console.log('✓ Successfully installed sync trigger on vocabulary_words!')
  await client.end()
}

run()
