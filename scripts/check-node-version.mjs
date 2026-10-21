// Vercel selects a major version and manages patch rollout. Check the actual
// binary at build time and server startup so an older patch cannot serve traffic.
export function assertSupportedNodeVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  const [major, minor, patch] = match ? match.slice(1).map(Number) : [];
  if (major !== 22 || minor < 23 || (minor === 23 && patch < 4)) {
    throw new Error(`Node.js >=22.23.4 <23 is required for the October 2026 security fixes; received ${version}.`);
  }
}

assertSupportedNodeVersion(process.versions.node);
console.info(`[node-security] Node.js ${process.version} meets the >=22.23.4 <23 security baseline.`);
