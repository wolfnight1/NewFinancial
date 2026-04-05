import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.coinpilot.app',
  appName: 'CoinPilot App',
  webDir: 'out',
  server: {
    url: 'https://personal-financial-ten.vercel.app',
    cleartext: true
  }
};

export default config;
