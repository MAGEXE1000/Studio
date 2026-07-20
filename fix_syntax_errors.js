const fs = require('fs');

function replaceInFile(filepath, search, replace) {
    if (fs.existsSync(filepath)) {
        let content = fs.readFileSync(filepath, 'utf8');
        let original = content;
        content = content.split(search).join(replace);
        if (content !== original) {
            fs.writeFileSync(filepath, content, 'utf8');
        }
    }
}

replaceInFile('packages/ui-shared/src/components/cards/AccountCard.tsx', 'await // retrySync();', '/* await retrySync(); */');
replaceInFile('packages/ui-shared/src/components/cards/AccountCard.tsx', 'onClick={() => // syncNow?.()}', 'onClick={() => { /* syncNow?.() */ }}');
replaceInFile('packages/ui-shared/src/components/cards/AccountCard.tsx', 'onClick={() => // retrySync()}', 'onClick={() => { /* retrySync() */ }}');

replaceInFile('packages/ui-shared/src/components/design-system/StudioDesignSystem.tsx', "import {  } from '../../navigation/AppAnimationSystem';", "");
