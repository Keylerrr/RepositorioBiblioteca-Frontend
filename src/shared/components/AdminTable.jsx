// Figma: Admin Table / RABD (259:446), Harvest Runs y Link Alerts.
export default function AdminTable({ caption, columns, rows, variant = "runs", rowClassName }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={`w-full table-fixed border-collapse ${variant === "alerts" ? "min-w-[900px]" : "min-w-[820px]"}`}>
        <caption className="sr-only">{caption}</caption>
        <colgroup>
          {columns.map((column) => <col key={column.key} style={{ width: column.width }} />)}
        </colgroup>
        <thead><tr>{columns.map((column) => <th scope="col" key={column.key} className="h-11 bg-[#EEF0F3] px-3 py-[11px] text-left align-middle text-xs leading-[18px] font-normal tracking-[0.1px] text-[#68707C]">{column.label}</th>)}</tr></thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className={rowClassName?.(row) || "even:bg-[#EEF0F3]"}>
              {columns.map((column) => (
                <td key={column.key} className={`h-[54px] px-3 py-[11px] align-middle ${column.muted ? "text-[#68707C]" : ""}`}>
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
