import { describe, it, expect, vi, beforeEach } from 'vitest';
import { globalOtaState, transitionToState, updateGlobalState } from '../stateMachine';

// Mock localStorage
(global as any).localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn()
};
// Mock window
(global as any).window = {
  location: { href: '' },
  matchMedia: vi.fn().mockReturnValue({ matches: false }),
};
(global as any).document = {
  addEventListener: vi.fn(),
};

describe('Updater Bug Proof', () => {
  beforeEach(() => {
    transitionToState('IDLE', 'Reset');
    updateGlobalState({ updateAvailable: false, error: null });
  });

  it('should reproduce the Studio is up to date bug during PACKAGEINSTALLER_VISIBLE', async () => {
    console.log("=== STEP 1: INITIAL STATE ===");
    console.log(`Initial State: ${globalOtaState.updateState}`);

    console.log("\n=== STEP 2: SIMULATING SUCCESSFUL DOWNLOAD ===");
    transitionToState('INITIALIZING', 'Mock');
    transitionToState('FETCH_REMOTE_METADATA', 'Mock');
    transitionToState('VALIDATE_METADATA', 'Mock');
    transitionToState('COMPARE_VERSION', 'Mock');
    transitionToState('UPDATE_AVAILABLE', 'Mock');
    transitionToState('FETCH_APK_INFORMATION', 'Mock');
    transitionToState('DOWNLOAD_APK', 'Mock');
    transitionToState('VERIFY_SHA256', 'Mock');
    transitionToState('PREPARING_INSTALL', 'Mock');
    transitionToState('WAITING_USER_CONFIRMATION', 'Mock');
    
    console.log(`State is now: ${globalOtaState.updateState}`);
    expect(globalOtaState.updateState).toBe('WAITING_USER_CONFIRMATION');

    console.log("\n=== STEP 3: USER TAPS INSTALL -> PACKAGEINSTALLER_VISIBLE ===");
    transitionToState('PACKAGEINSTALLER_VISIBLE', 'Simulated applyUpdate start');
    
    console.log(`State is now: ${globalOtaState.updateState}`);
    expect(globalOtaState.updateState).toBe('PACKAGEINSTALLER_VISIBLE');

    console.log("\n=== STEP 4: BACKGROUND checkForUpdate FINISHES ===");
    // The background check finishes and attempts to set UPDATE_AVAILABLE
    // using safeTransition, which internally calls transitionToState.
    updateGlobalState({ updateAvailable: true });
    
    // Simulate safeTransition('COMPARE_VERSION', 'UPDATE_AVAILABLE')
    // Wait, safeTransition internally does: 
    // commitTransition('UPDATE_AVAILABLE', 'New update found', false)
    transitionToState('UPDATE_AVAILABLE', 'Simulated background check complete');
    
    console.log(`\nState after background check: ${globalOtaState.updateState}`);
    console.log(`updateAvailable after background check: ${globalOtaState.updateAvailable}`);
    
    if (globalOtaState.updateState === 'IDLE' && globalOtaState.updateAvailable === true) {
      console.log("\n[!!!] BUG PROVED: State is IDLE but updateAvailable is true, forcing 'Studio is up to date' UI [!!!]");
    } else {
      console.log("\n[?] Bug not reproduced.");
    }
    
    expect(globalOtaState.updateState).toBe('IDLE');
    expect(globalOtaState.updateAvailable).toBe(true);
  });
});

