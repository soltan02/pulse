export function formatDuration(startedAt: Date, resolvedAt: Date | null): string {
  const end = resolvedAt ?? new Date();
  const ms = end.getTime() - startedAt.getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

export function formatDateTime(date: Date): string {
  return date.toISOString().replace("T", " ").slice(0, 19) + " UTC";
}
