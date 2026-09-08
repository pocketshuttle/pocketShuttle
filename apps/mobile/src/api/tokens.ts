import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "pocketshuttle.mobile.access";
const REFRESH_TOKEN_KEY = "pocketshuttle.mobile.refresh";
const INSTALLATION_ID_KEY = "pocketshuttle.mobile.installation";

export async function getAccessToken() {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken() {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function saveTokens(accessToken: string, refreshToken: string) {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
  ]);
}

export async function clearTokens() {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
  ]);
}

export async function getInstallationId() {
  const existing = await SecureStore.getItemAsync(INSTALLATION_ID_KEY);
  if (existing) return existing;
  const value = Crypto.randomUUID();
  await SecureStore.setItemAsync(INSTALLATION_ID_KEY, value);
  return value;
}
