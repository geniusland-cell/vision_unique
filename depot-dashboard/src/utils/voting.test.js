import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateVotingEndDate,
  normalizeVotingDurationDays,
} from "./voting.js";

test("normalise une durée de vote invalide vers 3 jours", () => {
  assert.equal(normalizeVotingDurationDays(0), 3);
  assert.equal(normalizeVotingDurationDays(-4), 3);
  assert.equal(normalizeVotingDurationDays("7"), 7);
});

test("calcule une date de fin à partir de la durée sélectionnée", () => {
  const startedAt = "2026-07-04T10:00:00.000Z";
  const endsAt = calculateVotingEndDate(startedAt, 5);

  assert.equal(endsAt, "2026-07-09T10:00:00.000Z");
});
