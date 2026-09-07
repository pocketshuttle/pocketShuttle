import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ReactNode, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "../theme";

export const authColors = {
  primary: colors.primary,
  primaryDark: colors.primaryDark,
  tint: "#EEF2FF",
  ink: colors.ink,
  muted: colors.muted,
  border: colors.border,
  background: colors.background,
  danger: "#D9463F",
};

export function AuthScreen({
  title,
  subtitle,
  children,
  footer,
  onBack,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  onBack?(): void;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const back = onBack ?? (() => (router.canGoBack() ? router.back() : router.replace("/welcome")));
  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={back} style={styles.back}>
          <Ionicons name="chevron-back" size={22} color={authColors.ink} />
        </Pressable>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {children}
        <View style={{ flex: 1 }} />
        {footer}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function AuthField({
  label,
  error,
  secure,
  ...props
}: Omit<TextInputProps, "style" | "secureTextEntry"> & {
  label: string;
  error?: string | null;
  secure?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          placeholderTextColor={authColors.muted}
          secureTextEntry={secure && !show}
          autoCapitalize={secure ? "none" : props.autoCapitalize}
          {...props}
          style={[styles.input, secure && styles.inputWithIcon, error ? styles.inputError : null]}
        />
        {secure ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={show ? "Hide password" : "Show password"}
            onPress={() => setShow((value) => !value)}
            style={styles.eye}
          >
            <Ionicons name={show ? "eye-outline" : "eye-off-outline"} size={20} color={authColors.muted} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

export function AuthSegment<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange(value: T): void;
}) {
  return (
    <View style={styles.segment}>
      {options.map((item) => {
        const active = value === item.value;
        return (
          <Pressable
            key={item.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(item.value)}
            style={[styles.segmentItem, active && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function AuthButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress(): void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.submit, (disabled || pressed) && styles.submitDimmed]}
    >
      <Text style={styles.submitText}>{label}</Text>
    </Pressable>
  );
}

export const authStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 22 },
  link: { color: authColors.primary, fontSize: 14, fontWeight: "700" },
  linkDanger: { color: authColors.danger, fontSize: 14, fontWeight: "600" },
  error: { color: authColors.danger, fontSize: 13, lineHeight: 18, marginBottom: 12, textAlign: "center" },
  footer: { color: authColors.muted, fontSize: 14, textAlign: "center", marginTop: 28 },
  fine: { color: authColors.muted, fontSize: 12, lineHeight: 17, textAlign: "center", marginTop: 14 },
  sectionTitle: { color: authColors.ink, fontSize: 15, fontWeight: "800", marginTop: 6, marginBottom: 10 },
  success: { color: authColors.ink, fontSize: 15, lineHeight: 22, textAlign: "center", marginBottom: 20 },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: authColors.background },
  content: { flexGrow: 1, paddingHorizontal: 22 },
  back: {
    width: 52,
    height: 52,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: authColors.tint,
    marginBottom: 30,
  },
  title: { color: authColors.ink, fontSize: 30, fontWeight: "800", textAlign: "center" },
  subtitle: {
    color: authColors.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  segment: { flexDirection: "row", borderRadius: 999, backgroundColor: authColors.tint, padding: 4, marginBottom: 20 },
  segmentItem: { flex: 1, alignItems: "center", borderRadius: 999, paddingVertical: 13 },
  segmentActive: { backgroundColor: authColors.primary },
  segmentText: { color: authColors.ink, fontSize: 15, fontWeight: "600" },
  segmentTextActive: { color: "#FFFFFF", fontWeight: "700" },
  field: { marginBottom: 16 },
  label: { color: authColors.ink, fontSize: 13, fontWeight: "600", marginBottom: 8 },
  inputWrap: { position: "relative" },
  input: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: authColors.border,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    color: authColors.ink,
    paddingHorizontal: 18,
    fontSize: 16,
  },
  inputWithIcon: { paddingRight: 52 },
  inputError: { borderColor: authColors.danger },
  fieldError: { color: authColors.danger, fontSize: 13, lineHeight: 18, marginTop: 6 },
  eye: { position: "absolute", right: 14, top: 0, bottom: 0, justifyContent: "center", paddingHorizontal: 4 },
  submit: { height: 58, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: authColors.primary },
  submitDimmed: { opacity: 0.55, backgroundColor: authColors.primaryDark },
  submitText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});
