import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import { Platform, type ColorValue } from "react-native";

import { colors } from "../theme";

type TabScreenOptions = ComponentProps<typeof Tabs.Screen>["options"];

export const tabScreenOptions: TabScreenOptions = {
  headerShown: false,
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.muted,
  tabBarHideOnKeyboard: true,
  tabBarLabelStyle: { fontSize: 11, fontWeight: "700", letterSpacing: 0.1 },
  tabBarStyle: {
    height: Platform.OS === "ios" ? 84 : 68,
    paddingBottom: Platform.OS === "ios" ? 24 : 10,
    paddingTop: 8,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    elevation: 0,
  },
};

/** Outline icon when idle, filled when focused — the state change is the animation. */
export function tabOptions(
  title: string,
  icon: keyof typeof Ionicons.glyphMap
): TabScreenOptions {
  const filled = icon.replace(/-outline$/, "") as keyof typeof Ionicons.glyphMap;
  return {
    title,
    tabBarIcon: ({ color, size, focused }: { color: ColorValue; size: number; focused: boolean }) => (
      <Ionicons name={focused && filled in Ionicons.glyphMap ? filled : icon} color={color} size={size} />
    ),
  };
}
