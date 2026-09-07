import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";

import { ApiError, apiUpload } from "../api/client";
import { colors } from "../theme";
import { StatusPill } from "./ui";

/** Picks a photo (camera or library) and uploads it to /api/upload for the given purpose. */
export function DocumentPicker({
  label,
  hint,
  purpose,
  value,
  preview,
  onUploaded,
}: {
  label: string;
  hint?: string;
  purpose: string;
  value?: string;
  preview?: string;
  onUploaded(url: string, localUri: string): void;
}) {
  const [busy, setBusy] = useState(false);

  const upload = async (asset: ImagePicker.ImagePickerAsset) => {
    setBusy(true);
    try {
      const type = asset.mimeType && asset.mimeType.startsWith("image/") ? asset.mimeType : "image/jpeg";
      const name = asset.fileName || `${purpose}.${type === "image/png" ? "png" : "jpg"}`;
      const result = await apiUpload<{ url: string }>("/api/upload", { uri: asset.uri, name, type }, { purpose });
      onUploaded(result.url, asset.uri);
    } catch (error) {
      Alert.alert("Upload failed", error instanceof ApiError ? error.message : "Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const pick = async (source: "camera" | "library") => {
    const permission =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert("Permission needed", `Allow ${source === "camera" ? "camera" : "photo"} access to add this document.`);
      return;
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], quality: 0.8, allowsEditing: false };
    const result =
      source === "camera" ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled || !result.assets?.[0]) return;
    await upload(result.assets[0]);
  };

  const choose = () =>
    Alert.alert(label, purpose.endsWith("avatar") ? "Add a clear, well-lit photo of your face." : "Add a clear photo of the document.", [
      { text: "Take photo", onPress: () => void pick("camera") },
      { text: "Choose from library", onPress: () => void pick("library") },
      { text: "Cancel", style: "cancel" },
    ]);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        {value ? <StatusPill label="Uploaded" /> : null}
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      <Pressable accessibilityRole="button" disabled={busy} onPress={choose} style={[styles.box, value && styles.boxDone]}>
        {preview ? (
          <Image source={{ uri: preview }} style={styles.preview} resizeMode="cover" />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name={busy ? "cloud-upload-outline" : "camera-outline"} size={26} color={colors.primary} />
            <Text style={styles.placeholderText}>{busy ? "Uploading…" : value ? "Uploaded · tap to replace" : "Tap to add a photo"}</Text>
          </View>
        )}
        {preview ? (
          <View style={styles.overlay}>
            <Text style={styles.overlayText}>{busy ? "Uploading…" : "Tap to replace"}</Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  label: { color: colors.ink, fontSize: 13, fontWeight: "700" },
  hint: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  box: {
    height: 150,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  boxDone: { borderStyle: "solid", borderColor: colors.primary },
  placeholder: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  placeholderText: { color: colors.muted, fontSize: 13, fontWeight: "600" },
  preview: { width: "100%", height: "100%" },
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    paddingVertical: 6,
    alignItems: "center",
  },
  overlayText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
});
