/**
 * updater/sessionStorage.ts
 *
 * localStorage / sessionStorage utilities and native version queries
 * used throughout the OTA updater pipeline.
 *
 * Exports: getStoredList, addToStoredList, removeFromStoredList,
 *          getSessionItem, setSessionItem, removeSessionItem,
 *          getNativeVersion, getNativeVersionCode
 */

import { isNative } from '../capgoUpdater';
import { releaseMetadataInspector } from './versionLogger';

export function getStoredList(key: string): string[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function addToStoredList(key: string, val: string): void {
  try {
    const list = getStoredList(key);
    if (!list.includes(val)) {
      list.push(val);
      localStorage.setItem(key, JSON.stringify(list));
    }
  } catch {
    /* ignore */
  }
}

export function removeFromStoredList(key: string, val: string): void {
  try {
    const list = getStoredList(key);
    const filtered = list.filter((v) => v !== val);
    localStorage.setItem(key, JSON.stringify(filtered));
  } catch {
    /* ignore */
  }
}

export function getSessionItem(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function setSessionItem(key: string, val: string): void {
  try {
    sessionStorage.setItem(key, val);
  } catch {
    /* ignore */
  }
}

export function removeSessionItem(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export async function getNativeVersion(): Promise<string | null> {
  if (!isNative()) return null;
  try {
    const { AppInstaller } = await import('../apkDownloader');
    const info = await AppInstaller.getInstalledAppInfo();
    releaseMetadataInspector.rawVersionName = info.versionName;
    return info.versionName;
  } catch (e) {
    console.warn('[OTA] Failed to query native app version:', e);
    return null;
  }
}

export async function getNativeVersionCode(): Promise<number | null> {
  if (!isNative()) return null;
  try {
    const { AppInstaller } = await import('../apkDownloader');
    const info = await AppInstaller.getInstalledAppInfo();
    return info.versionCode;
  } catch (e) {
    console.warn('[OTA] Failed to query native app version code:', e);
    return null;
  }
}
