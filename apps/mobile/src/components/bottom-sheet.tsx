import { ReactNode, useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useReducedMotion } from "../lib/motion";
import { colors, motion, radius, spacing } from "../theme";

/**
 * Vaul-style sheet: backdrop fades, sheet slides up with an ease-out, drag the
 * handle to dismiss (interruptible, springs back if you let go early).
 */
export function BottomSheet({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose(): void;
  title?: string;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(visible);
  const progress = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const closing = useRef(false);

  const animateTo = (value: number, done?: () => void) =>
    Animated.timing(progress, {
      toValue: value,
      duration: reduced ? 0 : value ? motion.slow : motion.base,
      easing: motion.easeOut,
      useNativeDriver: true,
    }).start(done);

  useEffect(() => {
    if (visible) {
      closing.current = false;
      setMounted(true);
      dragY.setValue(0);
      progress.setValue(0);
      requestAnimationFrame(() => animateTo(1));
    } else if (mounted) {
      animateTo(0, () => setMounted(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const dismiss = () => {
    if (closing.current) return;
    closing.current = true;
    animateTo(0, () => {
      setMounted(false);
      onClose();
    });
  };

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 4 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => dragY.setValue(Math.max(0, g.dy)),
      onPanResponderRelease: (_, g) => {
        if (g.dy > 120 || g.vy > 0.8) dismiss();
        else Animated.spring(dragY, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
      },
    })
  ).current;

  if (!mounted) return null;

  const translateY = Animated.add(
    progress.interpolate({ inputRange: [0, 1], outputRange: [height, 0] }),
    dragY
  );

  return (
    <Modal visible transparent animationType="none" onRequestClose={dismiss} statusBarTranslucent>
      <View style={styles.wrap}>
        <Animated.View style={[styles.backdrop, { opacity: progress }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" style={StyleSheet.absoluteFill} onPress={dismiss} />
        </Animated.View>
        <Animated.View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg, transform: [{ translateY }] }]}>
          <View {...pan.panHandlers} style={styles.grab}>
            <View style={styles.handle} />
            {title ? <Text style={styles.title}>{title}</Text> : null}
          </View>
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" bounces={false}>
            {children}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: "flex-end" },
  backdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.5)" },
  sheet: {
    maxHeight: "88%",
    borderTopLeftRadius: radius.xl + 4,
    borderTopRightRadius: radius.xl + 4,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xl,
  },
  grab: { paddingTop: 10, paddingBottom: spacing.sm, gap: spacing.md },
  handle: { alignSelf: "center", width: 40, height: 5, borderRadius: radius.pill, backgroundColor: colors.border },
  title: { color: colors.ink, fontSize: 20, fontWeight: "800", letterSpacing: -0.4 },
  body: { gap: spacing.md, paddingBottom: spacing.sm },
});
