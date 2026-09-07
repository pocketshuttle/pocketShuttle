import Storage from "expo-sqlite/kv-store";

export async function getJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await Storage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function setJson(key: string, value: unknown) {
  await Storage.setItem(key, JSON.stringify(value));
}

export async function removeKey(key: string) {
  await Storage.removeItem(key);
}
