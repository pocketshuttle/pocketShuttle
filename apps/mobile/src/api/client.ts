import * as Device from "expo-device";

import { clearTokens, getAccessToken, getInstallationId, getRefreshToken, saveTokens } from "./tokens";
import type { MobileActor, MobileRole } from "../types";

export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:3000"
).replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
  }
}

async function parseResponse(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(
      data.message || "PocketShuttle request failed.",
      response.status,
      data.code,
      data.details
    );
  }
  return data;
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) return null;
      try {
        const response = await fetch(`${API_URL}/api/mobile/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
        const data = await parseResponse(response);
        await saveTokens(data.accessToken, data.refreshToken);
        return String(data.accessToken);
      } catch {
        await clearTokens();
        return null;
      }
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  retry = true
): Promise<T> {
  const accessToken = await getAccessToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(init.headers || {}),
    },
  });
  if (response.status === 401 && retry && (await refreshAccessToken())) {
    return apiRequest<T>(path, init, false);
  }
  return parseResponse(response) as Promise<T>;
}

export async function login(input: {
  email: string;
  password: string;
  role: MobileRole;
}) {
  const installationId = await getInstallationId();
  const response = await fetch(`${API_URL}/api/mobile/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...input,
      installationId,
      platform: "ANDROID",
      deviceName: Device.deviceName || Device.modelName || "Android device",
      appVersion: "0.1.0",
    }),
  });
  const data = (await parseResponse(response)) as {
    accessToken: string;
    refreshToken: string;
    actor: MobileActor;
  };
  await saveTokens(data.accessToken, data.refreshToken);
  return data.actor;
}

export async function logout() {
  const refreshToken = await getRefreshToken();
  try {
    await apiRequest("/api/mobile/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
  } finally {
    await clearTokens();
  }
}
