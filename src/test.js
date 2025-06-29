require('dotenv').config();
const { generateSummaryLLM } = require('./summarizer');
const { getDailyStats, buildPrompt } = require('./reportBuilder');

(async () => {
  const stats = await getDailyStats();
  const prompt = await buildPrompt(stats);
  const summary = await generateSummaryLLM(prompt);
  console.log('\n--- AdSnitch Test Report ---\n');
  console.log(summary);
  console.log('\n---------------------------\n');
})();
