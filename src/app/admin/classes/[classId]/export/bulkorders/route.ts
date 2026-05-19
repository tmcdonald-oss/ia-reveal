import { createClient } from '@/lib/supabase/server';
import { buildCsv } from '@/lib/csv';
import { formatFilenameDateTime } from '@/lib/dates';
import { BULK_ORDER_COLUMNS } from '@/lib/types';
import type { ClassRow, StudentRow } from '@/lib/types';

export async function GET(
  _request: Request,
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

  const rows = students.map((s) => ({
    student_id: s.student_id,
    first_name: s.first_name,
    last_name: s.last_name,
    email_address: s.email,
    address_line1: s.address_line1 || '',
    address_line2: s.address_line2 || '',
    city: s.city || '',
    state: s.state || '',
    country: s.country || 'US',
    zip: s.zip || '',
    phone: s.phone || '',
    isbn: s.isbn || '',
    condition: s.condition || '',
    price: s.price !== null ? s.price.toFixed(2) : '',
  }));

  const csv = buildCsv(BULK_ORDER_COLUMNS, rows);
  const filename = `${klass.school}_BulkOrders_${formatFilenameDateTime()}.csv`;

  return new Response(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${filename}"`,
    },
  });
}
