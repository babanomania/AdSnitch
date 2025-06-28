const path = require('path');
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

async function generateSummaryLLM(text) {
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
