import { buildBoundedContext, buildNaiveContext } from "./context.mjs";

export const sourceMessages = [
  { id: "system", role: "system", pinned: true, content: "Always preserve the safety rule and unresolved risk." },
  { id: "task", role: "user", pinned: true, content: "Summarize the incident and name the next owner." },
  { id: "obs-1", role: "toolResult", content: "Log scan produced 240 repeated stack frames." },
  { id: "obs-2", role: "toolResult", content: "Retry storm started after the cache timeout." },
  { id: "correction", role: "user", pinned: true, content: "Correction: do not restart the database." },
  { id: "obs-3", role: "toolResult", content: "Dashboard confirms latency returned to baseline." },
  { id: "obs-4", role: "assistant", content: "Candidate next step: roll back the cache change." },
  { id: "obs-5", role: "toolResult", content: "Owner Alice will validate the rollback window." },
];

export function runExperiment({ budget = 64 } = {}) {
  const naive = buildNaiveContext(sourceMessages);
  const bounded = buildBoundedContext(sourceMessages, budget);
  return {
    budget,
    naive,
    bounded,
    result: {
      naiveExceedsBudget: naive.tokens > budget,
      boundedFitsBudget: bounded.tokens <= budget,
      pinnedRetained: bounded.selected
        .filter((message) => message.pinned)
        .every((message) => bounded.selected.some((item) => item.id === message.id)),
    },
  };
}

if (process.argv[1] === import.meta.filename) {
  const experiment = runExperiment();
  console.log(JSON.stringify({ type: "experiment", ...experiment.result }));
  console.log(JSON.stringify({ type: "naive", tokens: experiment.naive.tokens, selected: experiment.naive.selected.length, dropped: experiment.naive.dropped.length }));
  console.log(JSON.stringify({ type: "bounded", tokens: experiment.bounded.tokens, budget: experiment.budget, selected: experiment.bounded.selected.map((message) => message.id), dropped: experiment.bounded.dropped }));
}
