module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow creating Zustand stores outside packages/core',
      category: 'Architecture',
      recommended: false,
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename || context.getFilename();
    const isInsideCore = filename.includes('packages/core') || filename.includes('packages\\core');

    let importsZustandCreate = false;

    return {
      ImportDeclaration(node) {
        if (node.source.value === 'zustand') {
          node.specifiers.forEach((specifier) => {
            if (specifier.type === 'ImportSpecifier' && specifier.imported.name === 'create') {
              importsZustandCreate = true;
            } else if (specifier.type === 'ImportDefaultSpecifier') {
              importsZustandCreate = true;
            }
          });
        }
      },
      CallExpression(node) {
        if (!importsZustandCreate) return;

        const isCreateCall =
          node.callee.name === 'create' ||
          (node.callee.type === 'MemberExpression' && node.callee.property.name === 'create');

        if (isCreateCall && !isInsideCore) {
          context.report({
            node,
            message: 'Zustand stores must be created inside packages/core.',
          });
        }
      },
    };
  },
};
