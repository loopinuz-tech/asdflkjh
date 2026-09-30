// Test script - run with: GEMINI_API_KEY=your_key node scratch/test-gemini-translate.js
async function test() {
  const models = ['gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-2.0-flash'];
  const apiKey = process.env.GEMINI_API_KEY || '';
  if (!apiKey) { console.log('Set GEMINI_API_KEY env var'); process.exit(1); }

  for (const model of models) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-goog-api-key': apiKey },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Translate the word "food" to Uzbek. Reply with only the Uzbek word(s), nothing else.' }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 50 }
        })
      });
      const data = await res.json();
      const result = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      const err = data?.error?.message;
      console.log(`${model}: ${res.status}`, result ? result.trim() : err);
    } catch(e) {
      console.log(`${model}: ERROR`, e.message);
    }
  }
}
test();
