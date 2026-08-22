export function createRun() {
  const events = [];
  const effects = [];

  return {
    get events() {
      return structuredClone(events);
    },
    get effects() {
      return structuredClone(effects);
    },
    append(event) {
      events.push({ sequence: events.length + 1, ...event });
      return this.events.at(-1);
    },
    execute(step) {
      const event = { type: "effect", step };
      events.push({ sequence: events.length + 1, ...event });
      effects.push(step);
      return { type: "effect", step, result: "committed" };
    },
  };
}

const allSteps = ["scan", "patch", "test", "publish"];

function fingerprint(environment) {
  return `${environment.workspace}@${environment.revision}`;
}

export function runWithoutState() {
  const run = createRun();
  run.append({ type: "run_start" });
  for (const step of allSteps) {
    run.execute(step);
    if (step === "test") {
      break;
    }
  }
  run.append({ type: "interrupted", reason: "process_exit" });
  const second = createRun();
  for (const step of allSteps) {
    second.execute(step);
  }
  second.append({ type: "run_end", reason: "completed" });
  return {
    strategy: "without-state",
    firstRunEffects: run.effects,
    recoveryEffects: second.effects,
    duplicatedSteps: allSteps.filter((step) => run.effects.includes(step) && second.effects.includes(step)),
    duplicateEffects: allSteps.filter((step) => run.effects.includes(step) && second.effects.includes(step)).length,
  };
}

export function createCheckpoint(run, environment, lease) {
  const closedEvents = run.events.filter((event) => event.type === "effect");
  return {
    schemaVersion: 1,
    runId: "long-task-1",
    fingerprint: fingerprint(environment),
    lease,
    completedSteps: closedEvents.map((event) => event.step),
    nextStep: allSteps[closedEvents.length],
  };
}

export function resume({ checkpoint, environment, lease }) {
  if (checkpoint.fingerprint !== fingerprint(environment)) {
    return { status: "rejected", reason: "environment_drift", checkpoint };
  }
  if (checkpoint.lease.owner !== lease.owner || checkpoint.lease.token !== lease.token) {
    return { status: "rejected", reason: "lease_conflict", checkpoint };
  }

  const run = createRun();
  for (const step of checkpoint.completedSteps) {
    run.append({ type: "replayed", step });
  }
  for (const step of allSteps.slice(checkpoint.completedSteps.length)) {
    run.execute(step);
  }
  run.append({ type: "run_end", reason: "completed" });
  return {
    status: "resumed",
    checkpoint,
    executedSteps: run.effects,
    events: run.events,
  };
}
