import { z } from "zod";

const tableSchema = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
  columns: z.array(z.string().min(1)).min(1),
  orderBy: z
    .object({
      column: z.string().min(1),
      direction: z.enum(["asc", "desc"]).default("desc")
    })
    .optional()
});

const manifestSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  route: z.string().min(1),
  dependencies: z.record(z.string(), z.unknown()),
  database: z.object({
    resetMode: z.enum(["truncate", "migrate"]).default("truncate"),
    tables: z.array(tableSchema).min(1, "At least one table must be allowlisted")
  })
});

export type HarnessTable = z.infer<typeof tableSchema>;
export type HarnessManifest = z.infer<typeof manifestSchema>;

export function parseHarnessManifest(input: unknown): HarnessManifest {
  return manifestSchema.parse(input);
}

export function getAllowlistedTable(manifest: HarnessManifest, tableName: string): HarnessTable {
  const table = manifest.database.tables.find((candidate) => candidate.name === tableName);
  if (!table) {
    throw new Error(`Table "${tableName}" is not allowlisted by this harness manifest.`);
  }

  return table;
}
