import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const supabase = createServiceClient();

  const { data: student, error } = await supabase
    .from('students')
    .select('id, code')
    .eq('reveal_token', token)
    .single();

  if (error || !student) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const hdrs = await headers();
  const forwardedFor = hdrs.get('x-forwarded-for') || '';
  const ip = forwardedFor.split(',')[0]?.trim() || hdrs.get('x-real-ip') || null;
  const ua = hdrs.get('user-agent') || null;

  const { count: priorCount } = await supabase
    .from('reveal_events')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', student.id);

  const isFirst = (priorCount || 0) === 0;

  await supabase.from('reveal_events').insert({
    student_id: student.id,
    ip_address: ip,
    user_agent: ua,
    is_first_reveal: isFirst,
  });

  return NextResponse.json({ code: student.code });
}
