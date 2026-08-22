import { createTicketService } from "./service.mjs";

function attempt(service, options) {
  try {
    return { status: "ok", result: service.create(options) };
  } catch (error) {
    return {
      status: error.code === "UNKNOWN_STATE" ? "unknown" : "error",
      code: error.code,
      result: error.ticketId ? service.markRequiresHuman(error.ticketId) : null,
    };
  }
}

export function runExperiment() {
  const withoutKey = createTicketService();
  attempt(withoutKey, { title: "deploy" });
  attempt(withoutKey, { title: "deploy" });

  const withKey = createTicketService();
  const first = attempt(withKey, { idempotencyKey: "deploy-2026-08-23", title: "deploy" });
  const replay = attempt(withKey, { idempotencyKey: "deploy-2026-08-23", title: "deploy" });

  const unknown = createTicketService();
  const firstUnknown = attempt(unknown, { idempotencyKey: "ticket-incident", title: "unknown-state" });
  const lookup = unknown.find("ticket-incident");
  const recovery = lookup && !lookup.requiresHuman
    ? { status: "escalated", result: unknown.markRequiresHuman(lookup.id) }
    : firstUnknown;

  return {
    withoutKey: {
      attempts: withoutKey.attempts.length,
      tickets: withoutKey.tickets,
      duplicated: withoutKey.tickets.length === 2,
    },
    withKey: {
      attempts: withKey.attempts.length,
      first,
      replay,
      deduplicated: replay.result.deduplicated === true,
      tickets: withKey.tickets,
    },
    unknownState: {
      attempts: unknown.attempts.length,
      first: firstUnknown,
      lookup,
      recovery,
      requiresHuman: unknown.find("ticket-incident")?.requiresHuman === true,
    },
  };
}

if (process.argv[1] === import.meta.filename) {
  console.log(JSON.stringify({ type: "experiment", ...runExperiment() }, null, 2));
}
