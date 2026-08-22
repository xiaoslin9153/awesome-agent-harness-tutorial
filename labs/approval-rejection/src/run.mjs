import { createApprovalService } from "./service.mjs";

function requestAndExecute(service, options, payload) {
  try {
    const approval = service.request(options);
    if (approval.result !== "approved") {
      if (approval.result === "undecided") {
        return {
          status: "undecided",
          approval,
          observation: { code: "APPROVAL_UNDECIDED", resource: approval.resource },
        };
      }
      return {
        status: approval.result,
        approval,
        observation: {
          code: "APPROVAL_DENIED",
          resource: approval.resource,
          message: "Choose an allowed resource or revise the request.",
        },
      };
    }
    return { status: "executed", approval, effect: service.execute(approval, payload) };
  } catch (error) {
    return {
      status: "undecided",
      observation: error.observation ?? { code: "APPROVAL_UNDECIDED" },
    };
  }
}

export function runExperiment() {
  const service = createApprovalService();

  const approved = requestAndExecute(
    service,
    { id: "approve-public", action: "publish", resource: "public/report", decision: "approved" },
    { bytes: 128 },
  );

  const denied = requestAndExecute(service, {
    id: "deny-private",
    action: "publish",
    resource: "private/draft",
    decision: "denied",
  });

  const alternative = requestAndExecute(
    service,
    { id: "approve-alternative", action: "publish", resource: "public/summary", decision: "approved" },
    { bytes: 64 },
  );

  const undecided = requestAndExecute(service, {
    id: "timeout-public",
    action: "publish",
    resource: "public/late",
    decision: "undecided",
  });

  return {
    approved,
    denied,
    alternative,
    undecided,
    audit: service.audit,
    executedIds: service.effects.map((effect) => effect.id),
  };
}

if (process.argv[1] === import.meta.filename) {
  console.log(JSON.stringify({ type: "experiment", ...runExperiment() }, null, 2));
}
