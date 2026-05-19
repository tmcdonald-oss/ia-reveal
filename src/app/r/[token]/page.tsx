import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/server';
import { CONSENT_STATEMENT, POST_REVEAL_NOTE } from '@/lib/consent';
import { formatDate } from '@/lib/dates';
import { ScratchReveal } from './ScratchReveal';

export const dynamic = 'force-dynamic';

export default async function RevealPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = createServiceClient();

  const { data: student } = await supabase
    .from('students')
    .select('id, first_name, last_name, code, class_id, classes(course, section, instructor, school, term, drop_deadline, publisher, redemption_url, redemption_instructions, redemption_button_label)')
    .eq('reveal_token', token)
    .single();

  if (!student) notFound();

  const { count } = await supabase
    .from('reveal_events')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', (student as { id: string }).id);

  const alreadyRevealed = (count || 0) > 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const klass = (student as any).classes;

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="mx-auto max-w-xl">
        <div className="rounded-lg bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-900 text-white px-6 py-5">
            <div className="text-xs uppercase tracking-wide text-slate-300">
              {klass.school} · {klass.term}
            </div>
            <h1 className="mt-1 text-xl font-semibold">
              {klass.course}{klass.section ? ` · ${klass.section}` : ''}
            </h1>
            {klass.instructor && (
              <div className="text-sm text-slate-300 mt-0.5">{klass.instructor}</div>
            )}
          </div>

          <div className="px-6 py-6">
            <p className="text-slate-900">
              Hello {student.first_name},
            </p>
            <p className="mt-2 text-sm text-slate-700">
              Your one-time access code for {klass.course} is below. Please read carefully before revealing.
            </p>

            <div className="mt-5 rounded-md bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900 whitespace-pre-wrap leading-relaxed">
              {CONSENT_STATEMENT}
            </div>

            {!alreadyRevealed && (
              <div className="mt-2 text-xs text-slate-500">
                Drop deadline: {formatDate(klass.drop_deadline)}
              </div>
            )}

            <div className="mt-6">
              <ScratchReveal
                token={token}
                alreadyRevealed={alreadyRevealed}
                initialCode={alreadyRevealed ? student.code : null}
              />
            </div>

            {alreadyRevealed && (
              <div className="mt-4 text-sm text-slate-700">
                <p className="font-medium">{POST_REVEAL_NOTE}</p>
              </div>
            )}

            {(klass.redemption_url || klass.redemption_instructions) && (
              <div className="mt-6 rounded-md bg-slate-50 border border-slate-200 p-4 text-sm">
                <div className="font-medium text-slate-900">Redemption Instructions</div>
                {klass.redemption_instructions && (
                  <p className="mt-1 text-slate-700 whitespace-pre-wrap">{klass.redemption_instructions}</p>
                )}
                {klass.redemption_url && (
                  <a
                    href={klass.redemption_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                  >
                    {klass.redemption_button_label || 'Open redemption page'} →
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 text-xs text-slate-500">
            Need help? Contact your campus bookstore.
          </div>
        </div>
      </div>
    </main>
  );
}
