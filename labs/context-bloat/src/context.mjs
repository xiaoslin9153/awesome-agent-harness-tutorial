export function estimateTokens(text) {
  return Math.ceil([...text].length / 4);
}

function messageTokens(message) {
  return estimateTokens(`${message.role}: ${message.content}`);
}

export function buildNaiveContext(messages) {
  const selected = structuredClone(messages);
  const tokens = selected.reduce((total, message) => total + messageTokens(message), 0);
  return { selected, dropped: [], tokens };
}

export function buildBoundedContext(messages, budget) {
  const selected = [];
  const dropped = [];
  let tokens = 0;

  for (const message of messages) {
    if (message.pinned) {
      const cost = messageTokens(message);
      if (tokens + cost > budget) {
        throw new Error("Pinned messages exceed context budget");
      }
      selected.push({ ...structuredClone(message), projection: "pinned" });
      tokens += cost;
    }
  }

  for (const message of [...messages].reverse()) {
    if (message.pinned) {
      continue;
    }
    const cost = messageTokens(message);
    if (tokens + cost <= budget) {
      selected.push({ ...structuredClone(message), projection: "recent" });
      tokens += cost;
    } else {
      dropped.push({
        id: message.id,
        role: message.role,
        reason: "budget",
        tokens: cost,
      });
    }
  }

  selected.sort((left, right) => messages.findIndex(({ id }) => id === left.id) - messages.findIndex(({ id }) => id === right.id));
  return { selected, dropped, tokens };
}
