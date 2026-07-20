const fs = require('fs');

const path = 'packages/ui-shared/src/navigation/AppAnimationSystem.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/EasingPresets\.medium/g, 'SpringPresets.medium');
content = content.replace(/EasingPresets/g, 'SpringPresets');
content = content.replace(/SpringPresets\.medium/g, 'SpringPresets.medium as any'); // Just in case of type mismatches

fs.writeFileSync(path, content, 'utf8');
