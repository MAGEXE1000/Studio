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

replaceInFile('packages/ui-shared/src/features/stagex/services/StageBridgeService.ts', 'useSettingsStore.getState().settingsController.updateSettings', 'useSettingsStore.getState().updateSettings');
replaceInFile('packages/ui-shared/src/features/vocalex/pages/VocalexApp.tsx', 'useSettingsStore.getState().settingsController.updateSettings', 'useSettingsStore.getState().updateSettings');

// StudioHub truthy fix
replaceInFile('packages/ui-shared/src/components/hub/StudioHub.tsx', "<DevInfoRow label=\"Current Active App\" value={'hub' || 'hub'} />", "<DevInfoRow label=\"Current Active App\" value={'hub'} />");
