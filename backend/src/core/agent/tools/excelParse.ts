/**
 * Excel Parse — parse .xlsx files using ExcelJS.
 *
 * Reads file from a path provided in the query or from a job attachment.
 * Requires: `exceljs` npm package.
 */

import type { ToolDefinition } from "./_types.js";
import { makeResult, makeError } from "./_types.js";
import { readFile } from "fs/promises";

export const excelParseTool: ToolDefinition = {
  key:  "excel",
  name: "Excel Parse",
  patterns: [
    /excel/i,
    /\.xlsx?\b/i,
    /spreadsheet\s*file/i,
    /workbook/i,
    /parse\s*(?:the\s*)?(?:excel|xlsx)/i,
  ],
  async execute(ctx) {
    try {
      // Dynamic import so the module is only loaded when needed
      let ExcelJS: any;
      try {
        ExcelJS = await import("exceljs");
      } catch {
        return makeResult("excel_parse", "Excel parsing not available — exceljs package not installed. Run: npm install exceljs");
      }

      // Extract file path from query
      const pathMatch = ctx.query.match(/(?:\/[\w./-]+\.xlsx?)/i);
      if (!pathMatch) {
        return makeResult("excel_parse", "Please provide an Excel file path. Example: 'parse excel /path/to/file.xlsx'");
      }

      const filePath = pathMatch[0];
      const buffer = await readFile(filePath);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);

      const sheetNames = workbook.worksheets.map((ws: any) => ws.name);

      if (!sheetNames.length) return makeResult("excel_parse", "Workbook has no sheets.");

      // Read first sheet as array-of-arrays (like xlsx { header: 1 })
      const firstSheet = workbook.worksheets[0];
      const rows: string[][] = [];
      firstSheet.eachRow((row: any) => {
        const vals: string[] = [];
        row.eachCell({ includeEmpty: true }, (cell: any) => {
          vals.push(String(cell.value ?? ""));
        });
        rows.push(vals);
      });

      if (!rows.length) return makeResult("excel_parse", `Sheet "${sheetNames[0]}" is empty.`);

      // Format as markdown table (cap at 20 rows)
      const header = rows[0].map(String);
      const divider = header.map(() => "---");
      const dataRows = rows.slice(1, 20).map(r => r.map(String));
      const tableRows = [header, divider, ...dataRows];
      const table = tableRows.map(r => `| ${r.join(" | ")} |`).join("\n");

      const summary = `File: ${filePath}\nSheets: ${sheetNames.join(", ")}\nRows: ${rows.length} | Showing sheet: ${sheetNames[0]}\n\n${table}`;
      if (rows.length > 20) {
        return makeResult("excel_parse", `${summary}\n\n... (${rows.length - 20} more rows not shown)`);
      }
      return makeResult("excel_parse", summary);
    } catch (err) {
      return makeError("excel_parse", err);
    }
  },
};
