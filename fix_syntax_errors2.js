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

replaceInFile('packages/ui-shared/src/components/cards/AccountCard.tsx', 'onClick={() => // syncNow?.()}', 'onClick={() => { /* syncNow?.() */ }}');
replaceInFile('packages/ui-shared/src/components/cards/AccountCard.tsx', 'onClick={() => // doSyncNow?.()}', 'onClick={() => { /* doSyncNow?.() */ }}');
replaceInFile('packages/ui-shared/src/components/cards/AccountCard.tsx', 'onClick={() => // syncNow()}', 'onClick={() => { /* syncNow() */ }}');
replaceInFile('packages/ui-shared/src/components/cards/AccountCard.tsx', 'onClick={() => // doSyncNow()}', 'onClick={() => { /* doSyncNow() */ }}');

replaceInFile('packages/ui-shared/src/components/hub/faqConstants.tsx', 'onClick={() => // syncNow?.()}', 'onClick={() => { /* syncNow?.() */ }}');
replaceInFile('packages/ui-shared/src/components/hub/faqConstants.tsx', 'onClick={() => // syncNow()}', 'onClick={() => { /* syncNow() */ }}');

replaceInFile('packages/ui-shared/src/components/hub/StudioHub.tsx', 'onClick={() => // syncNow?.()}', 'onClick={() => { /* syncNow?.() */ }}');
replaceInFile('packages/ui-shared/src/components/hub/StudioHub.tsx', 'onClick={() => // syncNow()}', 'onClick={() => { /* syncNow() */ }}');
replaceInFile('packages/ui-shared/src/components/hub/StudioHub.tsx', 'onClick={() => { // syncNow?.(); }}', 'onClick={() => { /* syncNow?.(); */ }}');
replaceInFile('packages/ui-shared/src/components/hub/StudioHub.tsx', 'onClick={() => {\n                                          setSearchOpen(false);\n                                          setSearchQuery(\'\');\n                                          // syncNow?.();\n                                        }}', 'onClick={() => {\n                                          setSearchOpen(false);\n                                          setSearchQuery(\'\');\n                                          /* syncNow?.(); */\n                                        }}');
replaceInFile('packages/ui-shared/src/components/hub/StudioHub.tsx', '// syncNow?.();', '/* syncNow?.(); */');
