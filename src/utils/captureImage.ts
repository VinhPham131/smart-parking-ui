export function resolveCaptureImageSrc(
  raw: string | null | undefined,
): string | null {
  if (!raw?.trim()) return null
  const s = raw.trim()
  if (
    s.startsWith('data:') ||
    s.startsWith('http://') ||
    s.startsWith('https://')
  ) {
    return s
  }
  return `data:image/jpeg;base64,${s}`
}

export function hasCaptureImage(raw: string | null | undefined): boolean {
  return Boolean(raw?.trim())
}
