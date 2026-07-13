import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.chordex.app',
  appName: 'Studio',
  webDir: '../../dist/android-web',
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
    },
  },
  server: {
    androidScheme: 'https',
  },
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: true,
      providers: ['google.com'],
    },
  },
};

export default config;
