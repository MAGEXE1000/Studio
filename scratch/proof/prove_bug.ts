import { globalUpdateState, transitionToState, updateGlobalState, stateListeners } from '../../packages/studio-core/src/lib/updater/stateMachine';
import { checkForUpdate } from '../../packages/studio-core/src/lib/updater/pipeline';

async function runProof() {
  console.log("=== STEP 1: INITIAL STATE ===");
  console.log(`Initial State: ${globalUpdateState.updateState}`);
  
  // Attach a listener to see all state changes
  stateListeners.add((state) => {
    console.log(`[STATE CHANGE] updateState: ${state.updateState} | updateAvailable: ${state.updateAvailable}`);
  });

  console.log("\n=== STEP 2: SIMULATING SUCCESSFUL DOWNLOAD ===");
  // Simulate the downloader finishing and transitioning to WAITING_USER_CONFIRMATION
  transitionToState('WAITING_USER_CONFIRMATION', 'Simulated download complete');

  console.log("\n=== STEP 3: USER TAPS INSTALL -> PACKAGEINSTALLER_VISIBLE ===");
  transitionToState('PACKAGEINSTALLER_VISIBLE', 'Simulated applyUpdate start');

  console.log("\n=== STEP 4: PACKAGEINSTALLER DIALOG APPEARS -> BACKGROUND RESUME TRIGGERS checkForUpdate() ===");
  // Trigger checkForUpdate just like the debounce in startupCoordinator would
  // We mock a remote response by passing true to isManual to force check
  
  // Actually, we don't need to mock network, we can just observe what checkForUpdate does
  // But wait, checkForUpdate relies on network.
  // Instead of a full network test, let's just observe what safeTransition('COMPARE_VERSION', 'UPDATE_AVAILABLE') does
  // since that's the exact line that causes the crash.
  
  console.log("\n=== STEP 5: checkForUpdate() FINISHES AND CALLS safeTransition() ===");
  
  // Simulate the end of checkForUpdate() where it finds an update
  updateGlobalState({ updateAvailable: true }); 
  
  // Call the internal safeTransition logic manually to prove the exact branch taken
  const { safeTransition } = await import('../../packages/studio-core/src/lib/updater/stateMachine');
  
  const result = safeTransition('COMPARE_VERSION', 'UPDATE_AVAILABLE', 'Simulated background check complete');
  
  console.log(`\nsafeTransition result: ${result}`);
  
  console.log("\n=== FINAL STATE ===");
  console.log(`updateState: ${globalUpdateState.updateState}`);
  console.log(`updateAvailable: ${globalUpdateState.updateAvailable}`);
  
  if (globalUpdateState.updateState === 'IDLE' && globalUpdateState.updateAvailable === true) {
    console.log("\n[!!!] BUG PROVED: State is IDLE but updateAvailable is true, which forces 'Studio is up to date' UI [!!!]");
  } else {
    console.log("\n[?] Bug not reproduced. Something else is happening.");
  }
}

runProof().catch(console.error);
