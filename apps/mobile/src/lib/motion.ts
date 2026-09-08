import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated } from "react-native";

import { motion } from "../theme";

let reduceMotionCache: boolean | null = null;

/** Mirrors the OS "reduce motion" setting; animations should become instant when true. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(reduceMotionCache ?? false);
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      reduceMotionCache = value;
      if (active) setReduced(value);
    });
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", (value) => {
      reduceMotionCache = value;
      setReduced(value);
    });
    return () => {
      active = false;
      sub.remove();
    };
  }, []);
  return reduced;
}

/** Fade + 6px rise on mount. Cheap, transform/opacity only, skipped under reduce-motion. */
export function useEnterAnimation(delay = 0) {
  const reduced = useReducedMotion();
  const progress = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  useEffect(() => {
    if (reduced) {
      progress.setValue(1);
      return;
    }
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: motion.slow,
      delay,
      easing: motion.easeOut,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [delay, progress, reduced]);
  return {
    opacity: progress,
    transform: [
      {
        translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }),
      },
    ],
  };
}

/** Press feedback: scale to 0.97 on press-in, back on release. Returns animated style + handlers. */
export function usePressScale(disabled?: boolean) {
  const reduced = useReducedMotion();
  const scale = useRef(new Animated.Value(1)).current;
  const to = (value: number) =>
    Animated.timing(scale, {
      toValue: value,
      duration: motion.fast,
      easing: motion.easeOut,
      useNativeDriver: true,
    }).start();
  return {
    style: { transform: [{ scale }] },
    onPressIn: () => {
      if (!disabled && !reduced) to(motion.pressScale);
    },
    onPressOut: () => {
      if (!reduced) to(1);
    },
  };
}
