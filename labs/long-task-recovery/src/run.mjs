import { createCheckpoint, createRun, resume, runWithoutState } from "./recovery.mjs";

export function runExperiment() {
  const withoutState = runWithoutState();

  const first = createRun();
  for (const step of ["scan", "patch"]) {
    first.execute(step);
  }
  const environment = { workspace: "/workspace/demo", revision: "abc123" };
  const lease = { owner: "agent-a", token: "lease-1" };
  const checkpoint = createCheckpoint(first, environment, lease);

  const resumed = resume({ checkpoint, environment, lease });
  const drifted = resume({
    checkpoint,
    environment: { workspace: "/workspace/demo", revision: "def456" },
    lease,
  });

  return {
    withoutState,
    checkpoint,
    resumed,
    drifted,
  };
}

if (process.argv[1] === import.meta.filename) {
  console.log(JSON.stringify({ type: "experiment", ...runExperiment() }, null, 2));
}
