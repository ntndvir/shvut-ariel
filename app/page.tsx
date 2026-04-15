import Link from 'next/link';
import { createServerClient } from '@/lib/supabase-server';
import ZmanimDisplay from '@/components/ZmanimDisplay';
import HodaotDisplay from '@/components/HodaotDisplay';
import type { LuachShavui, Hodaa } from '@/types';

export const revalidate = 60;

async function getPublishedLuach(): Promise<LuachShavui | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('luach_shavui')
    .select('*')
    .eq('is_published', true)
    .order('shavua_date', { ascending: false })
    .limit(1)
    .single();
  if (error || !data) return null;
  return data as LuachShavui;
}

async function getHodaot(): Promise<Hodaa[]> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('hodaot')
    .select('*')
    .order('created_at', { ascending: true });
  return (data as Hodaa[]) ?? [];
}

export default async function HomePage() {
  const [luach, hodaot] = await Promise.all([getPublishedLuach(), getHodaot()]);

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-blue-900 mb-8">
          זמני תפילות
          <br />
          <span className="text-xl font-semibold text-blue-700">בית כנסת שבות אריאל</span>
        </h1>

        {luach ? (
          <>
            <HodaotDisplay hodaot={hodaot} />
            <ZmanimDisplay
              parasha={luach.parasha}
              taarichIvri={luach.sadot.find((f) => f.key === 'taarikh_ivri')?.value ?? ''}
              taarichLuazi={luach.sadot.find((f) => f.key === 'taarikh_luazi')?.value ?? ''}
              sadot={luach.sadot.filter(
                (f) => f.key !== 'taarikh_ivri' && f.key !== 'taarikh_luazi'
              )}
            />
          </>
        ) : (
          <p className="text-center text-gray-500 mt-12">אין לוח שבועי פעיל כרגע</p>
        )}
      </div>
      <div className="text-center mt-12">
        <Link href="/admin" className="text-xs text-gray-400 hover:text-gray-600">
          כניסת העורך
        </Link>
      </div>
    </main>
  );
}
