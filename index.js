require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const cron = require('node-cron');
const fetch = require('node-fetch');

const token = process.env.DISCORD_TOKEN;
const channelId = process.env.DISCORD_CHANNEL;
const reportTime = process.env.REPORT_TIME || '09:00';
const domainInfoApi = process.env.DOMAIN_INFO_API || 'https://api.domainsdb.info/v1/domains/search?domain=';

// Placeholder: fetch and aggregate DNS log stats
async function getDailyStats() {
  return {
    topDomains: ['example.com'],
    suspiciousPatterns: ['weird.example'],
    weirdDomains: ['strange.domain']
  };
}

// Retrieve extra information about a domain
async function getDomainInfo(domain) {
  try {
    const res = await fetch(`${domainInfoApi}${domain}`);
    return await res.json();
  } catch (err) {
    console.error('Domain info lookup failed:', err);
    return null;
  }
}

// Placeholder: use TinyLlama or other model to generate satirical text
async function generateSummary(stats) {
  // Fetch info for each top domain
  const infos = await Promise.all(
    stats.topDomains.map((d) => getDomainInfo(d))
  );

  // In a real implementation, pass stats and infos to TinyLlama
  let lines = [`Top domain: ${stats.topDomains[0]}`];
  infos.forEach((info, idx) => {
    if (info && info.domains && info.domains[0]) {
      const d = info.domains[0];
      lines.push(
        `${d.domain} (created ${d.create_date || 'unknown'})`
      );
    }
  });

  return lines.join('\n');
}

async function sendReport(client) {
  const stats = await getDailyStats();
  const summary = await generateSummary(stats);

  const embed = new EmbedBuilder()
    .setTitle('AdSnitch Daily Report')
    .setDescription(summary)
    .setColor(0xff9900);

  const channel = await client.channels.fetch(channelId);
  if (channel) await channel.send({ embeds: [embed] });
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.once('ready', () => {
  console.log('AdSnitch bot ready');
  const [hour, minute] = reportTime.split(':');
  cron.schedule(`${minute} ${hour} * * *`, () => sendReport(client), {
    timezone: 'UTC'
  });
});

client.login(token);
