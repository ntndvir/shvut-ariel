import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

function isAuthorized(req: NextRequest) {
  return req.headers.get('authorization') === `Bearer ${process.env.NEXT_PUBLIC_ADMIN_PASSWORD}`;
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { teken } = await req.json();
  const supabase = createServerClient();
  const { error } = await supabase.from('hodaot').insert({ teken });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await req.json();
  const supabase = createServerClient();
  const { error } = await supabase.from('hodaot').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
