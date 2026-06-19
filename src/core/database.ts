import { Pool } from "pg";
import type { HarnessTable } from "./manifest";

export type SeedRows = Record<string, Array<Record<string, unknown>>>;

export type TableSnapshot = {
  table: string;
  rowCount: number;
  rows: Array<Record<string, unknown>>;
};

export type DatabaseAdapter = {
  resetTables(tableNames: string[]): Promise<void>;
  seed(rowsByTable: SeedRows): Promise<void>;
  snapshotTable(table: HarnessTable, limit?: number): Promise<TableSnapshot>;
};

function quoteIdentifier(identifier: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier)) {
    throw new Error(`Unsafe SQL identifier: ${identifier}`);
  }

  return `"${identifier}"`;
}

export class PostgresDatabaseAdapter implements DatabaseAdapter {
  private readonly pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
  }

  async resetTables(tableNames: string[]): Promise<void> {
    if (tableNames.length === 0) return;

    const tables = tableNames.map(quoteIdentifier).join(", ");
    await this.pool.query(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE`);
  }

  async seed(rowsByTable: SeedRows): Promise<void> {
    for (const [tableName, rows] of Object.entries(rowsByTable)) {
      if (rows.length === 0) continue;

      const columns = Object.keys(rows[0]);
      const values = rows.flatMap((row) => columns.map((column) => row[column]));
      const placeholders = rows
        .map((_, rowIndex) => {
          const offset = rowIndex * columns.length;
          return `(${columns.map((__, columnIndex) => `$${offset + columnIndex + 1}`).join(", ")})`;
        })
        .join(", ");

      await this.pool.query(
        `INSERT INTO ${quoteIdentifier(tableName)} (${columns.map(quoteIdentifier).join(", ")}) VALUES ${placeholders}`,
        values
      );
    }
  }

  async snapshotTable(table: HarnessTable, limit = 20): Promise<TableSnapshot> {
    const countResult = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM ${quoteIdentifier(table.name)}`
    );
    const rowsResult = await this.pool.query<Record<string, unknown>>(buildSnapshotQuery(table), [limit]);

    return {
      table: table.name,
      rowCount: Number(countResult.rows[0]?.count ?? 0),
      rows: rowsResult.rows
    };
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

export function buildSnapshotQuery(table: HarnessTable): string {
  const orderBy = table.orderBy ?? { column: table.columns[0], direction: "desc" as const };

  if (!table.columns.includes(orderBy.column)) {
    throw new Error(`Snapshot order column "${orderBy.column}" must be included in table columns.`);
  }

  return [
    `SELECT ${table.columns.map(quoteIdentifier).join(", ")}`,
    `FROM ${quoteIdentifier(table.name)}`,
    `ORDER BY ${quoteIdentifier(orderBy.column)} ${orderBy.direction.toUpperCase()}`,
    "LIMIT $1"
  ].join(" ");
}
