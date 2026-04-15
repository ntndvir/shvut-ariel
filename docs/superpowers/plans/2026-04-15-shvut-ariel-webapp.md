# Shvut Ariel Web App — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js web app for Beit Knesset Shvut Ariel — a public prayer-times display page and a password-protected admin panel for managing weekly schedules and announcements.

**Architecture:** Next.js 15 App Router. Public `/` is a Server Component that fetches from Supabase. Admin `/admin` is a Client Component with password gate. Supabase anon key used throughout — no SSR cookie session needed.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, @supabase/supabase-js, @dnd-kit/sortable (drag-and-drop), jspdf (PDF export)

---

## File Map

```
app/
  layout.tsx              Root layout — RTL, Hebrew font (Heebo from Google Fonts)
  globals.css             Tailwind base + RTL body
  page.tsx                Public display — Server Component
  admin/
    page.tsx              Admin shell — password gate + tabbed sections

components/
  ZmanimDisplay.tsx       Renders sadot[] list (public view)
  HodaotDisplay.tsx       Renders hodaot list (public view)
  AdminLogin.tsx          Password form (client)
  LuachEditor.tsx         Full luach admin section (client) — loads week, edits sadot, publishes
  SadotList.tsx           DnD sortable list of sadot fields
  SadotItem.tsx           Single editable/deletable sadot row
  HodaotManager.tsx       Announcements CRUD (client)
  ActionButtons.tsx       PDF + WhatsApp buttons (client)

lib/
  supabase.ts             createClient() — singleton browser client
  supabase-server.ts      createServerClient() — for Server Components (no cookies)
  zmanim-labels.ts        Map of column key → Hebrew label
  zmanim-utils.ts         nextShabbatDate(), zmanimRowToSadot(), findCurrentLuach()
  pdf-utils.ts            generatePDF(luach, hodaot)
  whatsapp-utils.ts       buildWhatsAppText(sadot)

types/
  index.ts                SadotField, LuachShavui, Hodaa, ZmanimRow
```

---

## Task 1: Bootstrap Next.js Project

**Files:**
- Create: `app/layout.tsx`, `app/globals.css`, `app/page.tsx` (placeholder), `lib/supabase.ts`, `lib/supabase-server.ts`, `types/index.ts`

- [ ] **Step 1: Scaffold Next.js app**

Run inside `C:\Users\ariel\Documents\shvut-ariel`:

```bash
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*" --no-git
```

When prompted — answer: Yes to TypeScript, Yes to ESLint, Yes to Tailwind, No to src/, Yes to App Router, Yes to `@/*` alias.

Expected: `package.json`, `app/`, `public/`, `next.config.ts` created.

- [ ] **Step 2: Install additional dependencies**

```bash
npm install @supabase/supabase-js @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities jspdf
```

Expected: packages appear in `node_modules/`.

- [ ] **Step 3: Create `.env.local`**

Create `C:\Users\ariel\Documents\shvut-ariel\.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://hqnnisuilubxpqjkvmju.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhxbm5pc3VpbHVieHBxamt2bWp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMTQ3NDcsImV4cCI6MjA5MTc5MDc0N30.y3gu_Zevl1vKxjJUXFVPsLG4-jJag8t66uZTDcrjGfY
NEXT_PUBLIC_ADMIN_PASSWORD=shvut2024
```

- [ ] **Step 4: Write types**

Create `types/index.ts`:

```ts
export type SadotField = {
  key: string;    // e.g. "fri_shacharit_a" or custom "extra_1"
  label: string;  // Hebrew display name
  value: string;  // time or free text
};

export type LuachShavui = {
  id: number;
  shavua_date: string;       // ISO date string YYYY-MM-DD
  parasha: string;
  sadot: SadotField[];
  is_published: boolean;
  auto_load: boolean;
  created_at: string;
};

export type Hodaa = {
  id: number;
  teken: string;
  created_at: string;
};

export type ZmanimRow = {
  parasha: string;
  taarikh_ivri: string;
  taarikh_luazi: string;     // DD/MM/YYYY
  fri_shacharit_a: string | null;
  fri_shacharit_b: string | null;
  fri_mincha_gdola: string | null;
  fri_tfila_mukdemet: string | null;
  fri_plag: string | null;
  fri_knisa_shabbat: string | null;
  fri_tchilat_tfila: string | null;
  shab_vatikin: string | null;
  shab_zricha: string | null;
  shab_minyan_mukdam: string | null;
  shab_minyan_markazi: string | null;
  shab_tfila_yeladim: string | null;
  shab_shiur_nashim: string | null;
  shab_daf_yomi: string | null;
  shab_horim_yeladim: string | null;
  shab_mincha: string | null;
  shab_yetsia: string | null;
  chol_shacharit_a: string | null;
  chol_shacharit_b: string | null;
  chol_mincha: string | null;
  chol_maariv_a: string | null;
  chol_maariv_b: string | null;
};
```

- [ ] **Step 5: Write Supabase clients**

Create `lib/supabase.ts` (browser client, singleton):

```ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

Create `lib/supabase-server.ts` (for Server Components — no cookie handling needed):

```ts
import { createClient } from '@supabase/supabase-js';

export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 6: Configure root layout with RTL and Hebrew font**

Replace `app/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import { Heebo } from 'next/font/google';
import './globals.css';

const heebo = Heebo({ subsets: ['hebrew'], display: 'swap' });

export const metadata: Metadata = {
  title: 'זמני תפילות — שבות אריאל',
  description: 'זמני תפילות בית כנסת שבות אריאל',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className={heebo.className}>{children}</body>
    </html>
  );
}
```

Replace `app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  direction: rtl;
}
```

- [ ] **Step 7: Verify dev server starts**

```bash
npm run dev
```

Expected: `http://localhost:3000` responds (default Next.js page or blank). No TypeScript errors.

---

## Task 2: Utility Libraries

**Files:**
- Create: `lib/zmanim-labels.ts`, `lib/zmanim-utils.ts`, `lib/whatsapp-utils.ts`

- [ ] **Step 1: Write Hebrew labels map**

Create `lib/zmanim-labels.ts`:

```ts
import type { ZmanimRow } from '@/types';

export const ZMANIM_LABELS: Record<keyof Omit<ZmanimRow, 'taarikh_ivri' | 'taarikh_luazi'>, string> = {
  parasha:            'פרשת השבוע',
  fri_shacharit_a:    'שחרית א׳ — שישי',
  fri_shacharit_b:    'שחרית ב׳ — שישי',
  fri_mincha_gdola:   'מנחה גדולה — שישי',
  fri_tfila_mukdemet: 'תפילה מוקדמת — שישי',
  fri_plag:           'פלג המנחה — שישי',
  fri_knisa_shabbat:  'כניסת שבת',
  fri_tchilat_tfila:  'תחילת תפילה — שישי',
  shab_vatikin:       'ותיקין — שבת',
  shab_zricha:        'זריחה — שבת',
  shab_minyan_mukdam: 'מניין מוקדם — שבת',
  shab_minyan_markazi:'מניין מרכזי — שבת',
  shab_tfila_yeladim: 'תפילת ילדים — שבת',
  shab_shiur_nashim:  'שיעור נשים — שבת',
  shab_daf_yomi:      'דף יומי — שבת',
  shab_horim_yeladim: 'הורים וילדים — שבת',
  shab_mincha:        'מנחה — שבת',
  shab_yetsia:        'יציאת שבת',
  chol_shacharit_a:   'שחרית א׳ — חול',
  chol_shacharit_b:   'שחרית ב׳ — חול',
  chol_mincha:        'מנחה — חול',
  chol_maariv_a:      'מעריב א׳ — חול',
  chol_maariv_b:      'מעריב ב׳ — חול',
};

export const ZMANIM_COLUMN_ORDER = Object.keys(ZMANIM_LABELS) as Array<keyof typeof ZMANIM_LABELS>;
```

- [ ] **Step 2: Write zmanim utilities**

Create `lib/zmanim-utils.ts`:

```ts
import type { ZmanimRow, SadotField } from '@/types';
import { ZMANIM_LABELS, ZMANIM_COLUMN_ORDER } from './zmanim-labels';

/** Returns next Saturday as DD/MM/YYYY */
export function nextShabbatDate(): string {
  const today = new Date();
  const day = today.getDay(); // 0=Sun … 6=Sat
  const daysUntilSat = day === 6 ? 7 : 6 - day; // if today is Sat, get next Sat
  const sat = new Date(today);
  sat.setDate(today.getDate() + daysUntilSat);
  const dd = String(sat.getDate()).padStart(2, '0');
  const mm = String(sat.getMonth() + 1).padStart(2, '0');
  const yyyy = sat.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/** Converts a ZmanimRow to an ordered SadotField[] (omits nulls) */
export function zmanimRowToSadot(row: ZmanimRow): SadotField[] {
  return ZMANIM_COLUMN_ORDER
    .filter((key) => row[key] != null && row[key] !== '')
    .map((key) => ({
      key,
      label: ZMANIM_LABELS[key],
      value: String(row[key]),
    }));
}
```

- [ ] **Step 3: Write WhatsApp utility**

Create `lib/whatsapp-utils.ts`:

```ts
import type { SadotField } from '@/types';

const CHOL_KEYS = [
  'chol_shacharit_a',
  'chol_shacharit_b',
  'chol_mincha',
  'chol_maariv_a',
  'chol_maariv_b',
];

/** Builds the WhatsApp message text from the week's sadot */
export function buildWhatsAppText(sadot: SadotField[]): string {
  const lines = ['זמני חול בבית כנסת שבות אריאל', ''];
  const cholFields = sadot.filter((f) => CHOL_KEYS.includes(f.key));
  for (const field of cholFields) {
    lines.push(`${field.label}: ${field.value}`);
  }
  return lines.join('\n');
}
```

---

## Task 3: Public Page

**Files:**
- Create: `components/ZmanimDisplay.tsx`, `components/HodaotDisplay.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Write ZmanimDisplay component**

Create `components/ZmanimDisplay.tsx`:

```tsx
import type { SadotField } from '@/types';

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
  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-blue-800">{parasha}</h2>
        <p className="text-gray-600 text-sm mt-1">{taarichIvri} | {taarichLuazi}</p>
      </div>
      <table className="w-full border-collapse">
        <tbody>
          {sadot.map((field) => (
            <tr key={field.key} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-2 px-3 text-gray-700 font-medium">{field.label}</td>
              <td className="py-2 px-3 text-blue-700 font-bold text-left ltr">{field.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Write HodaotDisplay component**

Create `components/HodaotDisplay.tsx`:

```tsx
import type { Hodaa } from '@/types';

export default function HodaotDisplay({ hodaot }: { hodaot: Hodaa[] }) {
  if (hodaot.length === 0) return null;
  return (
    <div className="w-full max-w-lg mx-auto mt-8">
      <h3 className="text-lg font-bold text-gray-800 mb-3 border-b pb-2">הודעות</h3>
      <ul className="space-y-2">
        {hodaot.map((h) => (
          <li key={h.id} className="bg-yellow-50 border border-yellow-200 rounded p-3 text-gray-800">
            {h.teken}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 3: Write public page**

Replace `app/page.tsx`:

```tsx
import { createServerClient } from '@/lib/supabase-server';
import ZmanimDisplay from '@/components/ZmanimDisplay';
import HodaotDisplay from '@/components/HodaotDisplay';
import type { LuachShavui, Hodaa } from '@/types';

export const revalidate = 60; // revalidate every 60 seconds

async function getPublishedLuach(): Promise<LuachShavui | null> {
  const supabase = createServerClient();
  const today = new Date().toISOString().split('T')[0];
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
      <div className="max-w-lg mx-auto">
        <h1 className="text-3xl font-bold text-center text-blue-900 mb-8">
          זמני תפילות
          <br />
          <span className="text-xl font-semibold text-blue-700">בית כנסת שבות אריאל</span>
        </h1>

        {luach ? (
          <>
            <ZmanimDisplay
              parasha={luach.parasha}
              taarichIvri={
                (luach.sadot.find((f) => f.key === 'taarikh_ivri')?.value) ?? ''
              }
              taarichLuazi={
                (luach.sadot.find((f) => f.key === 'taarikh_luazi')?.value) ?? ''
              }
              sadot={luach.sadot.filter(
                (f) => f.key !== 'parasha' && f.key !== 'taarikh_ivri' && f.key !== 'taarikh_luazi'
              )}
            />
            <HodaotDisplay hodaot={hodaot} />
          </>
        ) : (
          <p className="text-center text-gray-500">אין לוח שבועי פעיל כרגע</p>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Verify public page renders**

```bash
npm run dev
```

Open `http://localhost:3000`. Expected: header shows "זמני תפילות — בית כנסת שבות אריאל". If DB has a published luach, times display. No console errors.

---

## Task 4: Admin Login Gate

**Files:**
- Create: `components/AdminLogin.tsx`, `app/admin/page.tsx`

- [ ] **Step 1: Write AdminLogin component**

Create `components/AdminLogin.tsx`:

```tsx
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
```

- [ ] **Step 2: Create admin page scaffold**

Create `app/admin/page.tsx` (this file will grow in later tasks — start with the auth shell):

```tsx
'use client';
import { useEffect, useState } from 'react';
import AdminLogin from '@/components/AdminLogin';
import LuachEditor from '@/components/LuachEditor';
import HodaotManager from '@/components/HodaotManager';
import ActionButtons from '@/components/ActionButtons';
import type { LuachShavui, Hodaa } from '@/types';

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);

  // Persist auth in sessionStorage so refresh keeps you logged in
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
          <button
            onClick={() => { sessionStorage.removeItem('admin_auth'); setAuthed(false); }}
            className="text-sm text-gray-500 hover:text-red-500 underline"
          >
            יציאה
          </button>
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
```

Note: `LuachEditor`, `HodaotManager`, and `ActionButtons` are stub components until Tasks 5–7. Create temporary stubs now so the page compiles:

Create `components/LuachEditor.tsx` (stub):
```tsx
'use client';
export default function LuachEditor() {
  return <div className="text-gray-400 italic">טוען עורך לוח...</div>;
}
```

Create `components/HodaotManager.tsx` (stub):
```tsx
'use client';
export default function HodaotManager() {
  return <div className="text-gray-400 italic">טוען ניהול הודעות...</div>;
}
```

Create `components/ActionButtons.tsx` (stub):
```tsx
'use client';
export default function ActionButtons() {
  return <div className="text-gray-400 italic">כפתורי פעולה...</div>;
}
```

- [ ] **Step 3: Verify admin login works**

```bash
npm run dev
```

Open `http://localhost:3000/admin`. Expected: password form appears. Enter `shvut2024` → redirects to admin page showing three sections with stub text. Wrong password → "סיסמה שגויה".

---

## Task 5: LuachEditor — Full Implementation

**Files:**
- Replace: `components/LuachEditor.tsx`
- Create: `components/SadotList.tsx`, `components/SadotItem.tsx`

- [ ] **Step 1: Write SadotItem**

Create `components/SadotItem.tsx`:

```tsx
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
```

- [ ] **Step 2: Write SadotList**

Create `components/SadotList.tsx`:

```tsx
'use client';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import type { SadotField } from '@/types';
import SadotItem from './SadotItem';

export default function SadotList({
  sadot,
  onChange,
}: {
  sadot: SadotField[];
  onChange: (sadot: SadotField[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = sadot.findIndex((f) => f.key === active.id);
      const newIndex = sadot.findIndex((f) => f.key === over.id);
      onChange(arrayMove(sadot, oldIndex, newIndex));
    }
  }

  function updateLabel(key: string, label: string) {
    onChange(sadot.map((f) => (f.key === key ? { ...f, label } : f)));
  }

  function updateValue(key: string, value: string) {
    onChange(sadot.map((f) => (f.key === key ? { ...f, value } : f)));
  }

  function deleteField(key: string) {
    onChange(sadot.filter((f) => f.key !== key));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={sadot.map((f) => f.key)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {sadot.map((field) => (
            <SadotItem
              key={field.key}
              field={field}
              onLabelChange={updateLabel}
              onValueChange={updateValue}
              onDelete={deleteField}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
```

- [ ] **Step 3: Write full LuachEditor**

Replace `components/LuachEditor.tsx`:

```tsx
'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { nextShabbatDate, zmanimRowToSadot } from '@/lib/zmanim-utils';
import SadotList from './SadotList';
import type { LuachShavui, SadotField, ZmanimRow } from '@/types';

let customCounter = 0;

export default function LuachEditor() {
  const [luach, setLuach] = useState<LuachShavui | null>(null);
  const [sadot, setSadot] = useState<SadotField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  // Load latest luach (published or not)
  const loadLatestLuach = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('luach_shavui')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (data) {
      setLuach(data as LuachShavui);
      setSadot((data as LuachShavui).sadot ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadLatestLuach(); }, [loadLatestLuach]);

  async function handleLoadWeek() {
    setLoading(true);
    setStatus('');
    const shabbat = nextShabbatDate();
    const { data: rows } = await supabase
      .from('zmanim')
      .select('*')
      .eq('taarikh_luazi', shabbat);

    let sadotNew: SadotField[];
    let parasha = '';

    if (rows && rows.length > 0) {
      const row = rows[0] as ZmanimRow;
      parasha = row.parasha ?? '';
      sadotNew = zmanimRowToSadot(row);
    } else {
      // No exact match — create empty shell
      sadotNew = [];
      setStatus(`לא נמצאו זמנים לשבת ${shabbat} — נוצר לוח ריק`);
    }

    // Convert shabbat date DD/MM/YYYY → YYYY-MM-DD for shavua_date
    const [dd, mm, yyyy] = shabbat.split('/');
    const shavuaDate = `${yyyy}-${mm}-${dd}`;

    const { data: inserted, error } = await supabase
      .from('luach_shavui')
      .insert({
        shavua_date: shavuaDate,
        parasha,
        sadot: sadotNew,
        is_published: false,
        auto_load: true,
      })
      .select()
      .single();

    if (error) {
      setStatus('שגיאה ביצירת הלוח: ' + error.message);
    } else {
      setLuach(inserted as LuachShavui);
      setSadot((inserted as LuachShavui).sadot ?? []);
      if (!status) setStatus('הלוח נטען בהצלחה');
    }
    setLoading(false);
  }

  async function handleSave() {
    if (!luach) return;
    setSaving(true);
    const { error } = await supabase
      .from('luach_shavui')
      .update({ sadot })
      .eq('id', luach.id);
    setSaving(false);
    setStatus(error ? 'שגיאה בשמירה: ' + error.message : 'נשמר ✓');
  }

  async function handlePublish() {
    if (!luach) return;
    setSaving(true);
    // Unpublish all others first
    await supabase.from('luach_shavui').update({ is_published: false }).neq('id', luach.id);
    const { error } = await supabase
      .from('luach_shavui')
      .update({ sadot, is_published: true })
      .eq('id', luach.id);
    setSaving(false);
    if (error) {
      setStatus('שגיאה בפרסום: ' + error.message);
    } else {
      setLuach({ ...luach, is_published: true });
      setStatus('פורסם ✓');
    }
  }

  async function handleToggleAutoLoad() {
    if (!luach) return;
    const newVal = !luach.auto_load;
    await supabase.from('luach_shavui').update({ auto_load: newVal }).eq('id', luach.id);
    setLuach({ ...luach, auto_load: newVal });
  }

  function handleAddField() {
    customCounter += 1;
    const key = `custom_${customCounter}`;
    setSadot([...sadot, { key, label: '', value: '' }]);
  }

  if (loading) return <p className="text-gray-400 italic">טוען...</p>;

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={handleLoadWeek}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded transition"
        >
          טען שבוע חדש
        </button>

        {luach && (
          <>
            <button
              onClick={handleToggleAutoLoad}
              className={`px-4 py-2 rounded border font-medium transition ${
                luach.auto_load
                  ? 'bg-green-50 border-green-400 text-green-700'
                  : 'bg-gray-50 border-gray-300 text-gray-500'
              }`}
            >
              טעינה אוטומטית: {luach.auto_load ? 'פעיל' : 'כבוי'}
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition"
            >
              שמור
            </button>

            <button
              onClick={handlePublish}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded transition"
            >
              פרסם
            </button>
          </>
        )}
      </div>

      {/* Status */}
      {status && <p className="text-sm text-blue-700">{status}</p>}

      {/* Luach info */}
      {luach && (
        <div className="text-sm text-gray-500">
          {luach.parasha} | {luach.shavua_date}
          {luach.is_published && (
            <span className="mr-2 text-emerald-600 font-semibold">● מפורסם</span>
          )}
        </div>
      )}

      {/* Sadot editor */}
      {luach && (
        <>
          <SadotList sadot={sadot} onChange={setSadot} />
          <button
            onClick={handleAddField}
            className="mt-2 text-blue-600 hover:text-blue-800 text-sm underline"
          >
            + הוסף שדה
          </button>
        </>
      )}

      {!luach && (
        <p className="text-gray-400 italic">אין לוח. לחץ "טען שבוע חדש" כדי להתחיל.</p>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Verify LuachEditor in browser**

Open `http://localhost:3000/admin`, log in. Expected:
- "טען שבוע חדש" button visible
- Click it → creates row in `luach_shavui`, sadot list appears with time fields
- Drag rows to reorder
- Edit a time value → click "שמור" → refreshing page keeps the edit
- Click "פרסם" → status shows "פורסם ✓" and public page `/` now shows the luach

---

## Task 6: HodaotManager

**Files:**
- Replace: `components/HodaotManager.tsx`

- [ ] **Step 1: Write full HodaotManager**

Replace `components/HodaotManager.tsx`:

```tsx
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Hodaa } from '@/types';

export default function HodaotManager() {
  const [hodaot, setHodaot] = useState<Hodaa[]>([]);
  const [newText, setNewText] = useState('');
  const [loading, setLoading] = useState(false);

  async function fetchHodaot() {
    const { data } = await supabase
      .from('hodaot')
      .select('*')
      .order('created_at', { ascending: true });
    setHodaot((data as Hodaa[]) ?? []);
  }

  useEffect(() => { fetchHodaot(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const text = newText.trim();
    if (!text) return;
    setLoading(true);
    await supabase.from('hodaot').insert({ teken: text });
    setNewText('');
    await fetchHodaot();
    setLoading(false);
  }

  async function handleDelete(id: number) {
    await supabase.from('hodaot').delete().eq('id', id);
    setHodaot(hodaot.filter((h) => h.id !== id));
  }

  return (
    <div className="space-y-4">
      {/* Existing announcements */}
      {hodaot.length === 0 ? (
        <p className="text-gray-400 italic text-sm">אין הודעות כרגע</p>
      ) : (
        <ul className="space-y-2">
          {hodaot.map((h) => (
            <li
              key={h.id}
              className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded p-3"
            >
              <span className="flex-1 text-gray-800 text-sm">{h.teken}</span>
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

      {/* Add new */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <textarea
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
```

- [ ] **Step 2: Verify in browser**

Open `/admin`. In section "ב — הודעות": add an announcement → appears in list. Click ✕ → deleted. Check public page `/` — new announcement appears below the times. No console errors.

---

## Task 7: PDF and WhatsApp Buttons

**Files:**
- Replace: `components/ActionButtons.tsx`
- Create: `lib/pdf-utils.ts`

- [ ] **Step 1: Write PDF utility**

Create `lib/pdf-utils.ts`:

```ts
import type { LuachShavui, Hodaa } from '@/types';

export async function generateAndDownloadPDF(luach: LuachShavui, hodaot: Hodaa[]) {
  // Dynamic import keeps jspdf out of SSR bundle
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // jsPDF doesn't support Hebrew RTL natively — we'll output LTR mirrored text
  // For a simple solution, we reverse Hebrew strings before writing
  function rtl(text: string) {
    return text.split('').reverse().join('');
  }

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Title
  doc.setFontSize(18);
  doc.text(rtl('זמני תפילות — שבות אריאל'), pageWidth - 15, y, { align: 'right' });
  y += 8;

  doc.setFontSize(12);
  doc.text(rtl(luach.parasha), pageWidth - 15, y, { align: 'right' });
  y += 6;
  doc.text(luach.shavua_date, pageWidth - 15, y, { align: 'right' });
  y += 10;

  // Times
  doc.setFontSize(10);
  for (const field of luach.sadot) {
    doc.text(rtl(field.label) + '   ' + field.value, pageWidth - 15, y, { align: 'right' });
    y += 6;
    if (y > 270) { doc.addPage(); y = 20; }
  }

  // Announcements
  if (hodaot.length > 0) {
    y += 4;
    doc.setFontSize(12);
    doc.text(rtl('הודעות'), pageWidth - 15, y, { align: 'right' });
    y += 6;
    doc.setFontSize(10);
    for (const h of hodaot) {
      const lines = doc.splitTextToSize(rtl(h.teken), pageWidth - 30);
      for (const line of lines) {
        doc.text(line, pageWidth - 15, y, { align: 'right' });
        y += 5;
        if (y > 270) { doc.addPage(); y = 20; }
      }
      y += 2;
    }
  }

  doc.save(`zmanim-${luach.shavua_date}.pdf`);
}
```

- [ ] **Step 2: Write full ActionButtons**

Replace `components/ActionButtons.tsx`:

```tsx
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { buildWhatsAppText } from '@/lib/whatsapp-utils';
import type { LuachShavui, Hodaa } from '@/types';

export default function ActionButtons() {
  const [luach, setLuach] = useState<LuachShavui | null>(null);
  const [hodaot, setHodaot] = useState<Hodaa[]>([]);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const [{ data: luachData }, { data: hodaotData }] = await Promise.all([
        supabase
          .from('luach_shavui')
          .select('*')
          .eq('is_published', true)
          .order('shavua_date', { ascending: false })
          .limit(1)
          .single(),
        supabase.from('hodaot').select('*').order('created_at', { ascending: true }),
      ]);
      if (luachData) setLuach(luachData as LuachShavui);
      setHodaot((hodaotData as Hodaa[]) ?? []);
    }
    load();
  }, []);

  async function handlePDF() {
    if (!luach) return;
    setPdfLoading(true);
    const { generateAndDownloadPDF } = await import('@/lib/pdf-utils');
    await generateAndDownloadPDF(luach, hodaot);
    setPdfLoading(false);
  }

  function handleWhatsApp() {
    if (!luach) return;
    const text = buildWhatsAppText(luach.sadot);
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  }

  if (!luach) {
    return <p className="text-gray-400 italic text-sm">אין לוח מפורסם — פרסם לפני שליחה</p>;
  }

  return (
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
  );
}
```

- [ ] **Step 3: Verify PDF and WhatsApp**

Open `/admin`. With a published luach:
- Click "הדפס PDF" → PDF file downloads named `zmanim-YYYY-MM-DD.pdf`. Opens with times listed.
- Click "שלח וואטסאפ" → WhatsApp web opens with pre-filled message starting with "זמני חול בבית כנסת שבות אריאל" followed by the chol times.

---

## Task 8: Polish and Build

**Files:**
- Modify: `app/globals.css`, `next.config.ts`

- [ ] **Step 1: Add LTR class for time values in Tailwind**

The time values (HH:MM) should display left-to-right even in an RTL context. Add to `app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  direction: rtl;
}

.ltr {
  direction: ltr;
  text-align: left;
  unicode-bidi: embed;
}
```

- [ ] **Step 2: Run production build**

```bash
npm run build
```

Expected: build succeeds with no errors. Warnings about `@supabase/supabase-js` dynamic imports are fine. TypeScript errors must be zero.

If there are type errors, fix them. Common issues:
- `data` from Supabase being `null` — add `?? []` or null checks
- Missing `'use client'` on components that use hooks

- [ ] **Step 3: Final smoke test**

```bash
npm run dev
```

1. `http://localhost:3000` — public page with published luach and hodaot
2. `http://localhost:3000/admin` — login with `shvut2024`
3. Load a new week → sadot appear with all non-null fields
4. Reorder rows by drag-and-drop → save → reload → order preserved
5. Add a custom field with "הוסף שדה" → appears in list, editable
6. Publish → public page updates
7. Add announcement in section ב → appears on public page
8. Download PDF → file opens with all data
9. WhatsApp button → opens wa.me with chol times text

- [ ] **Step 4: Commit**

```bash
git init
git add -A
git commit -m "feat: initial Shvut Ariel web app — public schedule + admin panel"
```

---

## Self-Review

**Spec coverage check:**

| Requirement | Task |
|---|---|
| Public `/` — header "זמני תפילות בית כנסת שבות אריאל" | Task 3 |
| Public — reads published luach closest to current date | Task 3 |
| Public — displays sadot in saved order | Task 3 |
| Public — hodaot below times | Task 3 |
| Public — empty fields not shown (nulls filtered in zmanimRowToSadot) | Task 2 |
| Public — RTL Hebrew design | Task 1 (layout), Task 8 |
| Admin — password shvut2024 | Task 4 |
| Admin — "טען שבוע חדש" from zmanim table | Task 5 |
| Admin — auto_load toggle | Task 5 |
| Admin — sadot editor: edit each field | Task 5 (SadotItem) |
| Admin — sadot editor: delete field | Task 5 (SadotItem) |
| Admin — sadot editor: add custom field | Task 5 (LuachEditor handleAddField) |
| Admin — sadot editor: drag to reorder | Task 5 (SadotList + dnd-kit) |
| Admin — "פרסם" button | Task 5 |
| Admin — hodaot list with delete | Task 6 |
| Admin — add hodaa form | Task 6 |
| Admin — PDF export | Task 7 |
| Admin — WhatsApp with chol times | Task 7 |
