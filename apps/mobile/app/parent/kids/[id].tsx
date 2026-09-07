import { useLocalSearchParams, useRouter } from "expo-router";

import { apiRequest } from "../../../src/api/client";
import { AppButton, EmptyState, Header, LoadingState, Screen } from "../../../src/components/ui";
import { queryKeys, useParentChildren } from "../../../src/hooks/marketplace";
import { useApiMutation } from "../../../src/hooks/use-api-mutation";
import { confirm } from "../../../src/lib/confirm";
import { KidForm, kidPayload, type KidFormValues } from "../../../src/screens/kid-form";

export default function EditKidScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const children = useParentChildren();
  const child = children.data?.find((item) => item.id === id);

  const update = useApiMutation(
    (values: KidFormValues) =>
      apiRequest<{ message: string }>(`/api/parent/children/${id}`, {
        method: "PATCH",
        body: JSON.stringify(kidPayload(values)),
      }),
    {
      invalidate: [queryKeys.parentChildren, queryKeys.dashboard, queryKeys.parentConnections],
      successMessage: "Child updated.",
      onSuccess: () => router.back(),
    }
  );
  const remove = useApiMutation(
    () => apiRequest<{ message: string }>(`/api/parent/children/${id}`, { method: "DELETE" }),
    {
      invalidate: [queryKeys.parentChildren, queryKeys.dashboard, queryKeys.parentConnections],
      successMessage: "Child removed.",
      onSuccess: () => router.back(),
    }
  );

  if (children.isLoading) return <LoadingState label="Loading…" />;
  if (!child) {
    return (
      <Screen>
        <Header title="Child" />
        <EmptyState title="Not found" message="This child is no longer in your family." />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header eyebrow="Family" title={child.fullName} subtitle="Update details or remove this child." />
      <KidForm
        initial={{
          fullName: child.fullName,
          age: child.age != null ? String(child.age) : "",
          grade: child.grade ?? "",
          address: child.address ?? "",
        }}
        submitLabel="Save changes"
        submitting={update.isPending}
        fieldErrors={update.fieldErrors}
        onSubmit={(values) => update.mutate(values)}
      />
      <AppButton
        label={remove.isPending ? "Removing…" : "Remove child"}
        variant="danger"
        disabled={remove.isPending}
        onPress={async () => {
          if (
            await confirm({
              title: `Remove ${child.fullName}?`,
              message: "Any driver assignments for this child will end.",
              confirmLabel: "Remove",
              destructive: true,
            })
          ) {
            remove.mutate(undefined);
          }
        }}
      />
    </Screen>
  );
}
