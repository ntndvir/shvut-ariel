'use client';
import type { SadotField } from '@/types';
import SadotItem from './SadotItem';

const DATE_KEYS = new Set(['taarikh_ivri', 'taarikh_luazi']);

const SECTIONS = [
  { prefix: 'fri_',  title: 'שישי', headerClass: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { prefix: 'shab_', title: 'שבת',  headerClass: 'bg-amber-100 text-amber-800 border-amber-200' },
  { prefix: 'chol_', title: 'חול',  headerClass: 'bg-teal-100 text-teal-800 border-teal-200' },
];

function sectionPrefix(key: string): string | null {
  for (const s of ['fri_', 'shab_', 'chol_']) if (key.startsWith(s)) return s;
  return null;
}

export default function SadotList({
  sadot,
  onChange,
}: {
  sadot: SadotField[];
  onChange: (sadot: SadotField[]) => void;
}) {
  function updateLabel(key: string, label: string) {
    onChange(sadot.map((f) => (f.key === key ? { ...f, label } : f)));
  }

  function updateValue(key: string, value: string) {
    onChange(sadot.map((f) => (f.key === key ? { ...f, value } : f)));
  }

  function deleteField(key: string) {
    onChange(sadot.filter((f) => f.key !== key));
  }

  function moveUp(key: string) {
    const idx = sadot.findIndex((f) => f.key === key);
    const pfx = sectionPrefix(sadot[idx].key);
    if (!pfx) return;
    let prevIdx = -1;
    for (let i = idx - 1; i >= 0; i--) {
      if (sadot[i].key.startsWith(pfx)) { prevIdx = i; break; }
    }
    if (prevIdx === -1) return;
    const next = [...sadot];
    [next[prevIdx], next[idx]] = [next[idx], next[prevIdx]];
    onChange(next);
  }

  function moveDown(key: string) {
    const idx = sadot.findIndex((f) => f.key === key);
    const pfx = sectionPrefix(sadot[idx].key);
    if (!pfx) return;
    let nextIdx = -1;
    for (let i = idx + 1; i < sadot.length; i++) {
      if (sadot[i].key.startsWith(pfx)) { nextIdx = i; break; }
    }
    if (nextIdx === -1) return;
    const next = [...sadot];
    [next[idx], next[nextIdx]] = [next[nextIdx], next[idx]];
    onChange(next);
  }

  const dateFields = sadot.filter((f) => DATE_KEYS.has(f.key));

  return (
    <div className="space-y-4">
      {/* Date fields — always at top, no reorder buttons */}
      {dateFields.length > 0 && (
        <div className="space-y-2">
          {dateFields.map((field) => (
            <SadotItem
              key={field.key}
              field={field}
              onLabelChange={updateLabel}
              onValueChange={updateValue}
              onDelete={deleteField}
            />
          ))}
        </div>
      )}

      {/* Three day sections */}
      {SECTIONS.map((sec) => {
        const fields = sadot.filter((f) => f.key.startsWith(sec.prefix));
        if (fields.length === 0) return null;
        return (
          <div key={sec.prefix} className={`rounded-lg border ${sec.headerClass.split(' ').find(c => c.startsWith('border-'))}`}>
            <div className={`px-3 py-1.5 text-sm font-bold rounded-t-lg ${sec.headerClass}`}>
              {sec.title}
            </div>
            <div className="space-y-1.5 p-2 bg-white rounded-b-lg">
              {fields.map((field, i) => (
                <SadotItem
                  key={field.key}
                  field={field}
                  onLabelChange={updateLabel}
                  onValueChange={updateValue}
                  onDelete={deleteField}
                  onMoveUp={() => moveUp(field.key)}
                  onMoveDown={() => moveDown(field.key)}
                  canMoveUp={i > 0}
                  canMoveDown={i < fields.length - 1}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Other custom fields (key doesn't match any prefix) */}
      {(() => {
        const others = sadot.filter((f) => !DATE_KEYS.has(f.key) && !sectionPrefix(f.key));
        if (others.length === 0) return null;
        return (
          <div className="rounded-lg border border-gray-200">
            <div className="px-3 py-1.5 text-sm font-bold rounded-t-lg bg-gray-100 text-gray-700">
              נוסף
            </div>
            <div className="space-y-1.5 p-2 bg-white rounded-b-lg">
              {others.map((field) => (
                <SadotItem
                  key={field.key}
                  field={field}
                  onLabelChange={updateLabel}
                  onValueChange={updateValue}
                  onDelete={deleteField}
                />
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
