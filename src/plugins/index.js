const adguard = require('./adguard');
const mock = require('./mock');

/**
 * Returns top domains from AdGuard Home if ADGUARD_URL is set, otherwise uses mock data.
 * @returns {Promise<{topDomains: Array<{domain: string, count: number}>}>}
 */
async function getStats() {
  if (process.env.ADGUARD_URL) {
    try {
      return await adguard.getStats();
    } catch (err) {
      console.error('AdGuard fetch failed, falling back to mock:', err);
      return await mock.getStats();
    }
  } else {
    return await mock.getStats();
  }
}

module.exports = { getStats };
