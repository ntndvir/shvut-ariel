import type { Hodaa } from '@/types';

export default function HodaotDisplay({ hodaot }: { hodaot: Hodaa[] }) {
  if (hodaot.length === 0) return null;
  return (
    <div className="rounded-2xl overflow-hidden shadow-lg border border-amber-200 mb-8">
      <div className="bg-gradient-to-l from-amber-400 to-amber-500 px-5 py-3 flex items-center gap-3">
        <span className="text-2xl">📣</span>
        <h3 className="text-lg font-bold text-white">הודעות</h3>
      </div>
      <div className="bg-amber-50 divide-y divide-amber-100">
        {hodaot.map((h) => (
          <div
            key={h.id}
            className="flex items-start gap-3 px-5 py-4 hover:bg-amber-100 transition-colors"
          >
            <div className="border-r-4 border-amber-400 pr-3 flex-1">
              <p className="text-gray-800 text-base leading-relaxed whitespace-pre-wrap">
                {h.teken}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
