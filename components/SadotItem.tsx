'use client';
import type { SadotField } from '@/types';

export default function SadotItem({
  field,
  onLabelChange,
  onValueChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
}: {
  field: SadotField;
  onLabelChange: (key: string, label: string) => void;
  onValueChange: (key: string, value: string) => void;
  onDelete: (key: string) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 bg-white border rounded p-2 shadow-sm">
      {/* Up / Down buttons */}
      <div className="flex flex-col gap-0.5 shrink-0">
        <button
          onClick={onMoveUp}
          disabled={!canMoveUp || !onMoveUp}
          className="text-gray-400 hover:text-gray-700 disabled:opacity-20 text-xs leading-none px-0.5"
          title="הזז למעלה"
        >
          ▲
        </button>
        <button
          onClick={onMoveDown}
          disabled={!canMoveDown || !onMoveDown}
          className="text-gray-400 hover:text-gray-700 disabled:opacity-20 text-xs leading-none px-0.5"
          title="הזז למטה"
        >
          ▼
        </button>
      </div>

      <input
        value={field.label}
        onChange={(e) => onLabelChange(field.key, e.target.value)}
        className="flex-1 border-b border-gray-200 focus:outline-none text-sm text-gray-700 bg-transparent"
        placeholder="שם השדה"
      />

      <input
        value={field.value}
        onChange={(e) => onValueChange(field.key, e.target.value)}
        className="w-20 text-center border rounded px-1 py-0.5 text-sm text-blue-700 font-bold focus:outline-none focus:ring-1 focus:ring-blue-300"
        placeholder="שעה"
        dir="ltr"
      />

      <button
        onClick={() => onDelete(field.key)}
        className="text-red-400 hover:text-red-600 px-1 text-sm shrink-0"
        title="מחק שדה"
      >
        ✕
      </button>
    </div>
  );
}
