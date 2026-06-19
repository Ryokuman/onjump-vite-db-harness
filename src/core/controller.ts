import type { DatabaseAdapter, SeedRows, TableSnapshot } from "./database";
import { getAllowlistedTable, type HarnessManifest } from "./manifest";

export type HarnessSnapshot = {
  manifestId: string;
  tables: Record<string, TableSnapshot>;
};

export type HarnessController = {
  resetAndSeed(): Promise<void>;
  snapshot(): Promise<HarnessSnapshot>;
  snapshotTable(tableName: string): Promise<TableSnapshot>;
};

export function createHarnessController(options: {
  manifest: HarnessManifest;
  adapter: DatabaseAdapter;
  seedRows: SeedRows;
}): HarnessController {
  const { manifest, adapter, seedRows } = options;
  const tableNames = manifest.database.tables.map((table) => table.name);

  return {
    async resetAndSeed() {
      await adapter.resetTables(tableNames);
      await adapter.seed(seedRows);
    },

    async snapshot() {
      const entries = await Promise.all(
        manifest.database.tables.map(async (table) => [table.name, await adapter.snapshotTable(table)] as const)
      );

      return {
        manifestId: manifest.id,
        tables: Object.fromEntries(entries)
      };
    },

    async snapshotTable(tableName: string) {
      const table = getAllowlistedTable(manifest, tableName);
      return adapter.snapshotTable(table);
    }
  };
}
