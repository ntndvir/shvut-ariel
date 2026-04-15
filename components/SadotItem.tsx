'use client';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { SadotField } from '@/types';

export default function SadotItem({
  field,
  onLabelChange,
  onValueChange,
  onDelete,
}: {
  field: SadotField;
  onLabelChange: (key: string, label: string) => void;
  onValueChange: (key: string, value: string) => void;
  onDelete: (key: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: field.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 bg-white border rounded p-2 shadow-sm"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-gray-400 hover:text-gray-600 px-1 text-lg select-none"
        title="גרור לשינוי סדר"
      >
        ⠿
      </button>

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
        className="text-red-400 hover:text-red-600 px-1 text-sm"
        title="מחק שדה"
      >
        ✕
      </button>
    </div>
  );
}
