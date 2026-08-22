export const echoTool = {
  name: "echo",
  description: "Return the requested text.",
  parameters: {
    type: "object",
    required: ["text"],
    properties: {
      text: { type: "string" },
    },
  },
  execute(args) {
    if (typeof args?.text !== "string") {
      throw new Error("echo requires text");
    }
    return { text: args.text };
  },
};

export function validateToolArguments(tool, args) {
  if (!tool || tool.name !== "echo") {
    throw new Error("Unknown tool");
  }
  if (typeof args?.text !== "string") {
    throw new Error(`Validation failed for ${tool.name}`);
  }
  return structuredClone(args);
}
