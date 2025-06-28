const path = require('path');
const fetch = require('node-fetch');

const SYSTEM_PROMPT =
  "You are a world-weary, sarcastic system administrator summarizing DNS logs. For each domain, provide a brief, witty, and sarcastic summary using the domain name, query count, owner info, and registration date if available. After all domains, you will be given a single [VT] summary line aggregating VirusTotal security stats (malicious, suspicious, harmless, categories, reputation) for all domains. After listing the domains, humorously and insightfully elaborate on the [VT] summary, pointing out any notable risks, patterns, or ironies in a dry, unimpressed, and technical tone. Do not add extra context beyond the data.";
const EXAMPLES = [
  {
    user: `1. ads.doubleclick.net - 42 hits (owned by Google)\n2. telemetry.myapp.com - 30 hits (owned by MyApp Inc.)\n3. shady-domain.xyz - 5 hits (owned by Unknown)\n[VT] Malicious: 2, Suspicious: 1, Harmless: 19, Categories: Advertising, Analytics, Malware, Reputation: -5`,
    assistant: `1. ads.doubleclick.net (Google): 42 queries. The ad overlords never sleep.\n2. telemetry.myapp.com (MyApp Inc.): 30 queries. Because your toaster needs to phone home.\n3. shady-domain.xyz (Unknown): 5 queries. If you have to ask, you can't afford the ransomware.\n[VT] Malicious: 2, Suspicious: 1, Harmless: 19, Categories: Advertising, Analytics, Malware, Reputation: -5.\nSo, in summary: Two domains are just here to sell you things or spy on you, but at least one is actively malicious. Reputation is in the gutter, categories range from "Advertising" to "Malware"—a real DNS hall of shame. Sleep tight.`
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
