export async function getFunctionErrorMessage(error: unknown): Promise<string> {
  const fallback = error instanceof Error ? error.message : "Payment failed. Please try again.";
  if (!error || typeof error !== "object" || !("context" in error)) return fallback;

  const context = error.context;
  if (!(context instanceof Response)) return fallback;

  try {
    const payload = await context.clone().json();
    if (payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string") {
      return payload.error;
    }
  } catch {
    // The response may not contain JSON. Preserve the SDK fallback message.
  }

  return fallback;
}