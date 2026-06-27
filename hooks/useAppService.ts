"use client";

import useSWR, { SWRConfiguration } from "swr";
import { useCallback, useState } from "react";
import {
  AppServiceMethod,
  AppServiceOptions,
  appFetcher,
  appService,
} from "@/services/app-service";

export const useAppQuery = <T = unknown>(
  key: string | null,
  config?: SWRConfiguration<T>
) => {
  return useSWR<T>(key, appFetcher, config);
};

export const useAppMutation = <TResponse = unknown, TPayload = unknown>(
  url: string,
  method: Exclude<AppServiceMethod, "GET"> = "POST"
) => {
  const [data, setData] = useState<TResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const mutate = useCallback(
    async (payload?: TPayload, options?: Omit<AppServiceOptions, "method" | "data">) => {
      setLoading(true);
      setErrorMessage("");
      setSuccess(false);

      try {
        const response = await appService<TResponse>(url, {
          ...options,
          method,
          data: payload,
        });
        setData(response);
        setSuccess(true);
        return response;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error occurred";
        setErrorMessage(message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [method, url]
  );

  return { mutate, data, loading, errorMessage, success };
};
