const fetch = require('node-fetch');

// Load environment variables
require('dotenv').config();

/**
 * Fetches the top 10 queried domains from AdGuard Home instance.
 * @returns {Promise<{topDomains: Array<{domain: string, count: number}>}>}
 */
async function getStats() {
  const baseUrl = process.env.ADGUARD_URL || 'http://pizero2w:8083';
  const username = process.env.ADGUARD_USER || null;
  const password = process.env.ADGUARD_PASS || null;
  // AdGuard Home API endpoint for stats
  const url = `${baseUrl.replace(/\/$/, '')}/control/stats`;
  const headers = {};
  if (username && password) {
    headers['Authorization'] = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
  }
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Failed to fetch from AdGuard Home: ${res.status}`);
  const data = await res.json();
  // data.top_blocked_domains is an array of single-key objects: [{ 'domain': count }, ...]
  const topDomains = (data.top_blocked_domains || [])
    .map((obj) => {
      const domain = Object.keys(obj)[0];
      const count = obj[domain];
      return { domain, count };
    });
  return { topDomains };
}

module.exports = { getStats };
