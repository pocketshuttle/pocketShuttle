import * as WebBrowser from "expo-web-browser";
import { Linking } from "react-native";

import { colors } from "../theme";

/**
 * Opens a URL in the in-app browser (Custom Tabs on Android). Resolves when the
 * viewer dismisses it — not on payment success — so callers refetch afterwards.
 */
export async function openInAppBrowser(url: string) {
  try {
    await WebBrowser.openBrowserAsync(url, {
      toolbarColor: colors.surface,
      controlsColor: colors.primary,
      showTitle: true,
      enableBarCollapsing: true,
    });
  } catch {
    await Linking.openURL(url);
  }
}
