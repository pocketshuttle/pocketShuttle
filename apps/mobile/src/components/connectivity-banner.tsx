import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import * as Network from "expo-network";

import { flushMobileEventQueue, queuedMobileEventCount } from "../services/offline-queue";
import { colors } from "../theme";

export function ConnectivityBanner() {
  const [offline, setOffline] = useState(false);
  const [queued, setQueued] = useState(0);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      const state = await Network.getNetworkStateAsync();
      if (!mounted) return;
      const disconnected = state.isConnected === false;
      setOffline(disconnected);
      if (!disconnected) await flushMobileEventQueue();
      setQueued(await queuedMobileEventCount());
    };
    void check();
    const timer = setInterval(check, 8_000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  if (!offline && !queued) return null;
  return (
    <View style={[styles.banner, offline ? styles.offline : styles.syncing]}>
      <Text style={styles.text}>
        {offline
          ? `Offline · ${queued} safety update${queued === 1 ? "" : "s"} queued`
          : `Syncing ${queued} queued update${queued === 1 ? "" : "s"}…`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { paddingHorizontal: 14, paddingVertical: 8 },
  offline: { backgroundColor: "#FEF3C7" },
  syncing: { backgroundColor: "#DBEAFE" },
  text: {
    color: colors.ink,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "700",
  },
});
