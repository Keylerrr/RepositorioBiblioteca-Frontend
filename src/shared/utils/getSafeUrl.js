export function getSafeUrl(url) {
  if (typeof url !== "string" || !url.trim()) return null;

  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") return null;
    return parsedUrl.toString();
  } catch {
    return null;
  }
}
