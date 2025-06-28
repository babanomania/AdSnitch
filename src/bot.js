require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const cron = require('node-cron');
const { generateSummaryLLM } = require('./summarizer');

// simple plugin that reads mock logs
const { getStats } = require('./plugins/mock');
const { getDomainOwner, getDomainInfo } = require('./utils/domain');

const token = process.env.DISCORD_TOKEN;
const channelId = process.env.DISCORD_CHANNEL;
const reportTime = process.env.REPORT_TIME || '09:00';
const domainInfoApi = process.env.DOMAIN_INFO_API || null;

// Fetch and aggregate DNS log stats via plugin
async function getDailyStats() {
  return await getStats();
}

// Build a text prompt with domain data
async function buildPrompt(stats) {
  const infos = await Promise.all(
    stats.topDomains.map((d) => getDomainInfo(d, domainInfoApi))
  );

  let lines = ['Today\'s Creepiest Domains:'];
  stats.topDomains.forEach((domain, idx) => {
    const owner = getDomainOwner(domain);
    const info = infos[idx];
    let created = '';
    if (info) {
      if (info.events) {
        const reg = (info.events || []).find((e) => e.eventAction === 'registration');
        if (reg) created = `, registered ${reg.eventDate.slice(0, 10)}`;
      } else if (info.domains && info.domains[0]) {
        created = `, born ${info.domains[0].create_date || 'sometime in the void'}`;
      }
    }
    lines.push(`${idx + 1}. ${domain} (owned by ${owner}${created})`);
  });
  return lines.join('\n');
}

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
    const embed = new EmbedBuilder()
      .setTitle('AdSnitch Daily Report')
      .setDescription(summary)
      .setColor(0xff9900);

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
