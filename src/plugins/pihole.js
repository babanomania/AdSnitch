const fetch = require('node-fetch');
require('dotenv').config();

/**
 * Fetches the top 10 queried domains from Pi-hole instance.
 * @returns {Promise<{topDomains: Array<{domain: string, count: number}>}>}
 */
async function getStats() {
  const baseUrl = process.env.PIHOLE_URL || 'http://localhost/admin/api.php';
  // Pi-hole API endpoint for top domains
  const url = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}topItems=10`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch from Pi-hole: ${res.status}`);
  const data = await res.json();
  // Pi-hole returns top_queries as { domain: count }
  const topDomains = data.top_queries
    ? Object.entries(data.top_queries)
        .map(([domain, count]) => ({ domain, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    : [];
  return { topDomains };
}

module.exports = { getStats };
