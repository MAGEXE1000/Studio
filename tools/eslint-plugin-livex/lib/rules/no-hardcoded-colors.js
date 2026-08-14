module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow hardcoded color values (hex, rgb, hsl)',
      category: 'Stylistic Issues',
      recommended: false,
    },
    schema: [], // no options
  },
  create(context) {
    const colorRegex =
      /(#([a-fA-F0-9]{3}|[a-fA-F0-9]{4}|[a-fA-F0-9]{6}|[a-fA-F0-9]{8})\b)|(?:rgb|hsl)a?\([^)]{1,200}\)/;

    return {
      Literal(node) {
        if (typeof node.value === 'string' && colorRegex.test(node.value)) {
          // If we are in a JSXAttribute or ObjectExpression inside JSX
          let parent = node.parent;
          let inJSX = false;
          while (parent) {
            if (parent.type === 'JSXElement') {
              inJSX = true;
              break;
            }
            parent = parent.parent;
          }
          if (inJSX) {
            context.report({
              node,
              message:
                'Hardcoded colors are not allowed. Use design tokens (e.g. var(--c-bg-primary)) instead.',
            });
          }
        }
      },
    };
  },
};
