import type { LuachShavui, SadotField } from '@/types';

type Section = {
  prefix: string;
  header: string;
};

const SECTIONS: Section[] = [
  { prefix: 'fri_', header: 'שישי' },
  { prefix: 'shab_', header: 'שבת' },
  { prefix: 'chol_', header: 'חול' },
];

function stripDaySuffix(label: string): string {
  return label.replace(/ — (שישי|שבת|חול)$/, '');
}

/**
 * Builds the full WhatsApp message text grouped by day (שישי / שבת / חול).
 * Returns empty string if sadot is empty.
 */
export function buildWhatsAppText(luach: LuachShavui): string {
  const { sadot, parasha } = luach;
  if (sadot.length === 0) return '';

  const taarichIvri = sadot.find((f: SadotField) => f.key === 'taarikh_ivri')?.value ?? '';
  const taarichLuazi = sadot.find((f: SadotField) => f.key === 'taarikh_luazi')?.value ?? '';
  const timeSadot = sadot.filter(
    (f: SadotField) => f.key !== 'taarikh_ivri' && f.key !== 'taarikh_luazi'
  );

  const lines: string[] = ['זמני תפילות — בית כנסת שבות אריאל'];
  const header = [parasha, taarichIvri, taarichLuazi].filter(Boolean).join(' | ');
  if (header) lines.push(header);

  for (const section of SECTIONS) {
    const fields = timeSadot.filter((f: SadotField) => f.key.startsWith(section.prefix));
    if (fields.length === 0) continue;
    lines.push('');
    lines.push(`*${section.header}*`);
    for (const field of fields) {
      lines.push(`${stripDaySuffix(field.label)}: ${field.value}`);
    }
  }

  // Custom fields (not fri_/shab_/chol_)
  const customFields = timeSadot.filter(
    (f: SadotField) => !SECTIONS.some((s) => f.key.startsWith(s.prefix))
  );
  if (customFields.length > 0) {
    lines.push('');
    lines.push('*נוסף*');
    for (const field of customFields) {
      lines.push(`${stripDaySuffix(field.label)}: ${field.value}`);
    }
  }

  lines.push('');
  lines.push('ניתן לשלם תרומה ודמי חבר באתר shvutariel.org.il');

  return lines.join('\n');
}
