const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const dbPath = path.join(__dirname, '..', '..', 'data', 'domains.db');
const domainDB = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

function getDomainOwner(domain) {
  const parts = domain.split('.');
  const root = parts.slice(-2).join('.');
  return domainDB[domain] || domainDB[root] || 'Unknown';
}

async function getDomainInfo(domain, api = null) {
  const url = api ? `${api}${domain}` : `https://rdap.org/domain/${domain}`;
  try {
    const res = await fetch(url);
    return await res.json();
  } catch {
    return null;
  }
}

module.exports = { getDomainOwner, getDomainInfo };
