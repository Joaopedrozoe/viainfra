// Sources are appended Evolution first, then the live Meta catalog for the same company.
// The latest source wins for an exact name/language pair, including approval and header changes.
export function mergeTemplateCatalog<T extends { name?: string; language?: string }>(rows: T[]): T[] {
  const catalog = new Map<string, T>();
  for (const row of rows) {
    if (row?.name) catalog.set(`${row.name}|${row.language}`, row);
  }
  return [...catalog.values()];
}