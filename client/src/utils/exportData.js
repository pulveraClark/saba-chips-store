function downloadBlob(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatCellValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    return value.toLocaleString();
  }

  return String(value);
}

function escapeCsvValue(value) {
  const text = formatCellValue(value).replace(/"/g, '""');
  return /[",\n]/.test(text) ? `"${text}"` : text;
}

export function exportToCsv(filename, columns, rows) {
  const header = columns.map((column) => escapeCsvValue(column.label)).join(",");
  const body = rows
    .map((row) =>
      columns
        .map((column) => escapeCsvValue(row[column.key]))
        .join(",")
    )
    .join("\n");

  downloadBlob(filename, `${header}\n${body}`, "text/csv;charset=utf-8;");
}

export function exportToExcel(filename, sheetName, columns, rows) {
  const tableHeaders = columns
    .map((column) => `<th>${escapeHtml(column.label)}</th>`)
    .join("");

  const tableRows = rows
    .map(
      (row) =>
        `<tr>${columns
          .map((column) => `<td>${escapeHtml(formatCellValue(row[column.key]))}</td>`)
          .join("")}</tr>`
    )
    .join("");

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:x="urn:schemas-microsoft-com:office:excel"
          xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="UTF-8" />
        <title>${escapeHtml(sheetName)}</title>
        <!--[if gte mso 9]>
          <xml>
            <x:ExcelWorkbook>
              <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                  <x:Name>${escapeHtml(sheetName)}</x:Name>
                  <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
                </x:ExcelWorksheet>
              </x:ExcelWorksheets>
            </x:ExcelWorkbook>
          </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
          th { background: #f3f4f6; font-weight: 700; }
        </style>
      </head>
      <body>
        <table>
          <thead><tr>${tableHeaders}</tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
      </body>
    </html>`;

  downloadBlob(filename, html, "application/vnd.ms-excel;charset=utf-8;");
}

export function exportToPdfPrint(title, sections) {
  const printWindow = window.open("", "_blank", "width=1024,height=768");

  if (!printWindow) {
    return;
  }

  const sectionHtml = sections
    .map((section) => {
      const headers = section.columns
        .map((column) => `<th>${escapeHtml(column.label)}</th>`)
        .join("");

      const rows = section.rows
        .map(
          (row) =>
            `<tr>${section.columns
              .map(
                (column) =>
                  `<td>${escapeHtml(formatCellValue(row[column.key]))}</td>`
              )
              .join("")}</tr>`
        )
        .join("");

      return `
        <section>
          <h2>${escapeHtml(section.heading)}</h2>
          <table>
            <thead><tr>${headers}</tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </section>`;
    })
    .join("");

  const html = `
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
          h1 { margin-bottom: 8px; }
          h2 { margin: 28px 0 12px; color: #8b5e34; }
          p { margin: 0 0 16px; color: #4b5563; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
          th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; vertical-align: top; }
          th { background: #f3f4f6; }
          @media print {
            body { margin: 12px; }
            section { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        <p>Generated on ${escapeHtml(new Date().toLocaleString())}</p>
        ${sectionHtml}
      </body>
    </html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}
