import { useState } from "react";

import { API_URL } from "../api/client";
import { DocumentPicker } from "../components/document-picker";
import type { FieldErrors } from "../hooks/use-api-mutation";
import { AppButton, Card, FormField } from "../components/ui";

export type KidFormValues = {
  fullName: string;
  age: string;
  grade: string;
  address: string;
  image?: string;
};

export function KidForm({
  initial,
  submitLabel,
  submitting,
  fieldErrors,
  onSubmit,
}: {
  initial?: Partial<KidFormValues>;
  submitLabel: string;
  submitting: boolean;
  fieldErrors: FieldErrors;
  onSubmit(values: KidFormValues): void;
}) {
  const [values, setValues] = useState<KidFormValues>({
    fullName: initial?.fullName ?? "",
    age: initial?.age ?? "",
    grade: initial?.grade ?? "",
    address: initial?.address ?? "",
    image: initial?.image ?? undefined,
  });
  const [preview, setPreview] = useState<string | undefined>(
    initial?.image ? (initial.image.startsWith("/") ? `${API_URL}${initial.image}` : initial.image) : undefined
  );
  const [touched, setTouched] = useState(false);
  const set = (key: keyof KidFormValues) => (value: string) =>
    setValues((current) => ({ ...current, [key]: value }));

  const nameMissing = values.fullName.trim().length < 2;
  const addressMissing = values.address.trim().length < 5;

  return (
    <Card>
      <DocumentPicker
        label="Child's photo (optional)"
        hint="Helps drivers recognize your child at pickup."
        purpose="parent-child-image"
        value={values.image}
        preview={preview}
        onUploaded={(url, localUri) => {
          setValues((current) => ({ ...current, image: url }));
          setPreview(localUri);
        }}
      />
      <FormField
        label="Full name"
        placeholder="Child's full name"
        value={values.fullName}
        onChangeText={set("fullName")}
        autoCapitalize="words"
        error={fieldErrors.fullName ?? (touched && nameMissing ? "Enter the child's name." : null)}
      />
      <FormField
        label="Age (optional)"
        placeholder="e.g. 8"
        value={values.age}
        onChangeText={set("age")}
        keyboardType="number-pad"
        error={fieldErrors.age}
      />
      <FormField
        label="Grade / class (optional)"
        placeholder="e.g. Primary 3"
        value={values.grade}
        onChangeText={set("grade")}
        error={fieldErrors.grade}
      />
      <FormField
        label="School address"
        placeholder="Street, area, city"
        value={values.address}
        onChangeText={set("address")}
        multiline
        hint="Used to verify drop-offs at school (within 250 m)."
        error={fieldErrors.address ?? (touched && addressMissing ? "Enter the school address." : null)}
      />
      <AppButton
        label={submitting ? "Saving…" : submitLabel}
        disabled={submitting}
        onPress={() => {
          setTouched(true);
          if (!nameMissing && !addressMissing) onSubmit(values);
        }}
      />
    </Card>
  );
}

export function kidPayload(values: KidFormValues) {
  const age = Number.parseInt(values.age, 10);
  return {
    fullName: values.fullName.trim(),
    age: Number.isFinite(age) ? age : undefined,
    grade: values.grade.trim() || undefined,
    address: values.address.trim(),
    image: values.image || undefined,
  };
}
