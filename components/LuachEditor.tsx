'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { zmanimRowToSadot } from '@/lib/zmanim-utils';
import SadotList from './SadotList';
import type { LuachShavui, SadotField, ZmanimRow } from '@/types';

function luaziToSortKey(d: string): number {
  const [dd, mm, yyyy] = d.split('/');
  return parseInt(`${yyyy}${mm}${dd}`, 10);
}

export default function LuachEditor() {
  const [luach, setLuach] = useState<LuachShavui | null>(null);
  const [sadot, setSadot] = useState<SadotField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [zmanimRows, setZmanimRows] = useState<ZmanimRow[]>([]);
  const [zmanimIndex, setZmanimIndex] = useState(-1);
  const customCounterRef = useRef(0);

  // Fetch all zmanim rows on mount and sort them
  useEffect(() => {
    async function fetchZmanim() {
      const { data } = await supabase.from('zmanim').select('*');
      if (data && data.length > 0) {
        const sorted = (data as ZmanimRow[]).sort(
          (a, b) => luaziToSortKey(a.taarikh_luazi) - luaziToSortKey(b.taarikh_luazi)
        );
        setZmanimRows(sorted);
      }
    }
    fetchZmanim();
  }, []);

  const loadLatestLuach = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('luach_shavui')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (error && error.code !== 'PGRST116') {
      setStatus('שגיאה בטעינת הלוח: ' + error.message);
    } else if (data) {
      setLuach(data as LuachShavui);
      setSadot((data as LuachShavui).sadot ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadLatestLuach(); }, [loadLatestLuach]);

  // Sync index when luach or zmanimRows change
  useEffect(() => {
    if (!luach || zmanimRows.length === 0) return;
    const idx = zmanimRows.findIndex((r) => {
      const [dd, mm, yyyy] = r.taarikh_luazi.split('/');
      return `${yyyy}-${mm}-${dd}` === luach.shavua_date;
    });
    if (idx !== -1) setZmanimIndex(idx);
  }, [luach, zmanimRows]);

  async function loadForRow(row: ZmanimRow) {
    setLoading(true);
    let statusMsg = '';

    const parasha = row.parasha ?? '';
    const sadotNew: SadotField[] = zmanimRowToSadot(row);

    // Convert DD/MM/YYYY → YYYY-MM-DD
    const [dd, mm, yyyy] = row.taarikh_luazi.split('/');
    const shavuaDate = `${yyyy}-${mm}-${dd}`;

    // Check if a luach already exists for this date
    const { data: existing } = await supabase
      .from('luach_shavui')
      .select('*')
      .eq('shavua_date', shavuaDate)
      .limit(1)
      .single();

    if (existing) {
      setLuach(existing as LuachShavui);
      setSadot((existing as LuachShavui).sadot ?? []);
      setStatus('נטען לוח קיים ל' + row.parasha);
      setLoading(false);
      return;
    }

    const { data: inserted, error } = await supabase
      .from('luach_shavui')
      .insert({
        shavua_date: shavuaDate,
        parasha,
        sadot: sadotNew,
        is_published: false,
        auto_load: true,
      })
      .select()
      .single();

    if (error) {
      statusMsg = 'שגיאה ביצירת הלוח: ' + error.message;
    } else if (inserted) {
      setLuach(inserted as LuachShavui);
      setSadot((inserted as LuachShavui).sadot ?? []);
      if (!statusMsg) statusMsg = 'הלוח נטען בהצלחה';
    }

    setStatus(statusMsg);
    setLoading(false);
  }

  function handlePrev() {
    const i = zmanimIndex - 1;
    setZmanimIndex(i);
    loadForRow(zmanimRows[i]);
  }

  function handleNext() {
    const i = zmanimIndex + 1;
    setZmanimIndex(i);
    loadForRow(zmanimRows[i]);
  }

  async function handleSave() {
    if (!luach) return;
    setSaving(true);
    const { error } = await supabase
      .from('luach_shavui')
      .update({ sadot })
      .eq('id', luach.id);
    setSaving(false);
    setStatus(error ? 'שגיאה בשמירה: ' + error.message : 'נשמר ✓');
  }

  async function handlePublish() {
    if (!luach) return;
    setSaving(true);
    await supabase.from('luach_shavui').update({ is_published: false }).neq('id', luach.id);
    const { error } = await supabase
      .from('luach_shavui')
      .update({ sadot, is_published: true })
      .eq('id', luach.id);
    setSaving(false);
    if (error) {
      setStatus('שגיאה בפרסום: ' + error.message);
    } else {
      setLuach({ ...luach, is_published: true });
      setStatus('פורסם ✓');
    }
  }

  async function handleToggleAutoLoad() {
    if (!luach) return;
    const newVal = !luach.auto_load;
    const { error } = await supabase
      .from('luach_shavui')
      .update({ auto_load: newVal })
      .eq('id', luach.id);
    if (error) {
      setStatus('שגיאה בעדכון: ' + error.message);
    } else {
      setLuach({ ...luach, auto_load: newVal });
    }
  }

  function handleAddField() {
    customCounterRef.current += 1;
    const key = `custom_${customCounterRef.current}`;
    setSadot([...sadot, { key, label: '', value: '' }]);
  }

  if (loading) return <p className="text-gray-400 italic">טוען...</p>;

  return (
    <div className="space-y-4">
      {/* Navigation bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 flex-1 min-w-0 border rounded-lg px-3 py-2 bg-white shadow-sm" dir="ltr">
          <button
            onClick={handlePrev}
            disabled={zmanimIndex <= 0 || loading}
            className="text-xl font-bold text-blue-600 hover:text-blue-800 disabled:opacity-30 disabled:cursor-not-allowed px-1"
          >
            ←
          </button>
          <div className="flex-1 text-center text-sm font-semibold" dir="rtl">
            {zmanimRows[zmanimIndex]
              ? `${zmanimRows[zmanimIndex].parasha} | ${zmanimRows[zmanimIndex].taarikh_luazi}`
              : zmanimRows.length === 0
              ? 'טוען פרשות...'
              : 'בחר פרשה'}
            {zmanimRows.length > 0 && zmanimIndex >= 0 && (
              <span className="text-gray-400 text-xs mr-2">
                ({zmanimIndex + 1}/{zmanimRows.length})
              </span>
            )}
          </div>
          <button
            onClick={handleNext}
            disabled={zmanimIndex >= zmanimRows.length - 1 || loading}
            className="text-xl font-bold text-blue-600 hover:text-blue-800 disabled:opacity-30 disabled:cursor-not-allowed px-1"
          >
            →
          </button>
        </div>

        {luach && (
          <>
            <button
              onClick={handleToggleAutoLoad}
              className={`px-4 py-2 rounded border font-medium transition ${
                luach.auto_load
                  ? 'bg-green-50 border-green-400 text-green-700'
                  : 'bg-gray-50 border-gray-300 text-gray-500'
              }`}
            >
              טעינה אוטומטית: {luach.auto_load ? 'פעיל' : 'כבוי'}
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition disabled:opacity-60"
            >
              שמור
            </button>

            <button
              onClick={handlePublish}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded transition disabled:opacity-60"
            >
              פרסם
            </button>
          </>
        )}
      </div>

      {/* Status message */}
      {status && <p className="text-sm text-blue-700">{status}</p>}

      {/* Luach info line */}
      {luach && (
        <div className="text-sm text-gray-500">
          {luach.parasha} | {luach.shavua_date}
          {luach.is_published && (
            <span className="mr-2 text-emerald-600 font-semibold">● מפורסם</span>
          )}
        </div>
      )}

      {/* Sadot editor */}
      {luach && (
        <>
          <SadotList sadot={sadot} onChange={setSadot} />
          <button
            onClick={handleAddField}
            className="mt-2 text-blue-600 hover:text-blue-800 text-sm underline"
          >
            + הוסף שדה
          </button>
        </>
      )}

      {!luach && (
        <p className="text-gray-400 italic">אין לוח. השתמש בחיצים לבחור פרשה.</p>
      )}
    </div>
  );
}
