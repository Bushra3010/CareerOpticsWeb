/**
 * Minimal RFC 4180 CSV reader.
 *
 * Written here rather than pulling in SheetJS: the npm `xlsx` build is pinned
 * at 0.18.5 with known prototype-pollution and ReDoS advisories, and SheetJS
 * moved distribution off npm entirely. Running that over files staff upload is
 * not a trade worth making for one import screen, and "Save as CSV" is one
 * extra click in Excel.
 *
 * Handles quoted fields, embedded commas and newlines, doubled quotes, and
 * both CRLF and LF.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let i = 0;

  // A BOM survives Excel's "Save as CSV" and would otherwise become part of
  // the first header name.
  if (text.charCodeAt(0) === 0xfeff) i = 1;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    pushField();
    // Skip the trailing blank line most files end with.
    if (row.length > 1 || row[0] !== "") rows.push(row);
    row = [];
  };

  while (i < text.length) {
    const char = text[i]!;

    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        quoted = false;
        i++;
        continue;
      }
      field += char;
      i++;
      continue;
    }

    if (char === '"') {
      quoted = true;
      i++;
      continue;
    }
    if (char === ",") {
      pushField();
      i++;
      continue;
    }
    if (char === "\r") {
      i++;
      continue;
    }
    if (char === "\n") {
      pushRow();
      i++;
      continue;
    }
    field += char;
    i++;
  }

  if (field !== "" || row.length > 0) pushRow();
  return rows;
}

/** Header row plus objects keyed by it, with blank rows dropped. */
export function csvToRecords(text: string) {
  const rows = parseCsv(text);
  if (rows.length === 0) return { headers: [], records: [] };

  const headers = rows[0]!.map((h) => h.trim());
  const records = rows
    .slice(1)
    .filter((row) => row.some((cell) => cell.trim() !== ""))
    .map((row) => {
      const record: Record<string, string> = {};
      headers.forEach((header, index) => {
        record[header] = (row[index] ?? "").trim();
      });
      return record;
    });

  return { headers, records };
}
