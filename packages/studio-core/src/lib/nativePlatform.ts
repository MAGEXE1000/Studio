import { Capacitor } from '@capacitor/core';

export const isNative = () => Capacitor.isNativePlatform();
export const shouldUseAndroidApkUpdater = () => Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
