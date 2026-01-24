import { QueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "";

export const SESSION_QUERY_KEY = ["supabase-session"];

/**
 * Fetch helper with:
 * - JSON parsing
 * - helpful error payloads
 */
async function fetchJSON<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);

  // Attempt to read JSON (but don't crash on JSON parsing errors)
  const text = await res.text();
  const isJson = res.headers.get("content-type")?.includes("application/json");
  let data: any;
  try {
    data = (isJson && text) ? JSON.parse(text) : text;
  } catch (e) {
    data = text;
  }

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
 * Adds Supabase bearer token if present, using React Query for session caching.
 */
async function withAuthHeaders(headers?: HeadersInit): Promise<HeadersInit> {
  // Use queryClient to get cached session or fetch new one
  // This prevents multiple parallel getSession() calls from hitting the network/DB
  const session = await queryClient.fetchQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session;
    },
    staleTime: 1000 * 60 * 5, // Cache session for 5 minutes
  });

  const accessToken = session?.access_token;

  return {
    ...(headers || {}),
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
}

/**
 * apiRequest
 * Used for any REST call to your backend.
 * Includes 401 retry logic with session refresh.
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

  const getHeaders = async () => await withAuthHeaders({
    "Content-Type": "application/json",
    ...(init?.headers || {}),
  });

  const fetchOptions = (headers: HeadersInit) => ({
    method,
    credentials: "include" as const,
    ...init,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  try {
    const headers = await getHeaders();
    return await fetchJSON<T>(fullUrl, fetchOptions(headers));
  } catch (error: any) {
    // If 401 Unauthorized, attempt to refresh session and retry once
    if (error.status === 401) {
      console.log("[apiRequest] 401 detected, attempting session refresh...");
      const { data, error: refreshError } = await supabase.auth.refreshSession();
      
      if (!refreshError && data.session) {
        console.log("[apiRequest] Session refreshed, retrying request...");
        // Update the session cache
        queryClient.setQueryData(SESSION_QUERY_KEY, data.session);
        
        // Retry the request with new headers
        const newHeaders = await getHeaders();
        return await fetchJSON<T>(fullUrl, fetchOptions(newHeaders));
      }
      console.error("[apiRequest] Session refresh failed or no session returned", refreshError);
    }
    throw error;
  }
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
      retry: (failureCount, error: any) => {
        // Don't retry on 401 as we handle it in apiRequest
        if (error?.status === 401) return false;
        return failureCount < 1;
      },
      staleTime: 1000 * 10,
      refetchOnWindowFocus: true, // Set to true to help keep auth state fresh
    },
    mutations: {
      retry: 1, // Allow one retry for mutations to handle transient network glitches
    },
  },
});
