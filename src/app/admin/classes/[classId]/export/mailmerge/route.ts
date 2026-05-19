import { createClient } from '@/lib/supabase/server';
import { buildCsv } from '@/lib/csv';
import { formatFilenameDateTime, formatDate } from '@/lib/dates';
import type { ClassRow, StudentRow } from '@/lib/types';

const MAILMERGE_COLUMNS = [
  'first_name',
  'last_name',
  'email_address',
  'reveal_url',
  'course',
  'section',
  'instructor',
  'term',
  'school',
  'start_date',
  'drop_deadline',
  'publisher',
  'redemption_url',
];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ classId: string }> },
) {
  const { classId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const [classRes, studentsRes] = await Promise.all([
    supabase.from('classes').select('*').eq('id', classId).single(),
    supabase.from('students').select('*').eq('class_id', classId).order('last_name'),
  ]);

  if (!classRes.data) return new Response('Class not found', { status: 404 });

  const klass = classRes.data as ClassRow;
  const students = (studentsRes.data as StudentRow[]) || [];

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;

  const rows = students.map((s) => ({
    first_name: s.first_name,
    last_name: s.last_name,
    email_address: s.email,
    reveal_url: `${appUrl}/r/${s.reveal_token}`,
    course: klass.course,
    section: klass.section || '',
    instructor: klass.instructor || '',
    term: klass.term,
    school: klass.school,
    start_date: formatDate(klass.start_date),
    drop_deadline: formatDate(klass.drop_deadline),
    publisher: klass.publisher || '',
    redemption_url: klass.redemption_url || '',
  }));

  const csv = buildCsv(MAILMERGE_COLUMNS, rows);
  const courseSlug = `${klass.course}_${klass.section || ''}`.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const filename = `${klass.school}_MailMerge_${courseSlug}_${formatFilenameDateTime()}.csv`;

  return new Response(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${filename}"`,
    },
  });
}
