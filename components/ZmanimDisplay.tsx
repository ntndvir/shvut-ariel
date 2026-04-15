import type { SadotField } from '@/types';

function stripDaySuffix(label: string): string {
  return label.replace(/ — (שישי|שבת|חול)$/, '');
}

type ColumnDef = {
  prefix: string;
  title: string;
  headerClass: string;
  evenRowClass: string;
  valueClass: string;
};

const COLUMNS: ColumnDef[] = [
  {
    prefix: 'fri_',
    title: 'שישי',
    headerClass: 'bg-indigo-700 text-white',
    evenRowClass: 'bg-indigo-50',
    valueClass: 'text-indigo-800',
  },
  {
    prefix: 'shab_',
    title: 'שבת',
    headerClass: 'bg-amber-600 text-white',
    evenRowClass: 'bg-amber-50',
    valueClass: 'text-amber-800',
  },
  {
    prefix: 'chol_',
    title: 'חול',
    headerClass: 'bg-teal-700 text-white',
    evenRowClass: 'bg-teal-50',
    valueClass: 'text-teal-800',
  },
];

export default function ZmanimDisplay({
  parasha,
  taarichIvri,
  taarichLuazi,
  sadot,
}: {
  parasha: string;
  taarichIvri: string;
  taarichLuazi: string;
  sadot: SadotField[];
}) {
  const customFields = sadot.filter(
    (f) => !COLUMNS.some((col) => f.key.startsWith(col.prefix))
  );

  return (
    <div className="w-full">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-blue-800">{parasha}</h2>
        <p className="text-gray-600 text-sm mt-1">{taarichIvri} | {taarichLuazi}</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {COLUMNS.map((col) => {
          const fields = sadot.filter((f) => f.key.startsWith(col.prefix));
          if (fields.length === 0) return null;
          return (
            <div key={col.prefix} className="flex-1 rounded-xl overflow-hidden shadow-md">
              <div className={`${col.headerClass} text-center py-2 text-lg font-bold`}>
                {col.title}
              </div>
              <table className="w-full border-collapse">
                <tbody>
                  {fields.map((field, idx) => (
                    <tr
                      key={field.key}
                      className={idx % 2 === 0 ? col.evenRowClass : 'bg-white'}
                    >
                      <td className="py-2 px-3 text-gray-700 font-semibold text-base">
                        {stripDaySuffix(field.label)}
                      </td>
                      <td className={`py-2 px-3 font-bold text-lg ltr ${col.valueClass}`}>
                        {field.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>

      {customFields.length > 0 && (
        <div className="mt-4 rounded-xl overflow-hidden shadow-md">
          <div className="bg-gray-600 text-white text-center py-2 text-lg font-bold">נוסף</div>
          <table className="w-full border-collapse">
            <tbody>
              {customFields.map((field, idx) => (
                <tr key={field.key} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="py-2 px-3 text-gray-700 font-semibold text-base">{field.label}</td>
                  <td className="py-2 px-3 text-gray-800 font-bold text-lg ltr">{field.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
