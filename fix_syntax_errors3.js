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

replaceInFile('packages/ui-shared/src/components/cards/AccountCard.tsx', 'await // syncNow();', '/* await syncNow(); */');
replaceInFile('packages/ui-shared/src/components/hub/StudioHub.tsx', 'await // syncNow();', '/* await syncNow(); */');
replaceInFile('packages/ui-shared/src/components/hub/faqConstants.tsx', 'await // syncNow();', '/* await syncNow(); */');

replaceInFile('packages/ui-shared/src/components/cards/AccountCard.tsx', 'await // doSyncNow();', '/* await doSyncNow(); */');
replaceInFile('packages/ui-shared/src/components/hub/StudioHub.tsx', 'await // doSyncNow();', '/* await doSyncNow(); */');
replaceInFile('packages/ui-shared/src/components/hub/faqConstants.tsx', 'await // doSyncNow();', '/* await doSyncNow(); */');

// Also handle if they are not awaited
replaceInFile('packages/ui-shared/src/components/cards/AccountCard.tsx', 'onClick={() => // syncNow()}', 'onClick={() => { /* syncNow() */ }}');
replaceInFile('packages/ui-shared/src/components/hub/StudioHub.tsx', 'onClick={() => // syncNow()}', 'onClick={() => { /* syncNow() */ }}');
replaceInFile('packages/ui-shared/src/components/hub/faqConstants.tsx', 'onClick={() => // syncNow()}', 'onClick={() => { /* syncNow() */ }}');

