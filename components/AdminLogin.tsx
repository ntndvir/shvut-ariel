'use client';
import { useState } from 'react';

export default function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      sessionStorage.setItem('admin_auth', '1');
      onSuccess();
    } else {
      setError('סיסמה שגויה');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow p-8 w-full max-w-sm space-y-4"
      >
        <h1 className="text-2xl font-bold text-center text-blue-900">ניהול — שבות אריאל</h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="סיסמה"
          className="w-full border rounded px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-400"
          autoFocus
        />
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <button
          type="submit"
          className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 rounded transition"
        >
          כניסה
        </button>
      </form>
    </div>
  );
}
