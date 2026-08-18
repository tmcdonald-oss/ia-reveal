import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { formatDate, formatDateTime } from '@/lib/dates';
import type { ClassRow, StudentRow, StudentRevealStatus } from '@/lib/types';

export default async function ClassDetail({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  const supabase = await createClient();

  const { data: cls } = await supabase
    .from('classes')
    .select('*')
    .eq('id', classId)
    .single();

  if (!cls) notFound();

  const klass = cls as ClassRow;

  const { data: students } = await supabase
    .from('students')
    .select('*')
    .eq('class_id', classId)
    .order('last_name');

  const { data: status } = await supabase
    .from('student_reveal_status')
    .select('*')
    .eq('class_id', classId);

  const statusByStudent = new Map<string, StudentRevealStatus>();
  (status as StudentRevealStatus[] | null)?.forEach((s) =>
    statusByStudent.set(s.student_id, s),
  );

  const roster = (students as StudentRow[]) || [];
  const totalRevealed = roster.filter(
    (s) => statusByStudent.get(s.id)?.first_revealed_at,
  ).length;

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin" className="text-sm text-slate-600 hover:text-slate-900">
          &larr; Back to classes
        </Link>
        <div className="mt-2 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {klass.course}{klass.section ? ` · ${klass.section}` : ''}
            </h1>
            <p className="text-sm text-slate-600">
              {klass.school} · {klass.term}
              {klass.instructor && ` · ${klass.instructor}`}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/admin/classes/${classId}/edit`}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Edit class
            </Link>
            <Link
              href={`/admin/classes/${classId}/import`}
              className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Upload roster
            </Link>
            {roster.length > 0 && (
              <>
                <a
                  href={`/admin/classes/${classId}/export/mailmerge`}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Export mail merge CSV
                </a>
                <a
                  href={`/admin/classes/${classId}/export/bulkorders`}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Export bulk orders CSV
                </a>
                <a
                  href={`/admin/classes/${classId}/export/codes`}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Export codes CSV
                </a>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <Stat label="Students" value={roster.length.toString()} />
        <Stat label="Codes revealed" value={`${totalRevealed} of ${roster.length}`} />
        <Stat label="Start date" value={formatDate(klass.start_date)} />
        <Stat label="Drop deadline" value={formatDate(klass.drop_deadline)} />
      </div>

      <div className="rounded-md bg-white border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200">
          <h2 className="font-medium text-slate-900">Roster</h2>
        </div>
        {roster.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-600">
            No students yet. <Link href={`/admin/classes/${classId}/import`} className="text-slate-900 underline">Upload a CSV</Link> to get started.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-slate-600">
                <th className="px-4 py-2 font-medium">Student</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Student ID</th>
                <th className="px-4 py-2 font-medium">Revealed</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {roster.map((s) => {
                const st = statusByStudent.get(s.id);
                const revealed = !!st?.first_revealed_at;
                return (
                  <tr key={s.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-2">{s.last_name}, {s.first_name}</td>
                    <td className="px-4 py-2 text-slate-600">{s.email}</td>
                    <td className="px-4 py-2 text-slate-600 font-mono text-xs">{s.student_id}</td>
                    <td className="px-4 py-2">
                      {revealed ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700">
                          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                          {formatDateTime(st!.first_revealed_at)}
                        </span>
                      ) : (
                        <span className="text-slate-500">Not revealed</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Link
                        href={`/admin/classes/${classId}/students/${s.id}/evidence`}
                        className="text-slate-600 hover:text-slate-900 underline"
                      >
                        Evidence
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white border border-slate-200 p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-semibold text-slate-900">{value}</div>
    </div>
  );
}
