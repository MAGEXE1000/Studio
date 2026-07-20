const fs = require('fs');
const glob = require('glob'); // Not available? I'll just use a recursive walk.
const path = require('path');

function walk(dir) {
    let results = [];
    let list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        let stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

let files = walk('packages/ui-shared/src');

for (let file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    content = content.replace(/useChordStore\(\s*\(\s*s\s*\)\s*=>\s*s\.settings\s*\)/g, 'useSettingsStore((s) => s.settings)');
    content = content.replace(/useChordStore\(\s*\(\s*state\s*\)\s*=>\s*state\.settings\s*\)/g, 'useSettingsStore((state) => state.settings)');
    
    content = content.replace(/useChordStore\(\s*\(\s*s\s*\)\s*=>\s*s\.lastSession\s*\)/g, 'useSettingsStore((s) => s.lastSession)');
    content = content.replace(/useChordStore\(\s*\(\s*state\s*\)\s*=>\s*state\.lastSession\s*\)/g, 'useSettingsStore((state) => state.lastSession)');

    content = content.replace(/useChordStore\.getState\(\)\.settings/g, 'useSettingsStore.getState().settings');
    content = content.replace(/useChordStore\.getState\(\)\.settingsController/g, 'useSettingsStore.getState().settingsController');

    // Missing settingsController imports or definitions
    content = content.replace(/const\s+settingsController\s*=\s*useSettingsStore\.getState\(\)\.settingsController/g, 'const settingsController = useSettingsStore.getState().settingsController');

    // Missing updateSettings
    content = content.replace(/updateSettings/g, 'useSettingsStore.getState().settingsController.updateSettings');
    // Wait, updateSettings is too generic.
    
    if (content !== original) {
        // Add import if missing
        if (!content.includes('useSettingsStore')) {
            content = content.replace(/import\s*\{([^}]*)\}\s*from\s*'@workspace\/studio-core';/, "import { $1, useSettingsStore } from '@workspace/studio-core';");
        }
        fs.writeFileSync(file, content, 'utf8');
    }
}
