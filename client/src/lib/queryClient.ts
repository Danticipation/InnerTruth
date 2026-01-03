import { QueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "";

/**
 * Fetch helper with:
 * - JSON parsing
 * - helpful error payloads
 */
async function fetchJSON<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);

  // Attempt to read JSON (but don't crash on non-JSON)
  const text = await res.text();
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = (isJson && text) ? JSON.parse(text) : (text as any);

  if (!res.ok) {
    const message =
      (data && typeof data === "object" && "error" in data && (data as any).error) ||
      res.statusText ||
      "Request failed";

    const err = new Error(message) as Error & { status?: number; data?: any };
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data as T;
}

/**
 * Adds Supabase bearer token if present.
 */
async function withAuthHeaders(headers?: HeadersInit): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;

  return {
    ...(headers || {}),
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
}

/**
 * apiRequest
 * Used for any REST call to your backend.
 */
export async function apiRequest<T = any>(
  method: HttpMethod,
  url: string,
  body?: unknown,
  init?: RequestInit
): Promise<T> {
  const fullUrl = url.startsWith("http")
    ? url
    : `${API_BASE}${url.startsWith("/") ? url : `/${url}`}`;

  const headers = await withAuthHeaders({
    "Content-Type": "application/json",
    ...(init?.headers || {}),
  });

  return fetchJSON<T>(fullUrl, {
    method,
    credentials: "include",
    ...init,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

/**
 * Default Query Function for React Query.
 * Allows you to do:
 * useQuery({ queryKey: ["/api/categories"] })
 */
export function getQueryFn<T>() {
  return async ({ queryKey }: { queryKey: readonly unknown[] }) => {
    const [url] = queryKey;
    return apiRequest<T>("GET", url as string);
  };
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn(),
      retry: 1,
      staleTime: 1000 * 10,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
