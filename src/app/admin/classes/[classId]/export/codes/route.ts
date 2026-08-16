import { createClient } from '@/lib/supabase/server';
import { buildCsv } from '@/lib/csv';
import { formatFilenameDateTime, formatDateTime } from '@/lib/dates';
import type { ClassRow, StudentRow, StudentRevealStatus } from '@/lib/types';

const CODE_COLUMNS = [
  'student_id',
  'last_name',
  'first_name',
  'email_address',
  'isbn',
  'condition',
  'price',
  'code',
  'revealed',
  'first_revealed_at',
  'last_revealed_at',
  'reveal_count',
  'reveal_vs_drop_deadline',
  'disposition',
];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ classId: string }> },
) {
  const { classId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const [classRes, studentsRes, statusRes] = await Promise.all([
    supabase.from('classes').select('*').eq('id', classId).single(),
    supabase.from('students').select('*').eq('class_id', classId).order('last_name'),
    supabase.from('student_reveal_status').select('*').eq('class_id', classId),
  ]);

  if (!classRes.data) return new Response('Class not found', { status: 404 });

  const klass = classRes.data as ClassRow;
  const students = (studentsRes.data as StudentRow[]) || [];

  const statusByStudent = new Map<string, StudentRevealStatus>();
  (statusRes.data as StudentRevealStatus[] | null)?.forEach((s) =>
    statusByStudent.set(s.student_id, s),
  );

  // End of the drop-deadline day, so a reveal at any hour on the deadline
  // date still counts as "before".
  const deadline = new Date(`${klass.drop_deadline}T23:59:59`);

  const rows = students.map((s) => {
    const st = statusByStudent.get(s.id);
    const firstRevealedAt = st?.first_revealed_at ?? null;
    const revealed = !!firstRevealedAt;

    let vsDeadline = '';
    if (firstRevealedAt) {
      vsDeadline =
        new Date(firstRevealedAt) <= deadline ? 'Before deadline' : 'After deadline';
    }

    return {
      student_id: s.student_id,
      last_name: s.last_name,
      first_name: s.first_name,
      email_address: s.email,
      isbn: s.isbn || '',
      condition: s.condition || '',
      price: s.price !== null ? s.price.toFixed(2) : '',
      code: s.code,
      revealed: revealed ? 'Yes' : 'No',
      first_revealed_at: formatDateTime(firstRevealedAt),
      last_revealed_at: formatDateTime(st?.last_revealed_at ?? null),
      reveal_count: (st?.reveal_count ?? 0).toString(),
      reveal_vs_drop_deadline: vsDeadline,
      // Revealed codes are consumed and non-refundable per the consent
      // statement, so they are billable. Unrevealed codes were never
      // delivered and can be recovered for reuse.
      disposition: revealed ? 'Billable - code consumed' : 'Unused - recoverable',
    };
  });

  const csv = buildCsv(CODE_COLUMNS, rows);
  const courseSlug = `${klass.course}_${klass.section || ''}`
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const filename = `${klass.school}_Codes_${courseSlug}_${formatFilenameDateTime()}.csv`;

  return new Response(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${filename}"`,
    },
  });
}
