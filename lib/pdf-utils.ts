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

function buildSectionHtml(title: string, fields: SadotField[]): string {
  if (fields.length === 0) return '';
  const rows = fields
    .map(
      (f) =>
        `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 10px;border-bottom:1px solid #000;break-inside:avoid;page-break-inside:avoid">
          <span style="font-size:15px;color:#000">${stripDaySuffix(f.label)}</span>
          <span style="font-size:15px;font-weight:700;direction:ltr;text-align:left;color:#000">${f.value}</span>
        </div>`
    )
    .join('');
  return `
    <div style="margin-bottom:14px">
      <div style="background:#000;color:#fff;text-align:center;padding:7px 0;font-weight:700;font-size:16px">${title}</div>
      <div>${rows}</div>
    </div>`;
}

/**
 * Opens a print-optimized window with the weekly schedule.
 * Announcements first, then 2-column prayer times: שישי → שבת → חול flowing
 * right-to-left via CSS multi-column (columns split mid-section, not mid-row).
 */
export function generateAndDownloadPDF(luach: LuachShavui, hodaot: Hodaa[]): void {
  const { sadot, parasha } = luach;

  const taarichIvri = sadot.find((f) => f.key === 'taarikh_ivri')?.value ?? '';
  const taarichLuazi = sadot.find((f) => f.key === 'taarikh_luazi')?.value ?? '';
  const timeSadot = sadot.filter((f) => f.key !== 'taarikh_ivri' && f.key !== 'taarikh_luazi');

  const sectionsHtml = SECTIONS.map((s) =>
    buildSectionHtml(s.title, timeSadot.filter((f) => f.key.startsWith(s.prefix)))
  ).join('');

  const customFields = timeSadot.filter(
    (f) => !SECTIONS.some((s) => f.key.startsWith(s.prefix))
  );
  const customHtml =
    customFields.length > 0
      ? `<div style="margin-top:12px;border:1px solid #000">
          <div style="background:#000;color:#fff;text-align:center;padding:6px 0;font-weight:700;font-size:15px">נוסף</div>
          <div>${customFields
              .map(
                (f) =>
                  `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 10px;border-bottom:1px solid #000">
                    <span style="font-size:15px;color:#000">${f.label}</span>
                    <span style="font-size:15px;font-weight:700;direction:ltr;text-align:left;color:#000">${f.value}</span>
                  </div>`
              )
              .join('')}</div>
        </div>`
      : '';

  const hodaotHtml =
    hodaot.length > 0
      ? `<div style="margin-bottom:16px;border:1px solid #000">
          <div style="background:#000;color:#fff;padding:7px 10px;font-weight:700;font-size:16px">הודעות</div>
          <div style="padding:10px 12px">
            ${hodaot
              .map(
                (h) =>
                  `<p style="margin:0 0 8px;font-size:15px;color:#000;white-space:pre-wrap;border-right:3px solid #000;padding-right:10px">${h.teken}</p>`
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
    body { font-family: 'Heebo', Arial, sans-serif; direction: rtl; padding: 16px; color: #000; }
    @media print {
      body { padding: 0; }
      @page { margin: 12mm; }
    }
  </style>
</head>
<body>
  <div style="text-align:center;margin-bottom:12px">
    <div style="font-size:22px;font-weight:700;color:#000">זמני תפילות — בית כנסת שבות אריאל</div>
    <div style="font-size:16px;font-weight:600;color:#000;margin-top:4px">${parasha}</div>
    ${dateStr ? `<div style="font-size:14px;color:#000;margin-top:2px">${dateStr}</div>` : ''}
  </div>

  ${hodaotHtml}

  <div style="column-count:2;column-gap:20px;direction:rtl">
    ${sectionsHtml}
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
