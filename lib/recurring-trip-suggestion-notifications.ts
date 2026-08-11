import "server-only";

import { Knock } from "@knocklabs/node";

type NotifyRecurringTripSuggestionInput = {
  suggestionId: string;
  parentId: string;
  parentName?: string | null;
  parentEmail?: string | null;
  destinationLabel?: string | null;
  occurrenceCount: number;
};

export async function notifyRecurringTripSuggestion({
  suggestionId,
  parentId,
  parentName,
  parentEmail,
  destinationLabel,
  occurrenceCount,
}: NotifyRecurringTripSuggestionInput) {
  const secret = process.env.KNOCK_SECRET_API_SECRET;
  if (!secret) return;

  const knock = new Knock(secret);
  await knock.workflows.trigger("recurring-trip-suggestion", {
    data: {
      suggestion_id: suggestionId,
      destination_label: destinationLabel ?? "a saved trip",
      occurrence_count: occurrenceCount,
    },
    recipients: [
      {
        id: parentId,
        name: parentName ?? undefined,
        email: parentEmail ?? undefined,
      },
    ],
  });
}
