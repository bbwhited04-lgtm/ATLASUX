/**
 * Excel Parse — parse .xlsx/.xls files using the xlsx (SheetJS) library.
 *
 * Reads file from a path provided in the query or from a job attachment.
 * Requires: `xlsx` npm package.
 */

import type { ToolDefinition } from "./_types.js";
import { makeResult, makeError } from "./_types.js";

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
      let XLSX: any;
      try {
        XLSX = await import("xlsx");
      } catch {
        return makeResult("excel_parse", "Excel parsing not available — xlsx package not installed. Run: npm install xlsx");
      }

      // Extract file path from query
      const pathMatch = ctx.query.match(/(?:\/[\w./-]+\.xlsx?)/i);
      if (!pathMatch) {
        return makeResult("excel_parse", "Please provide an Excel file path. Example: 'parse excel /path/to/file.xlsx'");
      }

      const filePath = pathMatch[0];
      const workbook = XLSX.readFile(filePath);
      const sheetNames = workbook.SheetNames;

      if (!sheetNames.length) return makeResult("excel_parse", "Workbook has no sheets.");

      // Read first sheet
      const firstSheet = workbook.Sheets[sheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as string[][];

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
