export type AppServiceMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type AppServiceOptions = {
  method?: AppServiceMethod;
  data?: unknown;
  headers?: HeadersInit;
  params?: Record<string, string | number | boolean | null | undefined>;
  signal?: AbortSignal;
};

export class AppServiceError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "AppServiceError";
    this.status = status;
    this.data = data;
  }
}

const getErrorMessage = (data: unknown, fallback: string) => {
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    const message = record.message ?? record.error;

    if (typeof message === "string" && message.length > 0) {
      return message;
    }
  }

  return fallback;
};

const buildUrl = (
  url: string,
  params?: AppServiceOptions["params"]
) => {
  if (!params) return url;

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  if (!query) return url;

  return `${url}${url.includes("?") ? "&" : "?"}${query}`;
};

export const appService = async <T = unknown>(
  url: string,
  options: AppServiceOptions = {}
): Promise<T> => {
  const method = options.method ?? "GET";
  const body = options.data instanceof FormData ? options.data : JSON.stringify(options.data);
  const isFormData = options.data instanceof FormData;

  const headers: HeadersInit = {
    Accept: "application/json",
    ...(!isFormData && options.data !== undefined
      ? { "Content-Type": "application/json" }
      : {}),
    ...options.headers,
  };

  const response = await fetch(buildUrl(url, options.params), {
    method,
    headers,
    body: method === "GET" ? undefined : body,
    credentials: "same-origin",
    signal: options.signal,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new AppServiceError(
      getErrorMessage(data, "Something went wrong"),
      response.status,
      data
    );
  }

  return data as T;
};

export const appFetcher = <T = unknown>(url: string) =>
  appService<T>(url, { method: "GET" });
