import type { TableSnapshot } from "../core/database";
import type { HarnessTable } from "../core/manifest";
import "./DbInspectorPanel.css";

export type DbInspectorPanelProps = {
  tables: HarnessTable[];
  snapshots: Record<string, TableSnapshot>;
};

export function DbInspectorPanel({ tables, snapshots }: DbInspectorPanelProps) {
  return (
    <aside className="db-inspector" aria-label="DB inspector">
      <div className="db-inspector__header">
        <h2>DB Inspector</h2>
      </div>

      {tables.map((table) => {
        const snapshot = snapshots[table.name];

        return (
          <section className="db-inspector__table" key={table.name}>
            <div className="db-inspector__table-header">
              <h3>{table.label}</h3>
              <span>{snapshot?.rowCount ?? 0} rows</span>
            </div>
            <div className="db-inspector__scroll">
              <table>
                <thead>
                  <tr>
                    {table.columns.map((column) => (
                      <th key={column}>{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(snapshot?.rows ?? []).map((row, rowIndex) => (
                    <tr key={String(row.id ?? rowIndex)}>
                      {table.columns.map((column) => (
                        <td key={column}>{formatCell(row[column])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </aside>
  );
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
