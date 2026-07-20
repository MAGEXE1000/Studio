const fs = require('fs');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  content = content.replace(/import\s*\{([^}]*)\}\s*from\s*['"]@workspace\/studio-core['"]/g, (match, p1) => {
     let parts = p1.split(',').map(s => s.trim()).filter(Boolean);
     parts = parts.map(p => p.replace(/^(?:authRepository|userRepository)\./, ''));
     
     const authMethods = ['subscribeAuth', 'signInGoogle', 'signInEmail', 'registerEmail', 'signOut', 'updateDisplayName', 'sendPasswordReset', 'sendVerificationEmail', 'isEmailVerified', 'getSignInProviders', 'getFirebaseAuth'];
     const userMethods = ['scheduleAccountDeletion', 'disableAccount'];

     parts = parts.filter(p => !authMethods.includes(p) && !userMethods.includes(p));
     if (!parts.includes('authRepository')) parts.push('authRepository');
     if (!parts.includes('userRepository')) parts.push('userRepository');

     parts = [...new Set(parts)];
     return `import { \n  ${parts.join(',\n  ')}\n} from '@workspace/studio-core'`;
  });

  fs.writeFileSync(filePath, content);
  console.log(`Updated ${filePath}`);
}

fixFile('packages/ui-shared/src/components/cards/AccountCard.tsx');
fixFile('packages/ui-shared/src/components/hub/StudioHub.tsx');
