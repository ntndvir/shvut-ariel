import pandas as pd
import requests
import json
import math

# --- הגדרות ---
SUPABASE_URL = 'https://hqnnisuilubxpqjkvmju.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhxbm5pc3VpbHVieHBxamt2bWp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMTQ3NDcsImV4cCI6MjA5MTc5MDc0N30.y3gu_Zevl1vKxjJUXFVPsLG4-jJag8t66uZTDcrjGfY'

EXCEL_FILE_PATH = r'C:\Users\ariel\Documents\shvut-ariel\זמני קיץ מעודכן- תשפו שבות אריאל.xlsx'

TABLE_NAME = 'zmanim'

COLUMNS = [
    'parasha',
    'taarikh_ivri',
    'taarikh_luazi',
    'fri_shacharit_a',
    'fri_shacharit_b',
    'fri_mincha_gdola',
    'fri_tfila_mukdemet',
    'fri_plag',
    'fri_knisa_shabbat',
    'fri_tchilat_tfila',
    'shab_vatikin',
    'shab_zricha',
    'shab_minyan_mukdam',
    'shab_minyan_markazi',
    'shab_tfila_yeladim',
    'shab_shiur_nashim',
    'shab_daf_yomi',
    'shab_horim_yeladim',
    'shab_mincha',
    'shab_yetsia',
    'chol_shacharit_a',
    'chol_shacharit_b',
    'chol_mincha',
    'chol_maariv_a',
    'chol_maariv_b',
]

HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal',
}


def load_excel(file_path: str) -> pd.DataFrame:
    """טוען את האקסל, מדלג על 2 שורות כותרת, ממפה עמודות לפי COLUMNS."""
    df = pd.read_excel(file_path, header=None, skiprows=2)

    if df.shape[1] < len(COLUMNS):
        raise ValueError(
            f"האקסל מכיל {df.shape[1]} עמודות, אבל ציפינו לפחות {len(COLUMNS)}"
        )

    df = df.iloc[:, : len(COLUMNS)].copy()
    df.columns = COLUMNS

    # מסירים שורות ריקות לחלוטין
    df.dropna(how='all', inplace=True)

    # ממירים Timestamp ל-string (HH:MM) כדי שיתאים ל-JSON
    for col in df.columns:
        if pd.api.types.is_datetime64_any_dtype(df[col]):
            df[col] = df[col].dt.strftime('%H:%M')

    # ממירים ערכי זמן (timedelta / datetime.time) ל-string
    for col in df.columns:
        df[col] = df[col].apply(
            lambda v: str(v) if hasattr(v, 'strftime') or hasattr(v, 'seconds') else v
        )

    # מחליפים NaN ב-None
    df = df.where(pd.notnull(df), None)

    return df


def upload_to_supabase(df: pd.DataFrame) -> None:
    """מעלה את הנתונים ל-Supabase בחבילות של 100 שורות."""
    url = f'{SUPABASE_URL}/rest/v1/{TABLE_NAME}'
    records = df.to_dict(orient='records')
    batch_size = 100
    total = len(records)

    print(f"מעלה {total} שורות לטבלה '{TABLE_NAME}'...")

    for i in range(0, total, batch_size):
        batch = records[i : i + batch_size]
        # float NaN אינו JSON תקני — ממירים ל-None (=null)
        clean = [
            {k: (None if isinstance(v, float) and math.isnan(v) else v) for k, v in row.items()}
            for row in batch
        ]
        payload = json.dumps(clean, ensure_ascii=False).encode('utf-8')
        response = requests.post(url, headers=HEADERS, data=payload)

        if response.status_code not in (200, 201):
            raise RuntimeError(
                f"שגיאה בשורות {i + 1}–{min(i + batch_size, total)}: "
                f"{response.status_code} {response.text}"
            )

        print(f"  הועלו שורות {i + 1}–{min(i + batch_size, total)}")

    print("הסתיים בהצלחה!")


if __name__ == '__main__':
    df = load_excel(EXCEL_FILE_PATH)
    print(f"נטענו {len(df)} שורות מהאקסל.")
    print(df.head(3).to_string())
    upload_to_supabase(df)
