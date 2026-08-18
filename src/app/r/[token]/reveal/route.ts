import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/server';
import { resolveToken, subjectColumn } from '@/lib/reveal';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const subject = await resolveToken(token);
  if (!subject) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const supabase = createServiceClient();

  const hdrs = await headers();
  const forwardedFor = hdrs.get('x-forwarded-for') || '';
  const ip = forwardedFor.split(',')[0]?.trim() || hdrs.get('x-real-ip') || null;
  const ua = hdrs.get('user-agent') || null;

  const column = subjectColumn(subject);

  const { count: priorCount } = await supabase
    .from('reveal_events')
    .select('id', { count: 'exact', head: true })
    .eq(column, subject.id);

  const isFirst = (priorCount || 0) === 0;

  await supabase.from('reveal_events').insert({
    [column]: subject.id,
    ip_address: ip,
    user_agent: ua,
    is_first_reveal: isFirst,
  });

  // Pool codes carry their own lifecycle, so mark the first reveal on the
  // row itself. Roster students derive this from reveal_events alone.
  if (isFirst && subject.kind === 'code') {
    await supabase
      .from('codes')
      .update({ status: 'revealed' })
      .eq('id', subject.id);
  }

  return NextResponse.json({ code: subject.code });
}
