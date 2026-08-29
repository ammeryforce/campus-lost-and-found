import type { ApiResponse } from "@/lib/types";

export async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || payload.data === undefined) {
    const fieldMessage = payload.details
      ? Object.values(payload.details).flat().filter(Boolean)[0]
      : undefined;
    throw new Error(fieldMessage || payload.error || "Something went wrong.");
  }

  return payload.data;
}
