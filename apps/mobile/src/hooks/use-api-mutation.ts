import { QueryKey, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";

import { ApiError } from "../api/client";
import { useToast } from "../components/toast";

export type UpgradeRequired = {
  feature: string | null;
  requiredPlan: string | null;
  message: string;
};

export type FieldErrors = Record<string, string>;

function zodFieldErrors(details: unknown): FieldErrors {
  const errors: FieldErrors = {};
  if (!details || typeof details !== "object") return errors;
  const record = details as Record<string, unknown>;
  const fieldErrors = record.fieldErrors;
  if (fieldErrors && typeof fieldErrors === "object") {
    for (const [key, value] of Object.entries(fieldErrors as Record<string, unknown>)) {
      if (Array.isArray(value) && typeof value[0] === "string") errors[key] = value[0];
    }
    return errors;
  }
  if (Array.isArray(details)) {
    for (const issue of details) {
      if (!issue || typeof issue !== "object") continue;
      const path = (issue as { path?: unknown }).path;
      const message = (issue as { message?: unknown }).message;
      if (Array.isArray(path) && path.length && typeof message === "string") {
        errors[String(path[0])] = message;
      }
    }
  }
  return errors;
}

export function upgradeFromError(error: unknown): UpgradeRequired | null {
  if (!(error instanceof ApiError) || error.code !== "UPGRADE_REQUIRED") return null;
  const body = error.body ?? {};
  return {
    feature: typeof body.feature === "string" ? body.feature : null,
    requiredPlan: typeof body.requiredPlan === "string" ? body.requiredPlan : null,
    message: error.message,
  };
}

export function useApiMutation<TVars, TData>(
  mutationFn: (vars: TVars) => Promise<TData>,
  options: {
    invalidate?: QueryKey[];
    successMessage?: string | ((data: TData) => string);
    onSuccess?(data: TData, vars: TVars): void | Promise<void>;
    silentErrors?: boolean;
  } = {}
) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [upgrade, setUpgrade] = useState<UpgradeRequired | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const mutation = useMutation<TData, unknown, TVars>({
    mutationFn,
    onSuccess: async (data, vars) => {
      setUpgrade(null);
      setFieldErrors({});
      await Promise.all(
        (options.invalidate ?? []).map((queryKey) =>
          queryClient.invalidateQueries({ queryKey })
        )
      );
      if (options.successMessage) {
        toast.show(
          typeof options.successMessage === "function"
            ? options.successMessage(data)
            : options.successMessage,
          { variant: "success" }
        );
      }
      await options.onSuccess?.(data, vars);
    },
    onError: (error) => {
      const upgradeRequired = upgradeFromError(error);
      if (upgradeRequired) {
        setUpgrade(upgradeRequired);
        return;
      }
      if (error instanceof ApiError) {
        const errors = zodFieldErrors(error.details);
        setFieldErrors(errors);
        if (!options.silentErrors) toast.show(error.message, { variant: "error" });
        return;
      }
      if (!options.silentErrors) {
        toast.show(error instanceof Error ? error.message : "Something went wrong.", {
          variant: "error",
        });
      }
    },
  });

  const clearUpgrade = useCallback(() => setUpgrade(null), []);
  const clearFieldErrors = useCallback(() => setFieldErrors({}), []);

  return { ...mutation, upgrade, clearUpgrade, fieldErrors, clearFieldErrors };
}
