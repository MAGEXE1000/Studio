const { Project, SyntaxKind } = require('ts-morph');

const project = new Project({
    tsConfigFilePath: 'packages/ui-shared/tsconfig.json'
});

const files = project.getSourceFiles();

let useSettingsStoreImported = false;

files.forEach(sourceFile => {
    let changed = false;

    // Fix imports
    const studioCoreImport = sourceFile.getImportDeclaration('@workspace/studio-core');
    if (studioCoreImport) {
        // ... handled below
    }

    // Replace useChordStore().settings with useSettingsStore().settings
    const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
    for (const callExpr of callExpressions) {
        const expression = callExpr.getExpression();
        if (expression.getText() === 'useChordStore') {
            const parent = callExpr.getParent();
            
            // e.g. const { settings } = useChordStore()
            if (parent.getKind() === SyntaxKind.VariableDeclaration) {
                const nameNode = parent.getNameNode();
                if (nameNode.getKind() === SyntaxKind.ObjectBindingPattern) {
                    const text = nameNode.getText();
                    if (text.includes('settings') || text.includes('lastSession')) {
                        expression.replaceWithText('useSettingsStore');
                        changed = true;
                    }
                }
            }

            // e.g. useChordStore(s => s.settings)
            const args = callExpr.getArguments();
            if (args.length > 0) {
                const argText = args[0].getText();
                if (argText.includes('.settings') || argText.includes('.lastSession')) {
                    expression.replaceWithText('useSettingsStore');
                    changed = true;
                } else if (argText.includes('useShallow')) {
                    if (argText.includes('.settings') || argText.includes('.lastSession')) {
                        expression.replaceWithText('useSettingsStore');
                        changed = true;
                    }
                }
            }
        }
    }
    
    // Also look for useChordStore.getState().settings
    const propertyAccesses = sourceFile.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression);
    for (const pa of propertyAccesses) {
        if (pa.getText() === 'useChordStore.getState().settings' || pa.getText() === 'useChordStore.getState().settingsController') {
             pa.getExpression().getExpression().replaceWithText('useSettingsStore');
             changed = true;
        }
    }

    if (changed) {
        if (studioCoreImport) {
            const namedImports = studioCoreImport.getNamedImports();
            if (!namedImports.some(n => n.getName() === 'useSettingsStore')) {
                studioCoreImport.addNamedImport('useSettingsStore');
            }
        }
        sourceFile.saveSync();
    }
});
