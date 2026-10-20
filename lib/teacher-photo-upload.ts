type UploadResult = { error: unknown | null };

function statusOf(error: unknown) {
  if (!error || typeof error !== "object") return 0;
  const value = "statusCode" in error ? error.statusCode : "status" in error ? error.status : 0;
  return Number(value) || 0;
}

function retryable(error: unknown) {
  const status = statusOf(error);
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return !status || status === 408 || status === 429 || status >= 500 ||
    message.includes("failed to fetch") || message.includes("timeout") || message.includes("network");
}

export async function uploadTeacherPhotoWithRetry(
  upload: () => Promise<UploadResult>,
  wait: (milliseconds: number) => Promise<void> = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await upload();
      if (!result.error) return;
      // The upload path is a new UUID. A retry conflict means an earlier request
      // committed but its response was lost, so the intended private object exists.
      if (attempt > 0 && statusOf(result.error) === 409) return;
      lastError = result.error;
      if (!retryable(result.error)) throw result.error;
    } catch (error) {
      lastError = error;
      if (!retryable(error)) throw error;
    }
    if (attempt < 2) await wait(attempt === 0 ? 750 : 2000);
  }
  throw new Error("Secure photo storage is temporarily unavailable. Please try again.", { cause: lastError });
}
