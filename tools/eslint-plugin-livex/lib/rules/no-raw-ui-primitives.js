module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow raw HTML primitives in favor of design system components',
      category: 'Architecture',
      recommended: false,
    },
    schema: [],
  },
  create(context) {
    const filename = (context.filename || context.getFilename()).replace(/\\/g, '/');
    const isFeatureModule = filename.includes('/features/');

    const bannedTags = ['button', 'input', 'select'];

    return {
      JSXOpeningElement(node) {
        if (!isFeatureModule) return;

        if (node.name.type === 'JSXIdentifier' && bannedTags.includes(node.name.name)) {
          context.report({
            node,
            message: `Raw <${node.name.name}> element is not allowed in feature modules. Use the corresponding design system component from packages/ui.`,
          });
        }
      },
    };
  },
};
