const fs = require('fs');

function fixApp(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');

  // 1. Remove duplicate renderScenesBar
  // Find the SECOND occurrence of `function renderScenesBar() {` and remove it along with positionScenesBar
  const renderScenesBarIdx = code.indexOf('function renderScenesBar() {');
  if (renderScenesBarIdx !== -1) {
    const secondRenderScenesBarIdx = code.indexOf('function renderScenesBar() {', renderScenesBarIdx + 1);
    if (secondRenderScenesBarIdx !== -1) {
      // Find where positionScenesBar ends
      const positionEnd = code.indexOf('function positionScenesBar() {}', secondRenderScenesBarIdx);
      if (positionEnd !== -1) {
        code = code.substring(0, secondRenderScenesBarIdx) + code.substring(positionEnd + 'function positionScenesBar() {}'.length);
      }
    }
  }

  // 2. Remove duplicate renameScenePrompt
  // The first one is at ~5842 (the old window.prompt one).
  // Wait, my epic changed the SECOND one (at ~6131) to use showPrompt!
  // If I remove the SECOND one, I lose my Epic's changes!
  // Let me replace the FIRST one with the SECOND one, or just remove the FIRST one!
  const firstRenameIdx = code.indexOf('function renameScenePrompt(idx) {');
  if (firstRenameIdx !== -1) {
    const secondRenameIdx = code.indexOf('function renameScenePrompt(idx) {', firstRenameIdx + 1);
    if (secondRenameIdx !== -1) {
      // Find the end of the FIRST renameScenePrompt
      const firstRenameEnd = code.indexOf('saveProject();', firstRenameIdx);
      if (firstRenameEnd !== -1) {
        const braceAfter = code.indexOf('}', firstRenameEnd);
        if (braceAfter !== -1) {
          code = code.substring(0, firstRenameIdx) + code.substring(braceAfter + 1);
        }
      }
    }
  }

  // 3. Fix missing brace in restore(payload)
  // The cloud sync bridge IIFE has a missing brace for function restore(payload) {
  const restoreTarget = '} catch (e) {}\r\n    }\r\n  window.stageHasOpenOverlay';
  const restoreTarget2 = '} catch (e) {}\n    }\n  window.stageHasOpenOverlay';
  
  if (code.includes(restoreTarget)) {
    code = code.replace(restoreTarget, '} catch (e) {}\r\n    }\r\n  }\r\n  window.stageHasOpenOverlay');
  } else if (code.includes(restoreTarget2)) {
    code = code.replace(restoreTarget2, '} catch (e) {}\n    }\n  }\n  window.stageHasOpenOverlay');
  }

  fs.writeFileSync(filePath, code, 'utf8');
}

fixApp('apps/studio-web/public/stage-core/app.js');
