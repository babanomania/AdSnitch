const fetch = require('node-fetch');
require('dotenv').config();

/**
 * Fetches the top 10 queried domains from Pi-hole FTL API.
 * @returns {Promise<{topDomains: Array<{domain: string, count: number}>}>}
 */
async function getStats() {
  const baseUrl = process.env.PIHOLE_URL || 'http://localhost';
  // Use the modern FTL API endpoint
  const url = `${baseUrl.replace(/\/$/, '')}/stats/top_domains?count=10`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch from Pi-hole: ${res.status}`);
  const data = await res.json();
  // Pi-hole FTL returns top_domains as an array of [domain, count]
  const topDomains = Array.isArray(data.top_domains)
    ? data.top_domains.map(([domain, count]) => ({ domain, count }))
    : [];
  return { topDomains };
}

module.exports = { getStats };
