import type { LuachShavui, Hodaa, SadotField } from '@/types';

type Section = { prefix: string; title: string };
const SECTIONS: Section[] = [
  { prefix: 'fri_', title: 'שישי' },
  { prefix: 'shab_', title: 'שבת' },
  { prefix: 'chol_', title: 'חול' },
];

function stripDaySuffix(label: string): string {
  return label.replace(/ — (שישי|שבת|חול)$/, '');
}

function buildColumnHtml(title: string, fields: SadotField[]): string {
  if (fields.length === 0) return '';
  const rows = fields
    .map(
      (f, idx) =>
        `<tr style="background:${idx % 2 === 0 ? '#f3f4f6' : '#ffffff'}">
          <td style="padding:6px 10px;color:#374151;font-size:15px">${stripDaySuffix(f.label)}</td>
          <td style="padding:6px 10px;font-weight:700;font-size:15px;direction:ltr;text-align:left;color:#111827">${f.value}</td>
        </tr>`
    )
    .join('');
  return `
    <div style="flex:1;min-width:0">
      <div style="background:#374151;color:#fff;text-align:center;padding:7px 0;font-weight:700;font-size:16px;border-radius:4px 4px 0 0">${title}</div>
      <table style="width:100%;border-collapse:collapse;border:1px solid #d1d5db;border-top:none">
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

/**
 * Opens a print-optimized window with the weekly schedule.
 * Announcements first, then 3-column prayer times (שישי/שבת/חול).
 */
export function generateAndDownloadPDF(luach: LuachShavui, hodaot: Hodaa[]): void {
  const { sadot, parasha } = luach;

  const taarichIvri = sadot.find((f) => f.key === 'taarikh_ivri')?.value ?? '';
  const taarichLuazi = sadot.find((f) => f.key === 'taarikh_luazi')?.value ?? '';
  const timeSadot = sadot.filter((f) => f.key !== 'taarikh_ivri' && f.key !== 'taarikh_luazi');

  const columnsHtml = SECTIONS.map((s) =>
    buildColumnHtml(s.title, timeSadot.filter((f) => f.key.startsWith(s.prefix)))
  ).join('');

  const customFields = timeSadot.filter(
    (f) => !SECTIONS.some((s) => f.key.startsWith(s.prefix))
  );
  const customHtml =
    customFields.length > 0
      ? `<div style="margin-top:12px">
          <div style="background:#6b7280;color:#fff;text-align:center;padding:6px 0;font-weight:700;font-size:15px;border-radius:4px 4px 0 0">נוסף</div>
          <table style="width:100%;border-collapse:collapse;border:1px solid #d1d5db;border-top:none">
            <tbody>${customFields
              .map(
                (f, idx) =>
                  `<tr style="background:${idx % 2 === 0 ? '#f3f4f6' : '#ffffff'}">
                    <td style="padding:6px 10px;color:#374151;font-size:15px">${f.label}</td>
                    <td style="padding:6px 10px;font-weight:700;font-size:15px;direction:ltr;text-align:left;color:#111827">${f.value}</td>
                  </tr>`
              )
              .join('')}</tbody>
          </table>
        </div>`
      : '';

  const hodaotHtml =
    hodaot.length > 0
      ? `<div style="margin-bottom:16px;border:1px solid #d1d5db;border-radius:4px;overflow:hidden">
          <div style="background:#374151;color:#fff;padding:7px 10px;font-weight:700;font-size:16px">הודעות</div>
          <div style="padding:10px 12px">
            ${hodaot
              .map(
                (h) =>
                  `<p style="margin:0 0 8px;font-size:15px;color:#111827;white-space:pre-wrap;border-right:3px solid #9ca3af;padding-right:10px">${h.teken}</p>`
              )
              .join('')}
          </div>
        </div>`
      : '';

  const dateStr = [taarichIvri, taarichLuazi].filter(Boolean).join(' | ');

  const html = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>זמני תפילות — שבות אריאל</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Heebo', Arial, sans-serif; direction: rtl; padding: 16px; color: #111827; }
    @media print {
      body { padding: 0; }
      @page { margin: 12mm; }
    }
  </style>
</head>
<body>
  <div style="text-align:center;margin-bottom:12px">
    <div style="font-size:22px;font-weight:700;color:#111827">זמני תפילות — בית כנסת שבות אריאל</div>
    <div style="font-size:16px;font-weight:600;color:#374151;margin-top:4px">${parasha}</div>
    ${dateStr ? `<div style="font-size:14px;color:#6b7280;margin-top:2px">${dateStr}</div>` : ''}
  </div>

  ${hodaotHtml}

  <div style="display:flex;gap:8px;align-items:flex-start">
    ${columnsHtml}
  </div>

  ${customHtml}

  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (win) {
    win.addEventListener('afterprint', () => URL.revokeObjectURL(url));
  }
}
