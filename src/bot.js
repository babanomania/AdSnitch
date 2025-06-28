require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const cron = require('node-cron');
const { generateSummaryLLM } = require('./summarizer');

// simple plugin that reads mock logs
const { getStats } = require('./plugins');
const { extractOwner, getDomainInfo } = require('./utils/domain');

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
    stats.topDomains.map((d) => getDomainInfo(d.domain, domainInfoApi))
  );

  // Aggregate VT stats
  let vtAgg = { malicious: 0, suspicious: 0, harmless: 0 };
  let vtCategories = new Set();
  let vtReputation = 0;
  let vtRepCount = 0;

  stats.topDomains.forEach((item, idx) => {
    const info = infos[idx];
    if (info && info.data && info.data.attributes) {
      const attr = info.data.attributes;
      const stats = attr.last_analysis_stats || {};
      vtAgg.malicious += stats.malicious ?? 0;
      vtAgg.suspicious += stats.suspicious ?? 0;
      vtAgg.harmless += stats.harmless ?? 0;
      if (attr.categories) {
        Object.values(attr.categories).forEach((cat) => vtCategories.add(cat));
      }
      if (typeof attr.reputation === 'number') {
        vtReputation += attr.reputation;
        vtRepCount++;
      }
    }
  });
  const vtSummary = `[VT] Malicious: ${vtAgg.malicious}, Suspicious: ${vtAgg.suspicious}, Harmless: ${vtAgg.harmless}, Categories: ${vtCategories.size ? Array.from(vtCategories).join(', ') : 'N/A'}, Reputation: ${vtRepCount ? Math.round(vtReputation / vtRepCount) : 'N/A'}`;

  let lines = ["Today's Creepiest Domains:"];
  stats.topDomains.forEach((item, idx) => {
    const domain = item.domain;
    const count = item.count;
    const info = infos[idx];
    let owner = extractOwner(info);
    let created = '';
    if (info && info.data && info.data.attributes && info.data.attributes.whois_date) {
      created = `, registered ${new Date(info.data.attributes.whois_date * 1000).toISOString().slice(0, 10)}`;
    } else if (info && info.domains && info.domains[0]) {
      created = `, born ${info.domains[0].create_date || 'sometime in the void'}`;
    }
    lines.push(`${idx + 1}. ${domain} - ${count} hits (owned by ${owner}${created})`);
  });
  lines.push(vtSummary);
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
