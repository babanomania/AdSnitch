const fs = require('fs').promises;

async function getStats() {
  const data = JSON.parse(
    await fs.readFile(require('path').join(__dirname, '..', 'data', 'mock_logs.json'), 'utf8')
  );
  // Sort by count descending
  const sorted = data.sort((a, b) => b.count - a.count);
  const topDomains = sorted.map((d) => d.domain);
  return { topDomains };
}

module.exports = { getStats };
