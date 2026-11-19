import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "recharts",
      "radix-ui",
      "@tanstack/react-query",
      "fuse.js",
      "sonner",
      "clsx",
      "tailwind-merge",
      "zustand",
      "class-variance-authority",
      "@capacitor/core",
      "@capacitor/haptics",
      "@capacitor/status-bar",
      "@capacitor/app",
      "@capacitor/splash-screen",
    ],
  },
};

export default nextConfig;
