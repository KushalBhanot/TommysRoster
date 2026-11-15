// Small fetch helpers for the pages. Every API route answers with JSON, and an
// error answer looks like { "error": "..." }, so a failed request is turned
// into a thrown Error whose message is safe to show to the person.

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
    // The request never reached the server (offline, server down).
    throw new Error("Can't reach the server. Check your connection and try again.");
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error ?? "Something went wrong on our side. Please try again.");
  }
  return data as T;
}

export function getJson<T>(url: string): Promise<T> {
  return request<T>(url);
}

export function postJson<T>(url: string, body: unknown): Promise<T> {
  return request<T>(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** The text of anything thrown, for showing in an error state. */
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}
