const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        content = content.replace(/SpringPresets\.spring/g, 'SpringPresets.stiff');
        content = content.replace(/SpringPresets\.standard/g, 'SpringPresets.medium');
        content = content.replace(/SpringPresets\.emphasized/g, 'SpringPresets.expressive');
        fs.writeFileSync(filePath, content, 'utf8');
    }
}

fixFile('packages/ui-shared/src/navigation/AppAnimationSystem.tsx');
