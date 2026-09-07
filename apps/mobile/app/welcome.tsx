import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  PanResponder,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MINT = "#3DEBA5";
const INK = "#181824";
const TRACK_HEIGHT = 68;
const KNOB = 58;
const KNOB_INSET = 5;

function Chevron({ delay }: { delay: number }) {
  const opacity = useRef(new Animated.Value(0.25)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, { toValue: 1, duration: 320, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.25, duration: 420, useNativeDriver: true }),
        Animated.delay(700 - delay),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [delay, opacity]);
  return (
    <Animated.View style={{ opacity }}>
      <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
    </Animated.View>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [trackWidth, setTrackWidth] = useState(0);
  const x = useRef(new Animated.Value(0)).current;
  const maxX = Math.max(0, trackWidth - KNOB - KNOB_INSET * 2);
  const maxRef = useRef(0);
  maxRef.current = maxX;
  const started = useRef(false);

  const start = () => {
    if (started.current) return;
    started.current = true;
    router.push("/login");
    setTimeout(() => {
      started.current = false;
      x.setValue(0);
    }, 600);
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 3,
      onPanResponderMove: (_, g) => {
        x.setValue(Math.min(Math.max(g.dx, 0), maxRef.current));
      },
      onPanResponderRelease: (_, g) => {
        const max = maxRef.current;
        if (max > 0 && g.dx >= max * 0.6) {
          Animated.timing(x, { toValue: max, duration: 140, useNativeDriver: true }).start(start);
        } else if (Math.abs(g.dx) < 6) {
          start();
        } else {
          Animated.spring(x, { toValue: 0, useNativeDriver: true, bounciness: 6 }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(x, { toValue: 0, useNativeDriver: true }).start();
      },
    })
  ).current;

  const labelOpacity = x.interpolate({
    inputRange: [0, Math.max(1, maxX * 0.7)],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const imageHeight = height * 0.9;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <Image
        source={require("../assets/welcome-map.png")}
        resizeMode="cover"
        style={[styles.map, { height: imageHeight }]}
      />
      <Image
        source={require("../assets/fade-bottom.png")}
        resizeMode="stretch"
        style={[styles.fade, { top: height * 0.5, height: height * 0.42 }]}
      />
      <View pointerEvents="none" style={[styles.solid, { top: height * 0.92 }]} />

      <View style={[styles.content, { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 22 }]}>
        <View style={styles.badge}>
          <Ionicons name="shield-checkmark" size={14} color={MINT} />
          <Text style={styles.badgeText}>Verified drivers · live tracking</Text>
        </View>

        <View style={{ flex: 1 }} />

        <Text style={styles.headline}>
          Safe rides{"\n"}
          <Text style={styles.headlineItalic}>for every child,</Text>
          {"\n"}every day
        </Text>
        <Text style={styles.sub}>
          Follow your child's journey in real time and ride only with drivers you trust.
        </Text>

        <View
          style={styles.track}
          onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
          accessibilityRole="button"
          accessibilityLabel="Swipe right to get started"
        >
          <Animated.View style={[styles.trackLabel, { opacity: labelOpacity }]}>
            <Text style={styles.ctaText}>Get Started</Text>
            <View style={styles.chevrons}>
              <Chevron delay={0} />
              <Chevron delay={180} />
              <Chevron delay={360} />
            </View>
          </Animated.View>
          <Animated.View
            {...pan.panHandlers}
            style={[styles.knob, { transform: [{ translateX: x }] }]}
          >
            <Ionicons name="checkmark" size={26} color={INK} />
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: INK },
  map: { position: "absolute", top: 0, left: 0, right: 0, width: "100%" },
  fade: { position: "absolute", left: 0, right: 0, width: "100%", pointerEvents: "none" },
  solid: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: INK },
  content: { flex: 1, paddingHorizontal: 24 },
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    backgroundColor: "rgba(24, 24, 36, 0.72)",
    borderWidth: 1,
    borderColor: "rgba(61, 235, 165, 0.35)",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  badgeText: { color: MINT, fontSize: 13, fontWeight: "700", fontStyle: "italic" },
  headline: { color: "#FFFFFF", fontSize: 40, lineHeight: 46, fontWeight: "800" },
  headlineItalic: { fontStyle: "italic", fontWeight: "600", color: MINT },
  sub: { color: "rgba(255,255,255,0.72)", fontSize: 15, lineHeight: 22, marginTop: 12, marginBottom: 26 },
  track: {
    height: TRACK_HEIGHT,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    justifyContent: "center",
  },
  trackLabel: {
    position: "absolute",
    left: KNOB + KNOB_INSET * 2 + 8,
    right: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ctaText: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },
  chevrons: { flexDirection: "row" },
  knob: {
    position: "absolute",
    left: KNOB_INSET,
    width: KNOB,
    height: KNOB,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
});
