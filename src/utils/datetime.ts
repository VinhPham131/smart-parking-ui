/** Format a date string as DD/MM/YYYY (vi-VN locale). */
export function formatDate(dateStr: string | null | undefined, locale = 'vi-VN'): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/** Format a date/time value to a readable string. Returns '—' for null/invalid. */
export function formatDateTime(value: string | Date | null | undefined, locale = 'vi-VN'): string {
  if (!value) return '—'
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Display for admin reservation tables (locale-aware). */
export function formatReservationDateTime(
    iso: string,
    locale: string = 'vi-VN',
): string {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleString(locale, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

export function splitDateTime(value: string | null) {
    if (!value) return { time: null, date: null };
    const [time, date] = value.trim().split(" ");
    return { time: time ?? null, date: date ?? null };
}

/** Human-readable relative time, e.g. "5 minutes ago". */
export function formatRelativeTime(
    isoDate: string,
    now: Date = new Date()
): string {
    const then = new Date(isoDate).getTime();
    const diffMs = now.getTime() - then;
    const seconds = Math.floor(diffMs / 1000);
    if (seconds < 45) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
        return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    }
    const days = Math.floor(hours / 24);
    if (days < 7) {
        return `${days} day${days === 1 ? "" : "s"} ago`;
    }
    const weeks = Math.floor(days / 7);
    if (weeks < 5) {
        return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
    }
    const months = Math.floor(days / 30);
    return `${months} month${months === 1 ? "" : "s"} ago`;
}