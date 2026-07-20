import fs from 'fs';

// 1. Fix LaunchAnimationEngine.tsx transition typings by adding "as const"
const enginePath = 'packages/ui-shared/src/components/launch/LaunchAnimationEngine.tsx';
let engineContent = fs.readFileSync(enginePath, 'utf8').replace(/\r\n/g, '\n');

const oldSprings = `  // Spring configurations
  const logoSpring = { type: 'spring', stiffness: 380, damping: 26 };
  const expansionSpring = { type: 'spring', stiffness: 120, damping: 18, mass: 0.8 };`;

const newSprings = `  // Spring configurations
  const logoSpring = { type: 'spring' as const, stiffness: 380, damping: 26 };
  const expansionSpring = { type: 'spring' as const, stiffness: 120, damping: 18, mass: 0.8 };`;

if (engineContent.includes(oldSprings)) {
  engineContent = engineContent.replace(oldSprings, newSprings);
  console.log("Updated LaunchAnimationEngine springs with 'as const' successfully!");
} else {
  console.log('Could not find oldSprings in LaunchAnimationEngine.tsx!');
}
fs.writeFileSync(enginePath, engineContent, 'utf8');

// 2. Modify App.tsx correctly (mount overlay inside App's return block)
const appPath = 'apps/studio-android/src/App.tsx';
let appContent = fs.readFileSync(appPath, 'utf8').replace(/\r\n/g, '\n');

// Import statement
const targetImport =
  "import { SubAppScaffold, ScreenScaffold, SharedNavigationContainer } from '@workspace/ui-shared';";
const replacementImport =
  "import { SubAppScaffold, ScreenScaffold, SharedNavigationContainer, LaunchAnimationEngine } from '@workspace/ui-shared';";

if (appContent.includes(targetImport) && !appContent.includes('LaunchAnimationEngine')) {
  appContent = appContent.replace(targetImport, replacementImport);
  console.log('Added LaunchAnimationEngine import in App.tsx!');
}

// State variable
const targetState = '  const isWebDesktop = useIsWebDesktop();';
const replacementState =
  '  const isWebDesktop = useIsWebDesktop();\n  const [showLaunchOverlay, setShowLaunchOverlay] = useState(true);';

if (appContent.includes(targetState) && !appContent.includes('showLaunchOverlay')) {
  appContent = appContent.replace(targetState, replacementState);
  console.log('Added showLaunchOverlay state in App.tsx!');
}

// Dismiss index.html intro instantly in useEffect
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

if (appContent.includes(targetMountEffect)) {
  appContent = appContent.replace(targetMountEffect, replacementMountEffect);
  console.log('Updated useEffect in App.tsx!');
}

// Render overlay before </div> ); at the end of App component return block
const targetAppReturnEnd =
  '      {exitToast && renderExitToast()}\n    </div>\n  );\n\n  function renderExitToast() {';
const replacementAppReturnEnd = `      {exitToast && renderExitToast()}

      {showLaunchOverlay && (
        <LaunchAnimationEngine
          preset={settings.launchAnimationPreset || 'fluid_surface'}
          onComplete={() => setShowLaunchOverlay(false)}
          isLight={settings.theme === 'light' || (settings.theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches)}
          isAmoled={settings.perApp?.hub?.amoledMode}
        />
      )}
    </div>
  );\n\n  function renderExitToast() {`;

if (appContent.includes(targetAppReturnEnd)) {
  appContent = appContent.replace(targetAppReturnEnd, replacementAppReturnEnd);
  console.log('Rendered LaunchAnimationEngine inside App component root return!');
} else {
  console.log('Could not find targetAppReturnEnd in App.tsx!');
}

fs.writeFileSync(appPath, appContent, 'utf8');
console.log('App correct modification completed!');
