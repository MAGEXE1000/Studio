module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow inline spring configurations (stiffness, damping, mass)',
      category: 'Stylistic Issues',
      recommended: false,
    },
    schema: [],
  },
  create(context) {
    return {
      ObjectExpression(node) {
        const hasStiffness = node.properties.some(
          (p) => p.type === 'Property' && p.key.name === 'stiffness'
        );
        const hasDamping = node.properties.some(
          (p) => p.type === 'Property' && p.key.name === 'damping'
        );

        if (hasStiffness && hasDamping) {
          context.report({
            node,
            message:
              'Inline spring configurations are not allowed. Import SpringPresets from packages/tokens.',
          });
        }
      },
    };
  },
};
