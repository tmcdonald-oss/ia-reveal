import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ClassForm } from '../../_components/ClassForm';
import { updateClass } from './actions';
import type { ClassRow } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function EditClassPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from('classes')
    .select('*')
    .eq('id', classId)
    .single();

  if (!data) notFound();
  const klass = data as ClassRow;

  const action = updateClass.bind(null, classId);

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link
          href={`/admin/classes/${classId}`}
          className="text-sm text-slate-600 hover:text-slate-900"
        >
          &larr; Back to class
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Edit class</h1>
        <p className="mt-1 text-sm text-slate-600">
          Changes appear immediately on every reveal link for this class.
        </p>
      </div>

      <ClassForm
        action={action}
        defaults={klass}
        submitLabel="Save changes"
        cancelHref={`/admin/classes/${classId}`}
      />
    </div>
  );
}
