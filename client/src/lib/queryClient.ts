import { QueryClient, QueryFunction, QueryCache, MutationCache } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

function getApiBaseUrl() {
  // allow deploying the API elsewhere (Railway/Render/etc.)
  // for local dev: VITE_API_BASE_URL=http://localhost:3000
  return (import.meta.env.VITE_API_BASE_URL as string) || "";
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown,
): Promise<Response> {
  const token = await getAccessToken();

  const headers: Record<string, string> = {};
  if (data) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  // If the URL is relative (/api/...), prefix it with API base when needed.
  const fullUrl = url.startsWith("/api")
    ? `${getApiBaseUrl()}${url}`
    : url;

  const res = await fetch(fullUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "throw" | "returnNull";

export function getQueryFn<T>(options: { on401: UnauthorizedBehavior }): QueryFunction<T> {
  return async ({ queryKey }) => {
    const url = queryKey[0] as string;
    const token = await getAccessToken();

    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const fullUrl = url.startsWith("/api")
      ? `${getApiBaseUrl()}${url}`
      : url;

    const res = await fetch(fullUrl, { headers });

    if (res.status === 401) {
      if (options.on401 === "returnNull") return null as T;
      throw new Error("401 Unauthorized");
    }

    await throwIfResNotOk(res);
    return res.json();
  };
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      console.error("[react-query] query error:", error);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      console.error("[react-query] mutation error:", error);
    },
  }),
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
