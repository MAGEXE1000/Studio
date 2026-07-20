const fs = require('fs');
let c = fs.readFileSync('packages/ui-shared/src/components/cards/AccountCard.tsx', 'utf8');

const methods = ['updateDisplayName', 'sendPasswordReset', 'sendVerificationEmail', 'isEmailVerified', 'getSignInProviders', 'getFirebaseAuth'];

c = c.replace(/import\s+\{([^}]+)\}\s+from\s+['"]@workspace\/studio-core['"];/g, (match, imports) => {
    let newImports = imports.split(',').map(s => s.trim()).filter(s => s && !methods.includes(s));
    return `import { ${newImports.join(', ')} } from "@workspace/studio-core";`;
});

for (const m of methods) {
    c = c.replace(new RegExp(`(?<!authRepository\\.)\\b${m}\\(`, 'g'), `authRepository.${m}(`);
    c = c.replace(new RegExp(`(?<!authRepository\\.)\\b${m}\\b(?!\\()`, 'g'), `authRepository.${m}`);
}

fs.writeFileSync('packages/ui-shared/src/components/cards/AccountCard.tsx', c);
console.log('Fixed final auth methods in AccountCard.tsx');
