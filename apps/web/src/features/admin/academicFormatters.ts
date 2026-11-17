/**
 * Academic entity display formatters.
 * Prevents repetitive prefixes such as "Section Section A" or "Room Room 101".
 */

export function formatSectionDisplay(name: string | null | undefined): string {
  const trimmed = name?.trim() ?? '';
  if (!trimmed) return '';
  if (/^section\b/i.test(trimmed)) {
    return trimmed;
  }
  return `Section ${trimmed}`;
}

export function formatRoomDisplay(roomNumber: string | null | undefined): string {
  const trimmed = roomNumber?.trim() ?? '';
  if (!trimmed) return '';
  if (/^room\b/i.test(trimmed)) {
    return trimmed;
  }
  return `Room ${trimmed}`;
}
