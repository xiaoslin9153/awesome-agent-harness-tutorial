import { createFakeModel } from "./model.mjs";
import { echoTool, validateToolArguments } from "./tools.mjs";

const demo = {
  input: "Echo hello",
  responses: [
    {
      role: "assistant",
      content: [{ type: "toolCall", id: "call-1", name: "echo", arguments: { text: "hello" } }],
    },
    { role: "assistant", content: [{ type: "text", text: "hello" }] },
  ],
};

export function runAgent({ input, responses, tools = [echoTool] }) {
  if (typeof input !== "string" || input.length === 0) {
    throw new Error("Run input must be a non-empty string");
  }

  const events = [];
  const emit = (type, payload = {}) => {
    events.push({ type, ...payload });
  };
  const model = createFakeModel(responses);
  const messages = [{ role: "user", content: input }];

  emit("run_start", { input });

  for (let turn = 1; turn <= 10; turn += 1) {
    emit("turn_start", { turn });
    const assistant = model.respond();
    messages.push(assistant);
    emit("assistant_message", { turn, message: structuredClone(assistant) });

    const calls = assistant.content.filter((block) => block.type === "toolCall");
    if (calls.length === 0) {
      emit("turn_end", { turn, reason: "completed" });
      emit("run_end", { reason: "completed", output: assistant.content });
      return { events, messages };
    }

    for (const call of calls) {
      emit("tool_call", { turn, callId: call.id, name: call.name, args: structuredClone(call.arguments) });
      let result;
      let isError = false;
      try {
        const tool = tools.find((candidate) => candidate.name === call.name);
        const validatedArgs = validateToolArguments(tool, call.arguments);
        result = tool.execute(validatedArgs);
      } catch (error) {
        isError = true;
        result = { error: error.message };
      }
      const observation = {
        role: "toolResult",
        toolCallId: call.id,
        toolName: call.name,
        content: result,
        isError,
      };
      messages.push(observation);
      emit("tool_result", { turn, callId: call.id, name: call.name, result, isError });
    }

    emit("turn_end", { turn, reason: "tool_results" });
  }

  emit("run_end", { reason: "max_turns" });
  return { events, messages };
}

if (process.argv[1] === import.meta.filename) {
  const { events } = runAgent(demo);
  for (const event of events) {
    console.log(JSON.stringify(event));
  }
}
