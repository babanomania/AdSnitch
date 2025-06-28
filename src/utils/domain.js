const fetch = require('node-fetch');
require('dotenv').config();

async function getDomainInfo(domain) {
  // Always use VirusTotal API
  const vtKey = process.env.VIRUSTOTAL_API_KEY;
  if (!vtKey) throw new Error('VIRUSTOTAL_API_KEY is not set in .env');
  const url = `https://www.virustotal.com/api/v3/domains/${domain}`;
  try {
    const res = await fetch(url, {
      headers: {
        'x-apikey': vtKey
      }
    });
    if (!res.ok) throw new Error(`VirusTotal API error: ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error('VirusTotal fetch failed:', e);
    return null;
  }
}

function extractOwner(info) {
  // Try VirusTotal format first
  if (info && info.data && info.data.attributes) {
    const attr = info.data.attributes;
    // Try to get registrar, categories, reputation, etc.
    if (attr.registrar) return attr.registrar;
    if (attr.categories && Object.keys(attr.categories).length > 0) {
      return Object.values(attr.categories).join(', ');
    }
    if (typeof attr.reputation === 'number') {
      return `Reputation: ${attr.reputation}`;
    }
    if (attr.whois) {
      // Try to extract Org or Name from raw whois
      const orgMatch = attr.whois.match(/OrgName:\s*(.*)/i);
      if (orgMatch) return orgMatch[1];
      const nameMatch = attr.whois.match(/Registrant Name:\s*(.*)/i);
      if (nameMatch) return nameMatch[1];
    }
  }
  // Try domainsdb.info format first
  if (info && info.domains && Array.isArray(info.domains) && info.domains.length > 0) {
    const domainInfo = info.domains[0];
    if (domainInfo.owner) return domainInfo.owner;
    if (domainInfo.registrant) return domainInfo.registrant;
    if (domainInfo.registrar) return domainInfo.registrar;
    if (domainInfo.country) return domainInfo.country;
  }
  // Fallback to RDAP logic
  if (info && info.entities && Array.isArray(info.entities)) {
    const registrant = info.entities.find(
      (e) => Array.isArray(e.roles) && e.roles.includes('registrant')
    );
    if (
      registrant &&
      Array.isArray(registrant.vcardArray) &&
      Array.isArray(registrant.vcardArray[1])
    ) {
      const fn = registrant.vcardArray[1].find((v) => v[0] === 'fn');
      if (fn && fn[3]) return fn[3];
      const org = registrant.vcardArray[1].find((v) => v[0] === 'org');
      if (org && org[3]) return org[3];
      const email = registrant.vcardArray[1].find((v) => v[0] === 'email');
      if (email && email[3]) return email[3];
    }
    if (registrant && registrant.name) return registrant.name;
  }
  if (info && info.name) return info.name;
  if (info && info.org) return info.org;
  return 'Unknown';
}

async function getDomainOwner(domain, api = null) {
  const info = await getDomainInfo(domain, api);
  return extractOwner(info);
}

module.exports = { getDomainOwner, getDomainInfo, extractOwner };
