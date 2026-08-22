import assert from "node:assert/strict";
import { runExperiment } from "../src/run.mjs";

const experiment = runExperiment();

assert.equal(experiment.withoutKey.duplicated, true);
assert.equal(experiment.withoutKey.attempts, 2);
assert.equal(experiment.withoutKey.tickets.length, 2);

assert.equal(experiment.withKey.attempts, 2);
assert.equal(experiment.withKey.first.status, "ok");
assert.equal(experiment.withKey.replay.result.id, experiment.withKey.first.result.id);
assert.equal(experiment.withKey.deduplicated, true);
assert.equal(experiment.withKey.tickets.length, 1);

assert.equal(experiment.unknownState.first.status, "unknown");
assert.equal(experiment.unknownState.requiresHuman, true);
assert.equal(experiment.unknownState.attempts, 1);
assert.equal(experiment.unknownState.recovery.result.requiresHuman, true);

console.log("retry side effects lab: 3 paths passed");
