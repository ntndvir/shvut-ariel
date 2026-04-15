'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminLogin from '@/components/AdminLogin';
import LuachEditor from '@/components/LuachEditor';
import HodaotManager from '@/components/HodaotManager';
import ActionButtons from '@/components/ActionButtons';

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (sessionStorage.getItem('admin_auth') === '1') setAuthed(true);
    setChecking(false);
  }, []);

  if (checking) return null;
  if (!authed) return <AdminLogin onSuccess={() => setAuthed(true)} />;

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-900">ניהול — שבות אריאל</h1>
          <div className="flex gap-4 items-center">
            <Link href="/" className="text-sm text-blue-600 hover:text-blue-800 underline">
              תצוגה
            </Link>
            <button
              onClick={() => { sessionStorage.removeItem('admin_auth'); setAuthed(false); }}
              className="text-sm text-gray-500 hover:text-red-500 underline"
            >
              התנתק
            </button>
          </div>
        </div>

        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">א — לוח שבועי</h2>
          <LuachEditor />
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">ב — הודעות</h2>
          <HodaotManager />
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">ג — פעולות</h2>
          <ActionButtons />
        </section>
      </div>
    </main>
  );
}
