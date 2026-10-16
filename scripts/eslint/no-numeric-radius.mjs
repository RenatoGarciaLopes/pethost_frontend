/** Reject numeric borderRadius values: MUI multiplies them by shape.borderRadius. */
export const noNumericRadius = {
  meta: {
    type: "problem",
    docs: { description: "Require named Quintal radius tokens" },
    schema: [],
    messages: { named: "Use theme.quintal.radius.* or quintalRadii instead of a numeric borderRadius." },
  },
  create(context) {
    return {
      Property(node) {
        const key =
          node.key.type === "Identifier"
            ? node.key.name
            : node.key.type === "Literal" && typeof node.key.value === "string"
              ? node.key.value
              : undefined;
        if (key !== "borderRadius") return;
        const value = node.value;
        if (value.type === "Literal" && typeof value.value === "number" && value.value !== 0) {
          context.report({ node: value, messageId: "named" });
        }
      },
    };
  },
};

const plugin = { rules: { "no-numeric-radius": noNumericRadius } };
export default plugin;
