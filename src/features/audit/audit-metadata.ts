export function formatAuditMetadata(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return [];
  return Object.entries(metadata)
    .filter(([, value]) => value == null || ["string", "number", "boolean"].includes(typeof value))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => ({ key, value: value == null ? "—" : String(value) }));
}
