import type { ZmanimRow, SadotField } from '@/types';
import { ZMANIM_LABELS, ZMANIM_COLUMN_ORDER } from './zmanim-labels';

/**
 * Returns the next Saturday (Shabbat) as DD/MM/YYYY.
 * If today IS Saturday, returns NEXT Saturday.
 *
 * Note: Uses wall-clock date only. On Friday after candle-lighting time the date is
 * still "Friday" by the system clock — if the caller knows fri_knisa_shabbat it can
 * decide whether to advance the date by an additional 7 days.
 *
 * @param now - injectable for testing; defaults to current date/time
 */
export function nextShabbatDate(now: Date = new Date()): string {
  const day = now.getDay(); // 0=Sun … 6=Sat
  const daysUntilSat = day === 6 ? 7 : 6 - day;
  const sat = new Date(now);
  sat.setDate(now.getDate() + daysUntilSat);
  const dd = String(sat.getDate()).padStart(2, '0');
  const mm = String(sat.getMonth() + 1).padStart(2, '0');
  const yyyy = sat.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/** Converts a ZmanimRow to an ordered SadotField[] — omits null/empty values.
 *  taarikh_ivri and taarikh_luazi are included at the start.
 *  parasha is NOT included here — it is stored as a top-level field on LuachShavui. */
export function zmanimRowToSadot(row: ZmanimRow): SadotField[] {
  const result: SadotField[] = [];

  if (row.taarikh_ivri) {
    result.push({ key: 'taarikh_ivri', label: 'תאריך עברי', value: row.taarikh_ivri });
  }
  if (row.taarikh_luazi) {
    result.push({ key: 'taarikh_luazi', label: 'תאריך לועזי', value: row.taarikh_luazi });
  }

  // ZMANIM_COLUMN_ORDER excludes 'parasha' — see zmanim-labels.ts
  for (const key of ZMANIM_COLUMN_ORDER) {
    const value = row[key];
    if (value != null && value !== '') {
      result.push({ key, label: ZMANIM_LABELS[key], value: String(value) });
    }
  }

  return result;
}
