import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const inputPath = process.argv[2];
if (!inputPath) {
  throw new Error("Usage: inspect-workbook.mjs <xlsx>");
}

const input = await FileBlob.load(inputPath);
const workbook = await SpreadsheetFile.importXlsx(input);

const summary = await workbook.inspect({
  kind: "workbook",
  summary: "Workbook structure",
});
console.log(summary.ndjson);

const used = await workbook.inspect({
  kind: "usedRange",
  summary: "Used ranges",
});
console.log(used.ndjson);

for (const range of ["'Test Execution Results'!A1:Z80", "'Bug Report'!A1:Z80"]) {
  const cells = await workbook.inspect({
    kind: "table",
    range,
    include: "values,formulas,styles",
    tableMaxRows: 80,
    tableMaxCols: 26,
  });
  console.log(cells.ndjson);
}
