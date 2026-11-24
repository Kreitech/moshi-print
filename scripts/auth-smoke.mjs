import assert from "node:assert/strict";
import { test } from "node:test";

const base = process.env.MOSHI_TEST_URL || "http://localhost:3091";

async function redirectFrom(path) {
  const response = await fetch(new URL(path, base), { redirect: "manual" });
  assert.equal(response.status, 307);
  return new URL(response.headers.get("location"), base);
}

test("implicit invite reaches the browser callback", async () => {
  const location = await redirectFrom("/auth/confirm?type=invite");
  assert.equal(location.pathname, "/auth/callback");
  assert.equal(location.searchParams.get("type"), "invite");
  assert.equal(location.hash, "");
});

test("expired email links show an error and retain the flow type", async () => {
  const location = await redirectFrom("/auth/confirm?type=recovery&error=access_denied");
  assert.equal(location.pathname, "/auth/error");
  assert.equal(location.searchParams.get("type"), "recovery");
});

test("the callback discards untrusted redirect destinations", async () => {
  const location = await redirectFrom("/auth/confirm?next=%2F%2Fexample.com");
  assert.equal(location.origin, new URL(base).origin);
  assert.equal(location.pathname, "/auth/callback");
  assert.equal(location.searchParams.has("next"), false);
});

test("a regular signed-out request still reaches login", async () => {
  const location = await redirectFrom("/settings/team");
  assert.equal(location.pathname, "/login");
});
