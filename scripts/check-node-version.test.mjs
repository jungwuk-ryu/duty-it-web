import assert from "node:assert/strict";
import { test } from "node:test";
import { assertSupportedNodeVersion } from "./check-node-version.mjs";

test("accepts the patched Node 24 release and later Node 24 updates", () => {
  for (const version of ["24.22.1", "24.22.2", "24.23.0"]) {
    assert.doesNotThrow(() => assertSupportedNodeVersion(version));
  }
});

test("rejects unpatched releases, other majors, and non-release versions", () => {
  for (const version of ["24.22.0", "24.21.99", "20.20.0", "22.23.4", "24.22.1-rc.1", "invalid", "24.22"]) {
    assert.throws(() => assertSupportedNodeVersion(version), /Node.js >=24\.22\.1 <25 is required/);
  }
});
