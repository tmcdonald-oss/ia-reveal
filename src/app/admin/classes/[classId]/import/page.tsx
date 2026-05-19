import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { ClassRow } from '@/lib/types';
import { ImportForm } from './ImportForm';

export default async function ImportPage({
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

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Link href={`/admin/classes/${classId}`} className="text-sm text-slate-600 hover:text-slate-900">
          &larr; Back to {klass.course}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Upload roster</h1>
        <p className="mt-1 text-sm text-slate-600">
          Combined CSV: bulk orders columns + a <code className="text-xs bg-slate-100 px-1 rounded">code</code> column.
        </p>
      </div>

      <ImportForm classId={classId} />
    </div>
  );
}
