import assert from "node:assert/strict";
import { runExperiment } from "../src/run.mjs";

const experiment = runExperiment();

assert.equal(experiment.withoutState.duplicateEffects, 3);
assert.deepEqual(experiment.withoutState.duplicatedSteps, ["scan", "patch", "test"]);
assert.deepEqual(experiment.withoutState.firstRunEffects, ["scan", "patch", "test"]);
assert.deepEqual(experiment.withoutState.recoveryEffects, ["scan", "patch", "test", "publish"]);

assert.deepEqual(experiment.checkpoint.completedSteps, ["scan", "patch"]);
assert.equal(experiment.checkpoint.nextStep, "test");
assert.equal(experiment.resumed.status, "resumed");
assert.deepEqual(experiment.resumed.executedSteps, ["test", "publish"]);
assert.deepEqual(
  experiment.resumed.events.filter((event) => event.type === "replayed").map((event) => event.step),
  ["scan", "patch"],
);

assert.equal(experiment.drifted.status, "rejected");
assert.equal(experiment.drifted.reason, "environment_drift");
assert.equal(experiment.drifted.checkpoint.fingerprint, "/workspace/demo@abc123");

console.log("long task recovery lab: 3 paths passed");
