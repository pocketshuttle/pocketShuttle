import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Text } from "react-native";

import { ApiError, apiRequest } from "../src/api/client";
import {
  AuthButton,
  AuthField,
  AuthScreen,
  AuthSegment,
  authStyles,
} from "../src/components/auth-form";
import { E164_PATTERN } from "../src/lib/child-place-label";

type Role = "parent" | "driver";

type Form = {
  full_name: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirm: string;
  address: string;
  serviceAreas: string;
  carMake: string;
  carModel: string;
  carColor: string;
  plateNumber: string;
  vehicleCapacity: string;
};

const empty: Form = {
  full_name: "",
  email: "",
  phoneNumber: "",
  password: "",
  confirm: "",
  address: "",
  serviceAreas: "",
  carMake: "",
  carModel: "",
  carColor: "",
  plateNumber: "",
  vehicleCapacity: "",
};

export default function RegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ invite?: string; role?: string }>();
  const [role, setRole] = useState<Role>(params.role === "driver" || params.invite ? "driver" : "parent");
  const [form, setForm] = useState<Form>(empty);
  const [touched, setTouched] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const set = (key: keyof Form) => (value: string) => setForm((current) => ({ ...current, [key]: value }));

  const problems: Record<string, string> = {};
  if (form.full_name.trim().length < 2) problems.full_name = "Enter your full name.";
  if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) problems.email = "Enter a valid email.";
  if (!E164_PATTERN.test(form.phoneNumber.trim())) problems.phoneNumber = "Use the format +2348012345678.";
  if (form.password.length < 6) problems.password = "Password must be at least 6 characters.";
  if (form.confirm !== form.password) problems.confirm = "Passwords do not match.";
  if (form.address.trim().length < 5) problems.address = "Enter your address.";
  if (role === "driver") {
    if (!form.serviceAreas.trim()) problems.serviceAreas = "Add at least one area, separated by commas.";
    for (const key of ["carMake", "carModel", "carColor", "plateNumber"] as const) {
      if (!form[key].trim()) problems[key] = "Required.";
    }
    const capacity = Number.parseInt(form.vehicleCapacity, 10);
    if (!Number.isFinite(capacity) || capacity < 1) problems.vehicleCapacity = "Enter how many passengers fit.";
  }
  const showError = (key: string) => fieldErrors[key] ?? (touched ? problems[key] : undefined);

  const submit = async () => {
    setTouched(true);
    if (Object.keys(problems).length) return;
    setPending(true);
    setError("");
    setFieldErrors({});
    try {
      const body: Record<string, unknown> = {
        accountRole: role,
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        phoneNumber: form.phoneNumber.trim(),
        password: form.password,
        address: form.address.trim(),
        inviteToken: params.invite || undefined,
      };
      if (role === "driver") {
        Object.assign(body, {
          serviceAreas: form.serviceAreas.trim(),
          carMake: form.carMake.trim(),
          carModel: form.carModel.trim(),
          carColor: form.carColor.trim(),
          plateNumber: form.plateNumber.trim(),
          vehicleCapacity: Number.parseInt(form.vehicleCapacity, 10),
        });
      }
      const result = await apiRequest<{ message: string }>("/api/mobile/auth/register", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setDone(result.message);
    } catch (nextError) {
      if (nextError instanceof ApiError) {
        const flattened = (nextError.details as { fieldErrors?: Record<string, string[]> } | undefined)?.fieldErrors;
        if (flattened) {
          setFieldErrors(
            Object.fromEntries(Object.entries(flattened).map(([key, value]) => [key, value?.[0] ?? "Invalid"]))
          );
        }
        setError(nextError.message);
      } else {
        setError("Unable to sign up. Check your connection.");
      }
    } finally {
      setPending(false);
    }
  };

  if (done) {
    return (
      <AuthScreen title="Check your email" onBack={() => router.replace("/login")}>
        <Text style={authStyles.success}>{done}</Text>
        <AuthButton label="Go to Sign In" onPress={() => router.replace("/login")} />
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      title="Sign Up"
      subtitle={
        params.invite
          ? "Complete your driver registration to respond to the parent who invited you."
          : "Create a parent account to track your kids, or a driver account to join the trusted network."
      }
      footer={
        <Text style={authStyles.footer}>
          Already have an account?{" "}
          <Text style={authStyles.link} onPress={() => router.replace("/login")}>
            Sign In
          </Text>
        </Text>
      }
    >
      <AuthSegment<Role>
        options={[
          { value: "parent", label: "Parent" },
          { value: "driver", label: "Driver" },
        ]}
        value={role}
        onChange={setRole}
      />
      <AuthField label="Full name" placeholder="Your full name" autoCapitalize="words" value={form.full_name} onChangeText={set("full_name")} error={showError("full_name")} />
      <AuthField label="Email" placeholder="Email here" autoCapitalize="none" keyboardType="email-address" autoComplete="email" value={form.email} onChangeText={set("email")} error={showError("email")} />
      <AuthField label="Phone number" placeholder="+2348012345678" keyboardType="phone-pad" value={form.phoneNumber} onChangeText={set("phoneNumber")} error={showError("phoneNumber")} />
      <AuthField label="Home address" placeholder="Street, area, city" value={form.address} onChangeText={set("address")} error={showError("address")} />
      <AuthField label="Password" placeholder="At least 6 characters" secure autoComplete="new-password" value={form.password} onChangeText={set("password")} error={showError("password")} />
      <AuthField label="Confirm password" placeholder="Repeat your password" secure value={form.confirm} onChangeText={set("confirm")} error={showError("confirm")} />

      {role === "driver" ? (
        <>
          <Text style={authStyles.sectionTitle}>Your vehicle</Text>
          <AuthField label="Service areas" placeholder="e.g. Ikeja, Yaba, Lekki" value={form.serviceAreas} onChangeText={set("serviceAreas")} error={showError("serviceAreas")} />
          <AuthField label="Car make" placeholder="e.g. Toyota" value={form.carMake} onChangeText={set("carMake")} error={showError("carMake")} />
          <AuthField label="Car model" placeholder="e.g. Sienna" value={form.carModel} onChangeText={set("carModel")} error={showError("carModel")} />
          <AuthField label="Car colour" placeholder="e.g. Silver" value={form.carColor} onChangeText={set("carColor")} error={showError("carColor")} />
          <AuthField label="Plate number" placeholder="e.g. LND 123 AB" autoCapitalize="characters" value={form.plateNumber} onChangeText={set("plateNumber")} error={showError("plateNumber")} />
          <AuthField label="Passenger capacity" placeholder="e.g. 6" keyboardType="number-pad" value={form.vehicleCapacity} onChangeText={set("vehicleCapacity")} error={showError("vehicleCapacity")} />
        </>
      ) : null}

      {error ? <Text style={authStyles.error}>{error}</Text> : null}
      <AuthButton label={pending ? "Creating account…" : "Create account"} disabled={pending} onPress={() => void submit()} />
    </AuthScreen>
  );
}
