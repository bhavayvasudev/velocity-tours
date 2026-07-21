import ExcelJS from "exceljs";

// Shared visual language for every "Export Excel" button in the app — one
// bold blue banner + header (matches the button's own blue-600), thin
// borders throughout, zebra body rows, a red highlight on any positive
// "pending" figure, and a bold SUM-formula totals row. Modeled on the
// company's own ledger sheet format (invoice no / date / amount / name /
// received / pending / remarks) so every export reads like one continuous
// ledger instead of a spreadsheet dump.
const BRAND_BLUE = "FF2563EB";
const HEADER_TEXT = "FFFFFFFF";
const ZEBRA_FILL = "FFF8FAFC";
const PENDING_FILL = "FFFEE2E2";
const BORDER_COLOR = "FFE2E8F0";
const CURRENCY_FORMAT = '"₹" #,##0';

const thinBorder = () => ({
  top: { style: "thin", color: { argb: BORDER_COLOR } },
  left: { style: "thin", color: { argb: BORDER_COLOR } },
  bottom: { style: "thin", color: { argb: BORDER_COLOR } },
  right: { style: "thin", color: { argb: BORDER_COLOR } },
});

const cellValue = (col, row) => (typeof col.value === "function" ? col.value(row) : row[col.key]);

function addLedgerSheet(workbook, { sheetName, title, columns, rows, totalsColumns = [] }) {
  const sheet = workbook.addWorksheet(sheetName.slice(0, 31), { views: [{ state: "frozen", ySplit: 2 }] });

  columns.forEach((c, i) => {
    const width = Math.min(
      42,
      Math.max(10, c.header.length, ...rows.map((r) => String(cellValue(c, r) ?? "").length)) + 2
    );
    sheet.getColumn(i + 1).width = c.width || width;
  });

  sheet.mergeCells(1, 1, 1, columns.length);
  const banner = sheet.getCell(1, 1);
  banner.value = title;
  banner.font = { bold: true, size: 14, color: { argb: BRAND_BLUE } };
  banner.alignment = { vertical: "middle" };
  sheet.getRow(1).height = 26;

  const headerRow = sheet.getRow(2);
  columns.forEach((c, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = c.header;
    cell.font = { bold: true, color: { argb: HEADER_TEXT } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_BLUE } };
    cell.alignment = { horizontal: c.align || "left", vertical: "middle" };
    cell.border = thinBorder();
  });
  headerRow.height = 20;

  rows.forEach((row, rIdx) => {
    const excelRow = sheet.addRow(columns.map((c) => cellValue(c, row)));
    excelRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const col = columns[colNumber - 1];
      cell.border = thinBorder();
      cell.alignment = { horizontal: col.align || "left" };
      if (col.currency) cell.numFmt = CURRENCY_FORMAT;
      if (rIdx % 2 === 1) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ZEBRA_FILL } };
      }
      if (col.pendingHighlight && Number(cellValue(col, row)) > 0) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PENDING_FILL } };
      }
    });
  });

  if (totalsColumns.length > 0 && rows.length > 0) {
    const firstDataRow = 3;
    const lastDataRow = 2 + rows.length;
    const totalsRow = sheet.getRow(lastDataRow + 1);
    columns.forEach((c, i) => {
      const cell = totalsRow.getCell(i + 1);
      if (totalsColumns.includes(c.key)) {
        const colLetter = sheet.getColumn(i + 1).letter;
        cell.value = { formula: `SUM(${colLetter}${firstDataRow}:${colLetter}${lastDataRow})` };
        cell.numFmt = CURRENCY_FORMAT;
      } else if (i === 0) {
        cell.value = "Total";
      }
      cell.font = { bold: true };
      cell.border = { ...thinBorder(), top: { style: "medium", color: { argb: BRAND_BLUE } } };
    });
  }
}

function addMessageSheet(workbook, { sheetName, title, message }) {
  const sheet = workbook.addWorksheet(sheetName.slice(0, 31));
  sheet.getColumn(1).width = 60;
  sheet.mergeCells("A1:A1");
  const banner = sheet.getCell("A1");
  banner.value = title;
  banner.font = { bold: true, size: 14, color: { argb: BRAND_BLUE } };
  sheet.getRow(1).height = 26;
  const msgCell = sheet.getCell("A3");
  msgCell.value = message;
  msgCell.font = { italic: true, color: { argb: "FF64748B" } };
  sheet.getRow(3).height = 20;
}

async function downloadWorkbook(workbook, filename) {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * sheets: array of either
 *   { type: "ledger" (default), sheetName, title, columns, rows, totalsColumns }
 *   { type: "message", sheetName, title, message }
 */
export async function exportWorkbook(filename, sheets) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Velocity Tours";
  workbook.created = new Date();

  sheets.forEach((sheet) => {
    if (sheet.type === "message") addMessageSheet(workbook, sheet);
    else addLedgerSheet(workbook, sheet);
  });

  await downloadWorkbook(workbook, filename);
}

// Convenience for the common single-sheet ledger export.
export async function exportLedger(filename, { sheetName = "Sheet1", title, columns, rows, totalsColumns }) {
  await exportWorkbook(filename, [{ sheetName, title, columns, rows, totalsColumns }]);
}

// Bookings.jsx's Service Tax Report has a bespoke two-row merged header
// (Total Income / Amount / Client Output spanning SGST+CGST / Vendor Output
// spanning CGST+SGST+IGST) that doesn't fit the generic ledger shape above.
export async function exportServiceTaxReport(filename, rows) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Velocity Tours";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Service Tax Report", { views: [{ state: "frozen", ySplit: 3 }] });
  const widths = [16, 16, 11, 11, 11, 11, 11];
  widths.forEach((w, i) => (sheet.getColumn(i + 1).width = w));

  sheet.mergeCells(1, 1, 2, 1);
  sheet.mergeCells(1, 2, 2, 2);
  sheet.mergeCells(1, 3, 1, 4);
  sheet.mergeCells(1, 5, 1, 7);

  sheet.getCell(1, 1).value = "Total Income";
  sheet.getCell(1, 2).value = "Amount (Profit)";
  sheet.getCell(1, 3).value = "Client Output";
  sheet.getCell(1, 5).value = "Vendor Output";
  ["A1", "B1", "C1", "E1"].forEach((ref) => {
    const cell = sheet.getCell(ref);
    cell.font = { bold: true, color: { argb: HEADER_TEXT } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_BLUE } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });

  const subHeaders = ["", "", "SGST", "CGST", "CGST", "SGST", "IGST"];
  subHeaders.forEach((label, i) => {
    if (!label) return;
    const cell = sheet.getRow(2).getCell(i + 1);
    cell.value = label;
    cell.font = { bold: true, color: { argb: HEADER_TEXT } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_BLUE } };
    cell.alignment = { horizontal: "center" };
  });

  for (let c = 1; c <= 7; c++) {
    sheet.getRow(1).getCell(c).border = thinBorder();
    sheet.getRow(2).getCell(c).border = thinBorder();
  }
  sheet.getRow(1).height = 20;
  sheet.getRow(2).height = 18;

  rows.forEach((d, rIdx) => {
    const excelRow = sheet.addRow([d.income, d.profit, d.clientSGST, d.clientCGST, d.vendorCGST, d.vendorSGST, d.vendorIGST]);
    excelRow.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = thinBorder();
      cell.numFmt = CURRENCY_FORMAT;
      cell.alignment = { horizontal: "right" };
      if (rIdx % 2 === 1) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ZEBRA_FILL } };
    });
  });

  await downloadWorkbook(workbook, filename);
}
