// Vercel selects a major version and manages patch rollout. Check the actual
// binary at build time and server startup so an older patch cannot serve traffic.
export function assertSupportedNodeVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  const [major, minor, patch] = match ? match.slice(1).map(Number) : [];
  if (major !== 24 || minor < 22 || (minor === 22 && patch < 1)) {
    throw new Error(`Node.js >=24.22.1 <25 is required for the October 2026 security fixes; received ${version}.`);
  }
}

assertSupportedNodeVersion(process.versions.node);
console.info(`[node-security] Node.js ${process.version} meets the >=24.22.1 <25 security baseline.`);
