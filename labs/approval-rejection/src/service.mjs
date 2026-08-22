export function createApprovalService() {
  const audit = [];
  const decisions = new Map();
  const effects = [];

  return {
    get audit() {
      return structuredClone(audit);
    },
    get effects() {
      return structuredClone(effects);
    },
    request({ id, action, resource, decision }) {
      if (decisions.has(id)) {
        throw new Error(`Approval id already exists: ${id}`);
      }
      const resolved = decision ?? (resource.startsWith("public/") ? "approved" : "denied");
      const record = { type: "decision", id, action, resource, result: resolved };
      audit.push(record);
      decisions.set(id, record);
      return structuredClone(record);
    },
    execute(approval, payload) {
      if (!approval || approval.result !== "approved") {
        const failure = { type: "effect", id: approval?.id ?? "unknown", result: "blocked" };
        audit.push(failure);
        throw Object.assign(new Error("Execution requires approval"), { observation: failure });
      }
      const effect = { type: "effect", id: approval.id, result: "executed", payload };
      audit.push(effect);
      effects.push(effect);
      return structuredClone(effect);
    },
  };
}
