import { describe, it, expect, vi, beforeEach } from 'vitest';
import { globalUpdateState, transitionToState, updateGlobalState } from '../stateMachine';
import { StartupCoordinator } from '../../startup/startupCoordinator';
import { useChordStore } from '../../chordStore';

// Mock chordStore
vi.mock('../../chordStore', () => ({
  useChordStore: {
    getState: () => ({
      settings: { autoCheckUpdates: true }
    })
  }
}));

describe('Updater Scheduler Proof', () => {
  beforeEach(() => {
    transitionToState('IDLE', 'Reset');
    updateGlobalState({ updateAvailable: false, error: null });
  });

  it('should completely suppress lifecycle events during active installation', async () => {
    const coordinator = StartupCoordinator;
    // Force complete so lifecycle events are processed instead of queued for boot
    (coordinator as any).isCompleted = true;
    
    // Spy on the internal pending array
    const pendingEvents = (coordinator as any).pendingLifecycleEvents;
    
    console.log("=== STEP 1: INITIAL STATE (IDLE) ===");
    console.log(`Initial State: ${globalUpdateState.updateState}`);
    
    // Simulate a visibilitychange event (e.g. user minimizing app)
    (coordinator as any).handleLifecycleEvent('visibilitychange', 'test_trigger', 'User minimized');
    
    console.log(`Events queued when IDLE: ${pendingEvents.length}`);
    expect(pendingEvents.length).toBe(1); // It should queue the event
    
    // Clear queue
    pendingEvents.length = 0;
    
    console.log("\n=== STEP 2: SIMULATING ACTIVE INSTALLATION ===");
    // Simulate transition to an active install state
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
    transitionToState('PACKAGEINSTALLER_VISIBLE', 'Mock');
    
    console.log(`State is now: ${globalUpdateState.updateState}`);
    
    console.log("\n=== STEP 3: SIMULATING LIFECYCLE EVENT DURING INSTALL ===");
    // Simulate the appStateChange event that occurs when the PackageInstaller dialog appears
    (coordinator as any).handleLifecycleEvent('appStateChange', 'lifecycle_appstate', 'native app active (mock)');
    
    console.log(`Events queued when PACKAGEINSTALLER_VISIBLE: ${pendingEvents.length}`);
    
    if (pendingEvents.length === 0) {
      console.log("\n[!!!] SCHEDULER PROVED: Lifecycle event was completely suppressed at the source! [!!!]");
    } else {
      console.log("\n[?] Bug: Scheduler still queued the event.");
    }
    
    expect(pendingEvents.length).toBe(0); // MUST BE 0!
  });
});
