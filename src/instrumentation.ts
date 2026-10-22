export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../scripts/check-node-version.mjs");
  }
}
