import { Ionicons } from "@expo/vector-icons";
import { ReactNode, useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useEnterAnimation, usePressScale, useReducedMotion } from "../lib/motion";
import { colors, motion, radius, shadow, spacing } from "../theme";

export type IconName = keyof typeof Ionicons.glyphMap;

export function Screen({
  children,
  scroll = true,
}: {
  children: ReactNode;
  scroll?: boolean;
}) {
  const enter = useEnterAnimation();
  const content = <Animated.View style={[styles.content, enter]}>{children}</Animated.View>;
  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

export function Header({
  eyebrow,
  title,
  subtitle,
  right,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right ? <View style={styles.headerRight}>{right}</View> : null}
    </View>
  );
}

export function Card({
  children,
  style,
  tone = "default",
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  tone?: "default" | "warning" | "success" | "danger";
}) {
  return (
    <View
      style={[
        styles.card,
        tone === "warning" && styles.cardWarning,
        tone === "success" && styles.cardSuccess,
        tone === "danger" && styles.cardDanger,
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function AppButton({
  label,
  onPress,
  variant = "primary",
  disabled,
  icon,
}: {
  label: string;
  onPress(): void;
  variant?: "primary" | "outline" | "danger" | "success" | "ghost";
  disabled?: boolean;
  icon?: IconName;
}) {
  const press = usePressScale(disabled);
  const textColor =
    variant === "outline" || variant === "ghost" ? colors.ink : "#FFFFFF";
  return (
    <Animated.View style={press.style}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !!disabled }}
        disabled={disabled}
        onPress={onPress}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        style={[
          styles.button,
          variant === "outline" && styles.buttonOutline,
          variant === "ghost" && styles.buttonGhost,
          variant === "danger" && styles.buttonDanger,
          variant === "success" && styles.buttonSuccess,
          disabled && styles.buttonDisabled,
        ]}
      >
        {icon ? <Ionicons name={icon} size={18} color={textColor} style={styles.buttonIcon} /> : null}
        <Text style={[styles.buttonText, { color: textColor }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

export function StatusPill({
  label,
  danger,
  tone,
}: {
  label: string;
  danger?: boolean;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  const resolved = danger ? "danger" : tone ?? "neutral";
  return (
    <View
      style={[
        styles.pill,
        resolved === "danger" && styles.pillDanger,
        resolved === "success" && styles.pillSuccess,
        resolved === "warning" && styles.pillWarning,
      ]}
    >
      <Text
        style={[
          styles.pillText,
          resolved === "danger" && styles.pillDangerText,
          resolved === "success" && styles.pillSuccessText,
          resolved === "warning" && styles.pillWarningText,
        ]}
      >
        {label.replaceAll("_", " ")}
      </Text>
    </View>
  );
}

/** Pulsing placeholder block. */
export function Skeleton({ height = 14, width = "100%", style }: { height?: number; width?: number | `${number}%`; style?: StyleProp<ViewStyle> }) {
  const reduced = useReducedMotion();
  const pulse = useRef(new Animated.Value(0.55)).current;
  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, easing: motion.easeInOut, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.55, duration: 700, easing: motion.easeInOut, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, reduced]);
  return <Animated.View style={[styles.skeleton, { height, width, opacity: pulse }, style]} />;
}

export function LoadingState({ label = "Loading PocketShuttle…" }) {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.content} accessibilityLabel={label} accessibilityRole="progressbar">
        <Skeleton height={12} width="30%" />
        <Skeleton height={30} width="70%" />
        <Skeleton height={14} width="90%" />
        {[0, 1, 2].map((index) => (
          <View key={index} style={styles.card}>
            <Skeleton height={16} width="55%" />
            <Skeleton height={12} width="85%" />
            <Skeleton height={12} width="40%" />
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

export function EmptyState({
  title,
  message,
  icon = "sparkles-outline",
  action,
}: {
  title: string;
  message: string;
  icon?: IconName;
  action?: ReactNode;
}) {
  return (
    <Card style={styles.center}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={22} color={colors.primary} />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={[styles.subtitle, styles.centerText]}>{message}</Text>
      {action}
    </Card>
  );
}

export function FormField({
  label,
  error,
  hint,
  containerStyle,
  multiline,
  onFocus,
  onBlur,
  ...props
}: Omit<TextInputProps, "style"> & {
  label?: string;
  error?: string | null;
  hint?: string;
  containerStyle?: StyleProp<ViewStyle>;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.field, containerStyle]}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.muted}
        multiline={multiline}
        {...props}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          focused && styles.inputFocused,
          error ? styles.inputError : null,
        ]}
      />
      {error ? (
        <Text style={styles.fieldError}>{error}</Text>
      ) : hint ? (
        <Text style={styles.fieldHint}>{hint}</Text>
      ) : null}
    </View>
  );
}

export function ListRow({
  icon,
  title,
  subtitle,
  right,
  onPress,
  destructive,
}: {
  icon?: IconName;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onPress?(): void;
  destructive?: boolean;
}) {
  const press = usePressScale(!onPress);
  return (
    <Animated.View style={onPress ? press.style : undefined}>
      <Pressable
        accessibilityRole={onPress ? "button" : undefined}
        disabled={!onPress}
        onPress={onPress}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        style={({ pressed }) => [styles.row, pressed && onPress && styles.rowPressed]}
      >
        {icon ? (
          <View style={[styles.rowIcon, destructive && styles.rowIconDanger]}>
            <Ionicons name={icon} size={18} color={destructive ? colors.danger : colors.primary} />
          </View>
        ) : null}
        <View style={styles.rowBody}>
          <Text style={[styles.rowTitle, destructive && styles.rowTitleDanger]}>{title}</Text>
          {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
        </View>
        {right ?? (onPress ? <Ionicons name="chevron-forward" size={18} color={colors.muted} /> : null)}
      </Pressable>
    </Animated.View>
  );
}

export type ChipOption<T extends string> = { value: T; label: string };

type ChipsProps<T extends string> = { options: ChipOption<T>[] } & (
  | { multiple: true; value: T[]; onChange(values: T[]): void }
  | { multiple?: false; value: T | null; onChange(value: T): void }
);

export function Chips<T extends string>(props: ChipsProps<T>) {
  const isActive = (value: T) => (props.multiple ? props.value.includes(value) : props.value === value);
  const toggle = (value: T) => {
    if (props.multiple) {
      props.onChange(
        props.value.includes(value) ? props.value.filter((item) => item !== value) : [...props.value, value]
      );
    } else {
      props.onChange(value);
    }
  };
  return (
    <View style={styles.chips}>
      {props.options.map((option) => {
        const active = isActive(option.value);
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => toggle(option.value)}
            style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.chipPressed]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export const textStyles = StyleSheet.create({
  cardTitle: { color: colors.ink, fontSize: 17, fontWeight: "700", letterSpacing: -0.2 },
  body: { color: colors.ink, fontSize: 15, lineHeight: 22 },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 19 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1 },
  content: { flex: 1, gap: spacing.lg, padding: spacing.xl, paddingBottom: spacing.xxxl + spacing.sm },
  header: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md, marginBottom: spacing.xs },
  headerText: { flex: 1, gap: spacing.xs },
  headerRight: { paddingTop: spacing.xs },
  eyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: { color: colors.ink, fontSize: 28, lineHeight: 34, fontWeight: "800", letterSpacing: -0.6 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  centerText: { textAlign: "center" },
  card: {
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    ...shadow.card,
  },
  cardWarning: { borderColor: "#FDE68A", backgroundColor: colors.warningSoft },
  cardSuccess: { borderColor: "#A7F3D0", backgroundColor: colors.successSoft },
  cardDanger: { borderColor: "#FECACA", backgroundColor: colors.dangerSoft },
  button: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
  },
  buttonOutline: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  buttonGhost: { backgroundColor: "transparent" },
  buttonDanger: { backgroundColor: colors.danger },
  buttonSuccess: { backgroundColor: colors.success },
  buttonDisabled: { opacity: 0.5 },
  buttonIcon: { marginRight: spacing.sm },
  buttonText: { fontSize: 15, fontWeight: "700", letterSpacing: -0.1 },
  pill: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pillDanger: { backgroundColor: colors.dangerSoft },
  pillSuccess: { backgroundColor: colors.successSoft },
  pillWarning: { backgroundColor: colors.warningSoft },
  pillText: { color: colors.primaryDark, fontSize: 11, fontWeight: "800", letterSpacing: 0.4, textTransform: "uppercase" },
  pillDangerText: { color: colors.danger },
  pillSuccessText: { color: colors.success },
  pillWarningText: { color: colors.warning },
  skeleton: { borderRadius: radius.sm, backgroundColor: "#E2E8F0" },
  center: { alignItems: "center", justifyContent: "center", gap: spacing.sm, padding: spacing.xxl },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
    marginBottom: spacing.xs,
  },
  cardTitle: { color: colors.ink, fontSize: 17, fontWeight: "700", letterSpacing: -0.2 },
  field: { gap: 6 },
  fieldLabel: { color: colors.ink, fontSize: 13, fontWeight: "700" },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    color: colors.ink,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputMultiline: { minHeight: 110, textAlignVertical: "top" },
  inputFocused: { borderColor: colors.primary },
  inputError: { borderColor: colors.danger },
  fieldError: { color: colors.danger, fontSize: 13, lineHeight: 18 },
  fieldHint: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, minHeight: 56, paddingVertical: 10 },
  rowPressed: { opacity: 0.7 },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
  },
  rowIconDanger: { backgroundColor: colors.dangerSoft },
  rowBody: { flex: 1, gap: 2 },
  rowTitle: { color: colors.ink, fontSize: 15, fontWeight: "700", letterSpacing: -0.1 },
  rowTitleDanger: { color: colors.danger },
  rowSubtitle: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  chipPressed: { opacity: 0.8 },
  chipText: { color: colors.ink, fontSize: 14, fontWeight: "600" },
  chipTextActive: { color: "#FFFFFF" },
  sectionTitle: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: spacing.xs,
  },
});
