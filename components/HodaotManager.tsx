'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { Hodaa } from '@/types';

const EMOJI_PRESETS = [
  { emoji: '📚', label: 'שיעור' },
  { emoji: '🎉', label: 'מזל טוב' },
  { emoji: '💒', label: 'חתונה' },
  { emoji: '📣', label: 'הודעה' },
  { emoji: '⚫', label: 'אבל' },
  { emoji: '🎊', label: 'בר מצווה' },
  { emoji: '🕍', label: 'ק"ק' },
  { emoji: '🍽️', label: 'סעודה' },
  { emoji: '🕯️', label: 'שבת/חג' },
  { emoji: '❤️', label: 'אירוע' },
  { emoji: '🔔', label: 'תזכורת' },
  { emoji: '📅', label: 'תאריך' },
];

export default function HodaotManager() {
  const [hodaot, setHodaot] = useState<Hodaa[]>([]);
  const [newText, setNewText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function fetchHodaot() {
    const { data, error: err } = await supabase
      .from('hodaot')
      .select('*')
      .order('created_at', { ascending: true });
    if (err) {
      setError('שגיאה בטעינת הודעות: ' + err.message);
    } else {
      setHodaot((data as Hodaa[]) ?? []);
    }
  }

  useEffect(() => { fetchHodaot(); }, []);

  function insertEmoji(emoji: string) {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? newText.length;
    const end = el?.selectionEnd ?? newText.length;
    const next = newText.slice(0, start) + emoji + newText.slice(end);
    setNewText(next);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const text = newText.trim();
    if (!text) return;
    setLoading(true);
    setError('');
    const res = await fetch('/api/hodaot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_ADMIN_PASSWORD}`,
      },
      body: JSON.stringify({ teken: text }),
    });
    const { error: err } = await res.json();
    if (err) {
      setError('שגיאה בהוספת הודעה: ' + err);
    } else {
      setNewText('');
      await fetchHodaot();
    }
    setLoading(false);
  }

  async function handleDelete(id: number) {
    const res = await fetch('/api/hodaot', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_ADMIN_PASSWORD}`,
      },
      body: JSON.stringify({ id }),
    });
    const { error: err } = await res.json();
    if (err) {
      setError('שגיאה במחיקת הודעה: ' + err);
    } else {
      setHodaot((prev) => prev.filter((h) => h.id !== id));
    }
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-red-500 text-sm">{error}</p>}

      {hodaot.length === 0 ? (
        <p className="text-gray-400 italic text-sm">אין הודעות כרגע</p>
      ) : (
        <ul className="space-y-2">
          {hodaot.map((h) => (
            <li
              key={h.id}
              className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded p-3"
            >
              <span className="flex-1 text-gray-800 text-sm whitespace-pre-wrap">{h.teken}</span>
              <button
                onClick={() => handleDelete(h.id)}
                className="text-red-400 hover:text-red-600 text-sm font-bold shrink-0"
                title="מחק הודעה"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-1.5 mb-2">
        {EMOJI_PRESETS.map(({ emoji, label }) => (
          <button
            key={emoji}
            type="button"
            onClick={() => insertEmoji(emoji)}
            className="flex items-center gap-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-full px-2 py-1 text-sm transition"
            title={label}
          >
            <span>{emoji}</span>
            <span className="text-gray-600 text-xs">{label}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleAdd} className="flex gap-2">
        <textarea
          ref={textareaRef}
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="הודעה חדשה..."
          rows={2}
          className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
        />
        <button
          type="submit"
          disabled={loading || !newText.trim()}
          className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold px-4 rounded transition disabled:opacity-50 shrink-0"
        >
          הוסף
        </button>
      </form>
    </div>
  );
}
