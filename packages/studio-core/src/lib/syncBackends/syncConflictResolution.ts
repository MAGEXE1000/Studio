import type { DeviceWriteResult, HeartbeatResult } from './types';

export async function registerCurrentDevice(provider: any, reason: string): Promise<DeviceWriteResult> {
  return { success: true };
}

export async function heartbeatNow(provider: any, reason: string): Promise<HeartbeatResult> {
  return { success: true };
}

export async function updateProfile(provider: any, patch: any): Promise<void> {
  // Update profile handler
}

export async function updateAppearanceSettings(provider: any, patch: any): Promise<void> {
  // Update appearance settings handler
}

export async function updatePreferences(provider: any, patch: any): Promise<void> {
  // Update preferences handler
}
