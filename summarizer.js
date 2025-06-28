const path = require('path');
let llama;
let model;

async function loadModel() {
  if (!model) {
    const { getLlama } = require('node-llama-cpp');
    llama = await getLlama();
    model = await llama.loadModel({
      modelPath: process.env.MODEL_PATH || path.join(__dirname, 'tinyllama-model.gguf')
    });
  }
  return model;
}

async function generateSummaryLLM(text) {
  try {
    const m = await loadModel();
    const context = await m.createContext();
    const { LlamaChatSession } = require('node-llama-cpp');
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
