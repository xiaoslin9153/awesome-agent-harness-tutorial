import assert from "node:assert/strict";
import { runExperiment } from "../src/run.mjs";

const experiment = runExperiment();

assert.equal(experiment.approved.status, "executed");
assert.equal(experiment.approved.effect.payload.bytes, 128);

assert.equal(experiment.denied.status, "denied");
assert.equal(experiment.denied.observation.code, "APPROVAL_DENIED");

assert.equal(experiment.alternative.status, "executed");
assert.equal(experiment.alternative.effect.payload.bytes, 64);

assert.equal(experiment.undecided.status, "undecided");
assert.equal(experiment.undecided.observation.code, "APPROVAL_UNDECIDED");

assert.deepEqual(experiment.executedIds, ["approve-public", "approve-alternative"]);
assert.equal(
  experiment.audit.filter((event) => event.type === "effect").length,
  experiment.audit.filter((event) => event.type === "decision").length - 2,
);

console.log("approval rejection lab: 4 paths passed");
