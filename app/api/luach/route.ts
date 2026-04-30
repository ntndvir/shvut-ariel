import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

function isAuthorized(req: NextRequest) {
  return req.headers.get('authorization') === `Bearer ${process.env.NEXT_PUBLIC_ADMIN_PASSWORD}`;
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const supabase = createServerClient();
  const { data, error } = await supabase.from('luach_shavui').insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function PATCH(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id, fields, action } = await req.json();
  const supabase = createServerClient();

  if (action === 'publish') {
    await supabase.from('luach_shavui').update({ is_published: false }).neq('id', id);
  }

  const { error } = await supabase.from('luach_shavui').update(fields).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
