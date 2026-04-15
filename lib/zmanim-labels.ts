import type { ZmanimRow } from '@/types';

// All time columns in display order — excludes parasha (stored as top-level LuachShavui.parasha)
// and excludes taarikh_ivri/taarikh_luazi (handled separately in zmanimRowToSadot).
// Object.keys() insertion order is guaranteed by ES2015+ for string keys — this is intentional.
export const ZMANIM_LABELS: Record<
  keyof Omit<ZmanimRow, 'parasha' | 'taarikh_ivri' | 'taarikh_luazi'>,
  string
> = {
  fri_shacharit_a:    'שחרית א׳ — שישי',
  fri_shacharit_b:    'שחרית ב׳ — שישי',
  fri_mincha_gdola:   'מנחה גדולה — שישי',
  fri_tfila_mukdemet: 'תפילה מוקדמת — שישי',
  fri_plag:           'פלג המנחה — שישי',
  fri_knisa_shabbat:  'כניסת שבת',
  fri_tchilat_tfila:  'תחילת תפילה — שישי',
  shab_vatikin:       'ותיקין — שבת',
  shab_zricha:        'זריחה — שבת',
  shab_minyan_mukdam: 'מניין מוקדם — שבת',
  shab_minyan_markazi:'מניין מרכזי — שבת',
  shab_tfila_yeladim: 'תפילת ילדים — שבת',
  shab_shiur_nashim:  'שיעור נשים — שבת',
  shab_daf_yomi:      'דף יומי — שבת',
  shab_horim_yeladim: 'הורים וילדים — שבת',
  shab_mincha:        'מנחה — שבת',
  shab_yetsia:        'יציאת שבת',
  chol_shacharit_a:   'שחרית א׳ — חול',
  chol_shacharit_b:   'שחרית ב׳ — חול',
  chol_mincha:        'מנחה — חול',
  chol_maariv_a:      'מעריב א׳ — חול',
  chol_maariv_b:      'מעריב ב׳ — חול',
};

export const ZMANIM_COLUMN_ORDER = Object.keys(ZMANIM_LABELS) as Array<keyof typeof ZMANIM_LABELS>;
