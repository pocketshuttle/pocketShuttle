import { Ionicons } from "@expo/vector-icons";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Animated, PanResponder, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useReducedMotion } from "../lib/motion";
import { colors, motion, radius, shadow } from "../theme";

type ToastVariant = "info" | "success" | "error";
type ToastState = { id: number; message: string; variant: ToastVariant };
type ToastApi = { show(message: string, options?: { variant?: ToastVariant; durationMs?: number }): void };

const ToastContext = createContext<ToastApi>({ show: () => undefined });

const icons: Record<ToastVariant, keyof typeof Ionicons.glyphMap> = {
  info: "information-circle",
  success: "checkmark-circle",
  error: "alert-circle",
};

/**
 * Sonner-style toast: slides in from the top with an ease-out, one at a time,
 * swipe up to dismiss, tap to dismiss. Transform/opacity only.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const progress = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();

  const hide = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    Animated.timing(progress, {
      toValue: 0,
      duration: reduced ? 0 : motion.base,
      easing: motion.easeOut,
      useNativeDriver: true,
    }).start(() => {
      setToast(null);
      dragY.setValue(0);
    });
  }, [dragY, progress, reduced]);

  const show = useCallback<ToastApi["show"]>(
    (message, options) => {
      if (timer.current) clearTimeout(timer.current);
      setToast({ id: Date.now(), message, variant: options?.variant ?? "info" });
      dragY.setValue(0);
      progress.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration: reduced ? 0 : motion.slow,
        easing: motion.easeOut,
        useNativeDriver: true,
      }).start();
      timer.current = setTimeout(hide, options?.durationMs ?? 3200);
    },
    [dragY, hide, progress, reduced]
  );

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 4,
      onPanResponderMove: (_, g) => dragY.setValue(Math.min(0, g.dy)),
      onPanResponderRelease: (_, g) => {
        if (g.dy < -24 || g.vy < -0.5) hide();
        else Animated.spring(dragY, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
      },
    })
  ).current;

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  const api = useMemo(() => ({ show }), [show]);
  const translateY = Animated.add(
    progress.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }),
    dragY
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="box-none"
          style={[styles.wrap, { top: insets.top + 10, opacity: progress, transform: [{ translateY }] }]}
        >
          <Animated.View
            {...pan.panHandlers}
            onTouchEnd={hide}
            accessibilityLiveRegion="polite"
            style={[styles.toast, toast.variant === "success" && styles.success, toast.variant === "error" && styles.error]}
          >
            <Ionicons name={icons[toast.variant]} size={18} color="#FFFFFF" />
            <Text style={styles.text}>{toast.message}</Text>
          </Animated.View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 16, right: 16, zIndex: 1000, elevation: 12 },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: radius.md,
    backgroundColor: colors.ink,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...shadow.floating,
  },
  success: { backgroundColor: colors.success },
  error: { backgroundColor: colors.danger },
  text: { flex: 1, color: "#FFFFFF", fontSize: 14, fontWeight: "600", lineHeight: 20 },
});

