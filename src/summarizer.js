const path = require('path');
const fetch = require('node-fetch');
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
        messages: [
          { role: 'system', content: 'Summarize the following lines with humor.' },
          { role: 'user', content: text }
        ]
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
    const prompt = `Summarize the following lines with humor:\n${text}\nHumorous summary:`;
    const result = await session.prompt(prompt);
    return result.trim();
  } catch (err) {
    console.error('TinyLlama generation failed:', err);
    return text;
  }
}

module.exports = { generateSummaryLLM };
