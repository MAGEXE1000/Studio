export async function clearSubscriptions(provider: any): Promise<void> {
  // Clear active subscriptions
}

export function startPeriodicRefetch(provider: any, userId: string): void {
  // Periodic refetch handler
}

export async function refetchAllData(provider: any, userId: string, source: string): Promise<void> {
  // Refetch all data handler
}

export function setupRealtimeAndPresence(provider: any, userId: string): void {
  // Setup realtime listeners
}

export function subscribeSyncProbe(provider: any, callback: (probe: any) => void): () => void {
  return () => {};
}

export function subscribeDevices(provider: any, callback: (devices: any[]) => void): () => void {
  return () => {};
}

export async function getProfile(provider: any): Promise<any> {
  return null;
}

export function subscribeProfile(provider: any, callback: (profile: any) => void): () => void {
  return () => {};
}

export async function getAppearanceSettings(provider: any): Promise<any> {
  return null;
}

export function subscribeAppearanceSettings(provider: any, callback: (settings: any) => void): () => void {
  return () => {};
}

export async function getPreferences(provider: any): Promise<any> {
  return null;
}

export function subscribePreferences(provider: any, callback: (prefs: any) => void): () => void {
  return () => {};
}

export function subscribeDiagnostics(provider: any, callback: (diag: any) => void): () => void {
  return () => {};
}
