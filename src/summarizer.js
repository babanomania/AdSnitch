const fetch = require('node-fetch');

// Dynamically load the selected personality prompt
const personality = process.env.PERSONALITY || 'sysadmin';
const { SYSTEM_PROMPT, EXAMPLES } = require(`./summarizer.prompts/${personality}`);

const ollamaModel = process.env.OLLAMA_MODEL || 'deepseek-coder';

async function generateSummaryOllama(text) {
  // For Deepseek/Ollama: use full personality prompt and examples
  const prompt = [
    `[SYSTEM] ${SYSTEM_PROMPT}`,
    ...EXAMPLES.flatMap((ex) => [
      `[USER] ${ex.user}`,
      `[ASSISTANT] ${ex.assistant}`
    ]),
    `[USER] ${text}`
  ].join('\n');
  try {
    const res = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: ollamaModel,
        prompt: prompt,
        stream: false
      })
    });
    const data = await res.json();
    if (data && data.response) {
      // Extract and print <think>...</think> content to console, but remove from report
      const thinkMatches = data.response.match(/<think>[\s\S]*?<\/think>/gi);
      if (thinkMatches) {
        thinkMatches.forEach(block => {
          const content = block.replace(/<\/?think>/gi, '').trim();
          if (content) console.log('[Deepseek <think> block]:', content);
        });
      }
      return data.response
        .replace(/<think>[\s\S]*?<\/think>/gi, '') // Remove <think>...</think> blocks
        .split('\n')
        .filter(line => !/^[ \t]*(Thought:|Action:|Observation:|Reflect:|Plan:|Next Step:|\[.*?\])/i.test(line))
        .join('\n')
        .replace(/<\/?think>/gi, '') // Remove any stray <think> or </think> tags
        .trim();
    }
  } catch (err) {
    console.error('Ollama summarization failed:', err);
  }
  return null;
}

async function generateSummaryOpenAI(text) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: (() => {
          const msgs = [{ role: 'system', content: SYSTEM_PROMPT }];
          EXAMPLES.forEach((ex) => {
            msgs.push({ role: 'user', content: ex.user });
            msgs.push({ role: 'assistant', content: ex.assistant });
          });
          msgs.push({ role: 'user', content: text });
          return msgs;
        })()
      })
    });
    const data = await res.json();
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content.trim();
    }
  } catch (err) {
    console.error('OpenAI summarization failed:', err);
  }
  return null;
}

async function generateSummaryLLM(text) {
  // Try Ollama first
  const ollama = await generateSummaryOllama(text);
  if (ollama) return ollama;
  // Fallback to OpenAI
  const openai = await generateSummaryOpenAI(text);
  if (openai) return openai;
  return text;
}

module.exports = { generateSummaryLLM };
