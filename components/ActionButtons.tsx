'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { buildWhatsAppText } from '@/lib/whatsapp-utils';
import type { LuachShavui, Hodaa } from '@/types';

export default function ActionButtons() {
  const [luach, setLuach] = useState<LuachShavui | null>(null);
  const [hodaot, setHodaot] = useState<Hodaa[]>([]);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      const [{ data: luachData, error: luachErr }, { data: hodaotData, error: hodaotErr }] =
        await Promise.all([
          supabase
            .from('luach_shavui')
            .select('*')
            .eq('is_published', true)
            .order('shavua_date', { ascending: false })
            .limit(1)
            .single(),
          supabase.from('hodaot').select('*').order('created_at', { ascending: true }),
        ]);

      if (luachErr && luachErr.code !== 'PGRST116') {
        setError('שגיאה בטעינת הנתונים');
        return;
      }
      if (hodaotErr) {
        setError('שגיאה בטעינת ההודעות');
        return;
      }

      if (luachData) setLuach(luachData as LuachShavui);
      setHodaot((hodaotData as Hodaa[]) ?? []);
    }
    load();
  }, []);

  async function handlePDF() {
    if (!luach) return;
    setPdfLoading(true);
    setError('');
    try {
      const { generateAndDownloadPDF } = await import('@/lib/pdf-utils');
      generateAndDownloadPDF(luach, hodaot);
    } catch {
      setError('שגיאה ביצירת PDF');
    } finally {
      setPdfLoading(false);
    }
  }

  function handleWhatsApp() {
    if (!luach) return;
    const text = buildWhatsAppText(luach);
    if (!text) {
      setError('אין זמנים לשליחה');
      return;
    }
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  }

  if (!luach) {
    return <p className="text-gray-400 italic text-sm">אין לוח מפורסם — פרסם תחילה</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handlePDF}
          disabled={pdfLoading}
          className="bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2 rounded transition disabled:opacity-60"
        >
          {pdfLoading ? 'מייצר PDF...' : 'הדפס PDF'}
        </button>

        <button
          onClick={handleWhatsApp}
          className="bg-green-500 hover:bg-green-600 text-white font-bold px-5 py-2 rounded transition"
        >
          שלח וואטסאפ 📱
        </button>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}
