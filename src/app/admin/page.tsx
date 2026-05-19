import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/dates';
import type { ClassRow } from '@/lib/types';

export default async function AdminHome() {
  const supabase = await createClient();
  const { data: classes, error } = await supabase
    .from('classes')
    .select('*')
    .order('start_date', { ascending: false });

  if (error) {
    return (
      <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-800">
        Could not load classes: {error.message}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Classes</h1>
        <Link
          href="/admin/classes/new"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          New class
        </Link>
      </div>

      {(!classes || classes.length === 0) ? (
        <div className="rounded-md border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-slate-600">No classes yet. Create your first class to get started.</p>
          <Link
            href="/admin/classes/new"
            className="mt-4 inline-block rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Create a class
          </Link>
        </div>
      ) : (
        <div className="rounded-md bg-white border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-slate-600">
                <th className="px-4 py-2 font-medium">School</th>
                <th className="px-4 py-2 font-medium">Course</th>
                <th className="px-4 py-2 font-medium">Term</th>
                <th className="px-4 py-2 font-medium">Start date</th>
                <th className="px-4 py-2 font-medium">Drop deadline</th>
              </tr>
            </thead>
            <tbody>
              {(classes as ClassRow[]).map((c) => (
                <tr key={c.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-2">{c.school}</td>
                  <td className="px-4 py-2">
                    <Link href={`/admin/classes/${c.id}`} className="text-slate-900 hover:underline">
                      {c.course}{c.section ? ` · ${c.section}` : ''}
                    </Link>
                    {c.instructor && (
                      <div className="text-xs text-slate-500">{c.instructor}</div>
                    )}
                  </td>
                  <td className="px-4 py-2">{c.term}</td>
                  <td className="px-4 py-2">{formatDate(c.start_date)}</td>
                  <td className="px-4 py-2">{formatDate(c.drop_deadline)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
