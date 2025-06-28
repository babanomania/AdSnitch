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

  let lines = ["Today's Creepiest Domains:"];
  stats.topDomains.forEach((item, idx) => {
    const domain = item.domain;
    const count = item.count;
    const info = infos[idx];
    let owner = extractOwner(info);
    let created = '';
    let vtDetails = '';
    // If VirusTotal format, extract more details
    if (info && info.data && info.data.attributes) {
      const attr = info.data.attributes;
      if (attr.last_analysis_stats) {
        const stats = attr.last_analysis_stats;
        vtDetails += ` VT: Malicious:${stats.malicious}, Suspicious:${stats.suspicious}, Harmless:${stats.harmless}`;
      }
      if (attr.categories && Object.keys(attr.categories).length > 0) {
        vtDetails += `, Categories: ${Object.values(attr.categories).join(', ')}`;
      }
      if (typeof attr.reputation === 'number') {
        vtDetails += `, Reputation: ${attr.reputation}`;
      }
      if (attr.whois_date) {
        created = `, registered ${new Date(attr.whois_date * 1000).toISOString().slice(0, 10)}`;
      }
    } else if (info && info.domains && info.domains[0]) {
      created = `, born ${info.domains[0].create_date || 'sometime in the void'}`;
    }
    lines.push(`${idx + 1}. ${domain} - ${count} hits (owned by ${owner}${created})${vtDetails}`);
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
  sendReport(null)
  cron.schedule(`${minute} ${hour} * * *`, () => sendReport(null), {
    timezone: 'UTC'
  });
}
