require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const cron = require('node-cron');
const { generateSummaryLLM } = require('./summarizer');
const { getDailyStats, buildPrompt } = require('./reportBuilder');

const token = process.env.DISCORD_TOKEN;
const channelId = process.env.DISCORD_CHANNEL;
const reportTime = process.env.REPORT_TIME || '09:00';

// Generate a humorous summary using TinyLlama
async function generateSummary(stats) {
  const prompt = await buildPrompt(stats);
  const text = await generateSummaryLLM(prompt);
  return text;
}

async function sendReport(client) {
  const stats = await getDailyStats();
  const summary = await generateSummary(stats);
  if (client) {
    console.log('Sending AdSnitch Daily Report to Discord channel:', channelId);
    const embed = new EmbedBuilder()
      .setTitle('AdSnitch Daily Report')
      .setDescription(summary)
      .setColor(0xff9900);
    console.log('AdSnitch Daily Report:\n', summary);

    const channel = await client.channels.fetch(channelId);
    if (channel) await channel.send({ embeds: [embed] });
  } else {
    console.log('AdSnitch Daily Report:\n', summary);
  }
}

const [hour, minute] = reportTime.split(':');
if (token && channelId) {
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });
  client.once('ready', () => {
    console.log('AdSnitch bot ready');
    sendReport(client)
    cron.schedule(`${minute} ${hour} * * *`, () => sendReport(client), {
      timezone: 'UTC'
    });
  });
  client.login(token);
} else {
  console.log('Discord credentials missing; output will be logged to console.');
  cron.schedule(`${minute} ${hour} * * *`, () => sendReport(null), {
    timezone: 'UTC'
  });
}
