import assert from "node:assert/strict";
import { runAgent } from "../src/run.mjs";

const direct = runAgent({
  input: "Say ready",
  responses: [{ role: "assistant", content: [{ type: "text", text: "ready" }] }],
});
assert.equal(direct.events.at(-1).type, "run_end");
assert.equal(direct.events.at(-1).reason, "completed");

const withTool = runAgent({
  input: "Echo hello",
  responses: [
    {
      role: "assistant",
      content: [{ type: "toolCall", id: "call-1", name: "echo", arguments: { text: "hello" } }],
    },
    { role: "assistant", content: [{ type: "text", text: "hello" }] },
  ],
});
assert.deepEqual(
  withTool.events.filter((event) => event.type === "tool_result").map((event) => event.result),
  [{ text: "hello" }],
);

const withFailure = runAgent({
  input: "Echo missing",
  responses: [
    {
      role: "assistant",
      content: [{ type: "toolCall", id: "call-2", name: "echo", arguments: {} }],
    },
    { role: "assistant", content: [{ type: "text", text: "reported failure" }] },
  ],
});
const failure = withFailure.events.find((event) => event.type === "tool_result");
assert.equal(failure.isError, true);
assert.equal(withFailure.messages.filter((message) => message.role === "toolResult").length, 1);

console.log("minimal agent run lab: 3 paths passed");
