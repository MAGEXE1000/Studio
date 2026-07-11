import { AppInstaller } from '../apkDownloader';

export async function triggerNativeInstall(filePath: string): Promise<any> {
  if (filePath.includes('mock') || filePath.includes('simulated') || (typeof localStorage !== 'undefined' && localStorage.getItem('studio:is_simulation_active') === 'true')) {
    console.warn('[PackageInstaller] Rejecting native install for mock/simulated path:', filePath);
    throw new Error('[Simulation Guard] Blocked native install for simulated path');
  }
  try {
    const res = await AppInstaller.installApk({ filePath });
    return res;
  } catch (err: any) {
    throw new Error('[PackageInstaller] ' + (err.message || String(err)));
  }
}

export interface LastInstallResult {
  statusCode: number;
  statusMessage?: string;
  packageName?: string;
  timestamp?: number;
}

export interface ProcessedInstallResult {
  category: 'signature_mismatch' | 'versionCode_low' | 'cancelled' | 'failed';
  errMsg: string;
}

export function processLastInstallResult(result: LastInstallResult | null): ProcessedInstallResult | null {
  if (!result || result.statusCode === -999 || result.statusCode === 0) {
    return null;
  }

  let errMsg = `[PackageInstaller] ${result.statusMessage || `PackageInstaller error: status ${result.statusCode}`}`;
  let category: 'signature_mismatch' | 'versionCode_low' | 'cancelled' | 'failed' = 'failed';
  
  if (result.statusCode === 3) {
    category = 'cancelled';
    errMsg = '[User Cancelled] User cancelled the installation';
  } else if (result.statusCode === 5) {
    category = 'signature_mismatch';
    errMsg = '[Conflicting Package / Signature Mismatch] Signature mismatch or conflicting package name. Uninstalling the old app and installing the new one might be required.';
  } else if (result.statusCode === 7) {
    category = 'versionCode_low';
    errMsg = '[Version Downgrade Blocked] Version downgrade is not allowed by the system.';
  } else if (result.statusCode === 6) {
    category = 'failed';
    errMsg = '[Insufficient Storage] Installation failed due to insufficient storage space.';
  } else if (result.statusCode === 2) {
    category = 'failed';
    errMsg = '[Installation Blocked by Policy] Installation blocked by administrator policy or system settings.';
  }

  return {
    category,
    errMsg,
  };
}
