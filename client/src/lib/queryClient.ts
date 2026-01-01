import { QueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";

/**
 * Query client with an API fetcher that:
 *  - sends `Authorization: Bearer <supabase access token>`
 *  - sends JSON by default
 *  - throws on non-2xx with a useful error message
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

async function getAccessToken(): Promise<string | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data.session?.access_token ?? null;
}

export async function apiFetch<T = unknown>(
  input: string,
  init: RequestInit = {}
): Promise<T> {
  const token = await getAccessToken();

  const headers = new Headers(init.headers || {});
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(input, {
    ...init,
    headers,
    // IMPORTANT: don't rely on cookies now that we're Supabase-token based
    credentials: "omit",
  });

  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
      else if (body?.message) message = body.message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return (await res.json()) as T;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown
): Promise<Response> {
  const token = await getAccessToken();
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (data) headers.set("Content-Type", "application/json");

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "omit",
  });

  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
      else if (body?.message) message = body.message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  return res;
}
