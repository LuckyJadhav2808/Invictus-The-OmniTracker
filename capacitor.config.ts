import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.invictus.omnitracker",
  appName: "Invictus",
  webDir: "public",
  server: {
    // Points directly to live production Next.js backend with dynamic SSR & API endpoints
    url: "https://invictus-the-omni-tracker.vercel.app",
    cleartext: true,
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_icon",
      iconColor: "#CEF431",
      sound: "beep.wav",
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#161514",
      showSpinner: false,
    },
    StatusBar: {
      backgroundColor: "#161514",
      style: "DARK",
    },
  },
};

export default config;
