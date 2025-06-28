const fetch = require('node-fetch');

async function getDomainInfo(domain, api = null) {
  const url = api ? `${api}${domain}` : `https://rdap.org/domain/${domain}`;
  try {
    const res = await fetch(url);
    return await res.json();
  } catch {
    return null;
  }
}

function extractOwner(info) {
  if (!info) return 'Unknown';
  if (info.entities && Array.isArray(info.entities)) {
    const registrant = info.entities.find(
      (e) => Array.isArray(e.roles) && e.roles.includes('registrant')
    );
    if (
      registrant &&
      Array.isArray(registrant.vcardArray) &&
      Array.isArray(registrant.vcardArray[1])
    ) {
      const fn = registrant.vcardArray[1].find((v) => v[0] === 'fn');
      if (fn) return fn[3];
    }
  }
  if (info.name) return info.name;
  return 'Unknown';
}

async function getDomainOwner(domain, api = null) {
  const info = await getDomainInfo(domain, api);
  return extractOwner(info);
}

module.exports = { getDomainOwner, getDomainInfo, extractOwner };
