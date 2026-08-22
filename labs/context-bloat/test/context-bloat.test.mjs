import assert from "node:assert/strict";
import { buildBoundedContext, buildNaiveContext } from "../src/context.mjs";
import { runExperiment } from "../src/run.mjs";

const experiment = runExperiment({ budget: 64 });
assert.equal(experiment.result.naiveExceedsBudget, true);
assert.equal(experiment.result.boundedFitsBudget, true);
assert.equal(experiment.result.pinnedRetained, true);

const boundedIds = experiment.bounded.selected.map((message) => message.id);
for (const id of ["system", "task", "correction", "obs-5"]) {
  assert.ok(boundedIds.includes(id));
}
assert.ok(experiment.bounded.dropped.some((item) => item.id === "obs-1" && item.reason === "budget"));

const messages = [
  { id: "system", role: "system", pinned: true, content: "rule" },
  { id: "old", role: "toolResult", content: "old observation" },
  { id: "new", role: "assistant", content: "new step" },
];
assert.equal(buildNaiveContext(messages).selected.length, 3);
assert.deepEqual(buildBoundedContext(messages, 8).selected.map((message) => message.id), ["system", "new"]);

console.log("context bloat lab: 4 checks passed");
