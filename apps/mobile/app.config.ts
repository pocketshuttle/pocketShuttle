import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "PocketShuttle",
  slug: "pocketshuttle",
  scheme: "pocketshuttle",
  version: "0.1.0",
  orientation: "portrait",
  icon: "../../public/icon-512x512.png",
  userInterfaceStyle: "light",
  android: {
    package: "com.pocketshuttle.app",
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: "../../public/icon-512x512.png",
      backgroundColor: "#4A48FF",
    },
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY || "",
      },
    },
    permissions: [
      "ACCESS_COARSE_LOCATION",
      "ACCESS_FINE_LOCATION",
      "ACCESS_BACKGROUND_LOCATION",
      "FOREGROUND_SERVICE",
      "FOREGROUND_SERVICE_LOCATION",
      "POST_NOTIFICATIONS",
    ],
  },
  plugins: [
    [
      "onesignal-expo-plugin",
      {
        mode:
          process.env.EAS_BUILD_PROFILE === "production"
            ? "production"
            : "development",
      },
    ],
    "expo-router",
    "expo-secure-store",
    "expo-font",
    "expo-sqlite",
    [
      "expo-splash-screen",
      {
        image: "../../public/icon-512x512.png",
        imageWidth: 180,
        resizeMode: "contain",
        backgroundColor: "#F5F7FB",
      },
    ],
    [
      "expo-location",
      {
        locationAlwaysAndWhenInUsePermission:
          "PocketShuttle uses your location only during an active trip to keep authorized families and school staff informed.",
        isAndroidBackgroundLocationEnabled: true,
        isAndroidForegroundServiceEnabled: true,
      },
    ],
  ],
  experiments: {
    typedRoutes: false,
  },
  extra: {
    eas: {
      projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID || "",
    },
  },
};

export default config;
