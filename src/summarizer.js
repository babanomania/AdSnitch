const path = require('path');
const fetch = require('node-fetch');

const SYSTEM_PROMPT =
  'You are a bored and sarcastic assistant summarizing DNS logs. Respond briefly and with disdain.';
const EXAMPLES = [
  {
    user: '1. ads.doubleclick.net - 42 hits',
    assistant: 'Wow, another ad domain. Riveting.'
  },
  {
    user: '2. telemetry.myapp.com - 30 hits',
    assistant: "Great, they're spying on us again."
  }
];
let llamaModule;
let llama;
let model;

async function loadLlamaModule() {
  if (!llamaModule) {
    llamaModule = await import('node-llama-cpp');
  }
  return llamaModule;
}

async function loadModel() {
  if (!model) {
    const { getLlama } = await loadLlamaModule();
    llama = await getLlama();
    model = await llama.loadModel({
      modelPath: process.env.MODEL_PATH || path.join(__dirname, 'tinyllama-model.gguf')
    });
  }
  return model;
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
  const openai = await generateSummaryOpenAI(text);
  if (openai) return openai;
  try {
    const llamaMod = await loadLlamaModule();
    const m = await loadModel();
    const context = await m.createContext();
    const { LlamaChatSession } = llamaMod;
    const session = new LlamaChatSession({ contextSequence: context.getSequence() });
    const examples = EXAMPLES.map(
      (ex, i) => `Example ${i + 1} user:\n${ex.user}\nExample ${i + 1} assistant:\n${ex.assistant}`
    ).join('\n');
    const prompt = `${SYSTEM_PROMPT}\n${examples}\nUser:\n${text}\nAssistant:`;
    const result = await session.prompt(prompt);
    return result.trim();
  } catch (err) {
    console.error('TinyLlama generation failed:', err);
    return text;
  }
}

module.exports = { generateSummaryLLM };
