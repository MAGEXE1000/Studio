module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow features from importing other features directly',
      category: 'Architecture',
      recommended: false,
    },
    schema: [],
  },
  create(context) {
    const filename = (context.filename || context.getFilename()).replace(/\\/g, '/');
    const featureMatch = filename.match(/\/features\/([^/]+)\//);
    const currentFeature = featureMatch ? featureMatch[1] : null;

    return {
      ImportDeclaration(node) {
        const importPath = node.source.value;
        const importedFeatureMatch = importPath.match(/\/features\/([^/]+)/);

        if (importedFeatureMatch && currentFeature) {
          const importedFeature = importedFeatureMatch[1];
          // If we are in a feature, and importing from another feature
          if (importedFeature !== currentFeature && !importPath.includes('..')) {
            // Also need to handle relative imports that traverse up to features
            // This is a basic implementation for now.
            context.report({
              node,
              message: `Cross-feature import detected. Feature '${currentFeature}' cannot import from feature '${importedFeature}'.`,
            });
          }
        }
      },
    };
  },
};
