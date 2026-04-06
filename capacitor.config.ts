import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.coinpilot.app',
  appName: 'CoinPilot App',
  webDir: 'out',
  android: {
    allowMixedContent: true,
  },
  server: {
    url: 'https://new-financial-one.vercel.app',
    cleartext: true,
    androidScheme: 'https',
    allowNavigation: [
      'new-financial-one.vercel.app'
    ]
  },
  plugins: {
    CapacitorCookies: {
      enabled: true,
    },
  }
};

export default config;
