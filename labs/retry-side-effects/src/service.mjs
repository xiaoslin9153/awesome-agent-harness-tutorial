export function createTicketService() {
  const committed = new Map();
  const attempts = [];

  return {
    get attempts() {
      return structuredClone(attempts);
    },
    get tickets() {
      return [...committed.values()];
    },
    create({ idempotencyKey, title }) {
      const attempt = { idempotencyKey: idempotencyKey ?? null, title };
      attempts.push(attempt);

      if (!idempotencyKey) {
        if (attempt.title === "unknown-state") {
          throw Object.assign(new Error("timeout after commit"), { code: "UNKNOWN_STATE" });
        }
        const ticket = { id: `ticket-${committed.size + 1}`, title };
        committed.set(ticket.id, ticket);
        return ticket;
      }

      if (committed.has(idempotencyKey)) {
        return { ...committed.get(idempotencyKey), deduplicated: true };
      }

      if (title === "unknown-state") {
        const ticket = { id: idempotencyKey, title };
        committed.set(idempotencyKey, ticket);
        throw Object.assign(new Error("timeout after commit"), { code: "UNKNOWN_STATE", ticketId: ticket.id });
      }

      const ticket = { id: idempotencyKey, title };
      committed.set(idempotencyKey, ticket);
      return ticket;
    },
    find(idempotencyKey) {
      return committed.get(idempotencyKey) ?? null;
    },
    markRequiresHuman(ticketId) {
      const ticket = committed.get(ticketId);
      if (ticket) {
        ticket.requiresHuman = true;
      }
      return ticket ?? null;
    },
  };
}
