export function getWorkerUrl(workerName: string) {
  const subdomains = location.hostname.split('.');
  const baseDomain = subdomains.slice(-2).join('.');
  if (subdomains.includes('dev')) {
    return `https://${workerName}.workers.${baseDomain}`;
  } else {
    return `https://${workerName}.workers.rocks`;
  }
}
