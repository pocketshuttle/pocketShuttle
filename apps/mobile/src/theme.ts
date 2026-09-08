import { Easing } from "react-native";

export const colors = {
  primary: "#4A48FF",
  primaryDark: "#312E81",
  primarySoft: "#EEF2FF",
  ink: "#0F172A",
  inkSoft: "#334155",
  muted: "#64748B",
  border: "#E6EAF2",
  surface: "#FFFFFF",
  surfaceMuted: "#F5F7FB",
  background: "#F5F7FB",
  success: "#059669",
  successSoft: "#ECFDF5",
  warning: "#D97706",
  warningSoft: "#FFFBEB",
  danger: "#DC2626",
  dangerSoft: "#FEF2F2",
};

/** 4-pt spacing scale. */
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 } as const;

export const radius = { sm: 10, md: 14, lg: 20, xl: 24, pill: 999 } as const;

/**
 * Motion tokens. Short, ease-out, transform/opacity only — animations should feel
 * like a response to the user's touch, never something they wait for.
 */
export const motion = {
  fast: 120,
  base: 180,
  slow: 260,
  easeOut: Easing.out(Easing.cubic),
  easeInOut: Easing.inOut(Easing.cubic),
  pressScale: 0.97,
} as const;

export const shadow = {
  card: {
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  floating: {
    shadowColor: "#0F172A",
    shadowOpacity: 0.16,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
} as const;
