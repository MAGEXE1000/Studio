import fs from 'fs';

const filePath = 'apps/studio-android/src/App.tsx';
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

// 1. Add LaunchAnimationEngine to import statement
const targetImport =
  "import { SubAppScaffold, ScreenScaffold, SharedNavigationContainer } from '@workspace/ui-shared';";
const replacementImport =
  "import { SubAppScaffold, ScreenScaffold, SharedNavigationContainer, LaunchAnimationEngine } from '@workspace/ui-shared';";

if (content.includes(targetImport) && !content.includes('LaunchAnimationEngine')) {
  content = content.replace(targetImport, replacementImport);
  console.log('Added LaunchAnimationEngine to import in App.tsx!');
}

// 2. Add state variable
const targetState = '  const isWebDesktop = useIsWebDesktop();';
const replacementState =
  '  const isWebDesktop = useIsWebDesktop();\n  const [showLaunchOverlay, setShowLaunchOverlay] = useState(true);';

if (content.includes(targetState) && !content.includes('showLaunchOverlay')) {
  content = content.replace(targetState, replacementState);
  console.log('Added showLaunchOverlay state variable in App.tsx!');
}

// 3. Update mount useEffect to instantly dismiss vanilla intro
const targetMountEffect = `  useEffect(() => {
    // Force app mode classes on mount
    document.documentElement.classList.add('app-route');
    document.documentElement.classList.remove('landing-route');
    
    const intro = document.getElementById('intro');
    if (intro && (window as any).__introReturnedEarly) {
      intro.style.transition = 'opacity 500ms ease-out';
      intro.style.opacity = '0';
      setTimeout(() => {
        intro.classList.add('dismissed');
        if (intro.parentNode) intro.parentNode.removeChild(intro);
      }, 550);
      (window as any).__introDone = true;
      window.dispatchEvent(new Event('studio-intro-done'));
    }
  }, []);`;

const replacementMountEffect = `  useEffect(() => {
    // Force app mode classes on mount
    document.documentElement.classList.add('app-route');
    document.documentElement.classList.remove('landing-route');
    
    // Dismiss index.html vanilla splash instantly to let React LaunchAnimationEngine take over
    const intro = document.getElementById('intro');
    if (intro) {
      intro.style.display = 'none';
      if (intro.parentNode) intro.parentNode.removeChild(intro);
      (window as any).__introDone = true;
      window.dispatchEvent(new Event('studio-intro-done'));
    }
  }, []);`;

if (content.includes(targetMountEffect)) {
  content = content.replace(targetMountEffect, replacementMountEffect);
  console.log('Updated mount useEffect in App.tsx!');
}

// 4. Render LaunchAnimationEngine at the end of the return statement
const targetReturnEnd = '      )}\n    </>\n  );\n});';
const replacementReturnEnd = `      )}

      {showLaunchOverlay && (
        <LaunchAnimationEngine
          preset={settings.launchAnimationPreset || 'fluid_surface'}
          onComplete={() => setShowLaunchOverlay(false)}
          isLight={settings.theme === 'light' || (settings.theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches)}
          isAmoled={settings.perApp?.hub?.amoledMode}
        />
      )}
    </>
  );
});`;

if (content.includes(targetReturnEnd)) {
  content = content.replace(targetReturnEnd, replacementReturnEnd);
  console.log('Rendered LaunchAnimationEngine at the end of App.tsx return!');
} else {
  console.log('Could not find exact end of App.tsx return, attempting fallback...');
  const fallbackTarget = '      )}\n    </>\n  );\n';
  const index = content.lastIndexOf(fallbackTarget);
  if (index !== -1) {
    const fullBlock = content.substring(index, index + fallbackTarget.length);
    const replacementBlock = `      )}

      {showLaunchOverlay && (
        <LaunchAnimationEngine
          preset={settings.launchAnimationPreset || 'fluid_surface'}
          onComplete={() => setShowLaunchOverlay(false)}
          isLight={settings.theme === 'light' || (settings.theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches)}
          isAmoled={settings.perApp?.hub?.amoledMode}
        />
      )}
    </>\n  );\n`;
    content = content.replace(fullBlock, replacementBlock);
    console.log(
      'Rendered LaunchAnimationEngine at the end of App.tsx return successfully (fallback match)!'
    );
  }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('App.tsx modification script complete!');
