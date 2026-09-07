import { useRouter } from "expo-router";

import { apiRequest } from "../../../src/api/client";
import { Header, Screen } from "../../../src/components/ui";
import { UpgradePrompt } from "../../../src/components/upgrade-prompt";
import { queryKeys } from "../../../src/hooks/marketplace";
import { useApiMutation } from "../../../src/hooks/use-api-mutation";
import { KidForm, kidPayload, type KidFormValues } from "../../../src/screens/kid-form";

export default function AddKidScreen() {
  const router = useRouter();
  const create = useApiMutation(
    (values: KidFormValues) =>
      apiRequest<{ message: string }>("/api/parent/children", {
        method: "POST",
        body: JSON.stringify(kidPayload(values)),
      }),
    {
      invalidate: [queryKeys.parentChildren, queryKeys.dashboard],
      successMessage: "Child added.",
      onSuccess: () => router.back(),
    }
  );

  return (
    <Screen>
      <Header eyebrow="Family" title="Add a child" subtitle="We'll locate the school from its address." />
      {create.upgrade ? (
        <UpgradePrompt feature={create.upgrade.feature} requiredPlan={create.upgrade.requiredPlan} />
      ) : null}
      <KidForm
        submitLabel="Add child"
        submitting={create.isPending}
        fieldErrors={create.fieldErrors}
        onSubmit={(values) => create.mutate(values)}
      />
    </Screen>
  );
}
