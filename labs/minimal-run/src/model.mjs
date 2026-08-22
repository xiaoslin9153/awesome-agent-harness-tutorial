export function createFakeModel(responses) {
  let index = 0;
  return {
    respond() {
      if (index >= responses.length) {
        throw new Error("Fake model has no more scripted responses");
      }
      return structuredClone(responses[index++]);
    },
  };
}
