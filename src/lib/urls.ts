export function safeExternalUrl(value: string | null | undefined) {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export function safeHttpsUrl(value: string | null | undefined) {
  const url = safeExternalUrl(value);
  return url?.startsWith("https://") ? url : null;
}
