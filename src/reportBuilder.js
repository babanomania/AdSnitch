const { getStats } = require('./plugins');
const { extractOwner, getDomainInfo } = require('./utils/domain');

const domainInfoApi = process.env.DOMAIN_INFO_API || null;

async function getDailyStats() {
  const stats = await getStats();
  const N = parseInt(process.env.SUMMARY_TOP_N, 10) || 5;
  if (stats && stats.topDomains && Array.isArray(stats.topDomains)) {
    stats.topDomains = stats.topDomains.slice(0, N);
  }
  return stats;
}

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

module.exports = { getDailyStats, buildPrompt };
