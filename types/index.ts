export type SadotField = {
  key: string;    // e.g. "fri_shacharit_a" or custom "extra_1"
  label: string;  // Hebrew display name
  value: string;  // time or free text
};

export type LuachShavui = {
  id: number;
  shavua_date: string;       // ISO date string YYYY-MM-DD
  parasha: string;
  sadot: SadotField[];
  is_published: boolean;
  auto_load: boolean;
  created_at: string;
};

export type Hodaa = {
  id: number;
  teken: string;
  created_at: string;
};

export type ZmanimRow = {
  parasha: string;
  taarikh_ivri: string;
  taarikh_luazi: string;     // DD/MM/YYYY
  fri_shacharit_a: string | null;
  fri_shacharit_b: string | null;
  fri_mincha_gdola: string | null;
  fri_tfila_mukdemet: string | null;
  fri_plag: string | null;
  fri_knisa_shabbat: string | null;
  fri_tchilat_tfila: string | null;
  shab_vatikin: string | null;
  shab_zricha: string | null;
  shab_minyan_mukdam: string | null;
  shab_minyan_markazi: string | null;
  shab_tfila_yeladim: string | null;
  shab_shiur_nashim: string | null;
  shab_daf_yomi: string | null;
  shab_horim_yeladim: string | null;
  shab_mincha: string | null;
  shab_yetsia: string | null;
  chol_shacharit_a: string | null;
  chol_shacharit_b: string | null;
  chol_mincha: string | null;
  chol_maariv_a: string | null;
  chol_maariv_b: string | null;
};
