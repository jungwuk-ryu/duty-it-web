import assert from "node:assert/strict";
import { test } from "node:test";
import { assertSupportedNodeVersion } from "./check-node-version.mjs";

test("accepts the patched Node 22 release and later Node 22 updates", () => {
  for (const version of ["22.23.4", "22.23.5", "22.24.0"]) {
    assert.doesNotThrow(() => assertSupportedNodeVersion(version));
  }
});

test("rejects unpatched releases, other majors, and non-release versions", () => {
  for (const version of ["22.23.3", "22.22.99", "20.20.0", "24.22.1", "22.23.4-rc.1", "invalid", "22.23"]) {
    assert.throws(() => assertSupportedNodeVersion(version), /Node.js >=22\.23\.4 <23 is required/);
  }
});
