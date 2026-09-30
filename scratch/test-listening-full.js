const http = require('http');

http.get('http://localhost:5000/api/tests/bb9f355f-a680-4fe5-9a8d-fe6257b4ce6f', res => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    const json = JSON.parse(data);
    const test = json.test;
    console.log('=== TEST INFO ===');
    console.log('ID:', test.id);
    console.log('Title:', test.title);
    console.log('Total Questions in Test:', test.questions.length);
    console.log('Total Sections:', test.sections.length);

    let allQuestionsCount = 0;
    test.sections.forEach((sec, sIdx) => {
      console.log(`\n========================================`);
      console.log(`SECTION ${sIdx + 1}: ${sec.title}`);
      console.log(`Audio: ${sec.audio ? sec.audio.file_path : 'NONE'}`);
      console.log(`Media: ${sec.media ? sec.media.file_path : 'NONE'}`);
      console.log(`Groups: ${sec.groups.length}`);
      
      sec.groups.forEach((g, gIdx) => {
        console.log(`\n  [Group ${gIdx + 1}] ${g.title}`);
        console.log(`  Instruction: ${g.instruction}`);
        console.log(`  Group Media: ${g.media ? g.media.file_path : 'NONE'}`);
        console.log(`  Questions (${g.questions.length}):`);
        
        g.questions.forEach(q => {
          allQuestionsCount++;
          console.log(`    Q${q.question_number}: [${q.question_type}] "${q.question_text}"`);
          console.log(`      Correct Answer: "${q.correct_answer}" | Accepted: ${JSON.stringify(q.accepted_answers)}`);
          if (q.image_url) console.log(`      Image: ${q.image_url}`);
          if (q.options && q.options.length > 0) {
            console.log(`      Options (${q.options.length}): ${q.options.map(o => `${o.option_key}: ${o.option_text}`).join(' | ')}`);
          }
        });
      });
    });

    console.log(`\n========================================`);
    console.log(`TOTAL QUESTIONS VERIFIED ACROSS ALL SECTIONS: ${allQuestionsCount} / 40`);
  });
});
