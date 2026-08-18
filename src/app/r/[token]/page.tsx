import { notFound } from 'next/navigation';
import { CONSENT_STATEMENT, POST_REVEAL_NOTE } from '@/lib/consent';
import { formatDate } from '@/lib/dates';
import { resolveToken, countReveals } from '@/lib/reveal';
import { ScratchReveal } from './ScratchReveal';

export const dynamic = 'force-dynamic';

export default async function RevealPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const subject = await resolveToken(token);
  if (!subject) notFound();

  const alreadyRevealed = (await countReveals(subject)) > 0;
  const klass = subject.klass;

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="mx-auto max-w-xl">
        <div className="rounded-lg bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-900 text-white px-6 py-5">
            {klass ? (
              <>
                <div className="text-xs uppercase tracking-wide text-slate-300">
                  {klass.school} · {klass.term}
                </div>
                <h1 className="mt-1 text-xl font-semibold">
                  {klass.course}{klass.section ? ` · ${klass.section}` : ''}
                </h1>
                {klass.instructor && (
                  <div className="text-sm text-slate-300 mt-0.5">{klass.instructor}</div>
                )}
              </>
            ) : (
              <h1 className="text-xl font-semibold">Your access code</h1>
            )}
          </div>

          <div className="px-6 py-6">
            {subject.firstName && (
              <p className="text-slate-900">Hello {subject.firstName},</p>
            )}
            <p className={`text-sm text-slate-700 ${subject.firstName ? 'mt-2' : ''}`}>
              Your one-time access code
              {klass ? ` for ${klass.course}` : ''} is below. Please read carefully
              before revealing.
            </p>

            <div className="mt-5 rounded-md bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900 whitespace-pre-wrap leading-relaxed">
              {CONSENT_STATEMENT}
            </div>

            {!alreadyRevealed && klass && (
              <div className="mt-2 text-xs text-slate-500">
                Drop deadline: {formatDate(klass.drop_deadline)}
              </div>
            )}

            <div className="mt-6">
              <ScratchReveal
                token={token}
                alreadyRevealed={alreadyRevealed}
                initialCode={alreadyRevealed ? subject.code : null}
              />
            </div>

            {alreadyRevealed && (
              <div className="mt-4 text-sm text-slate-700">
                <p className="font-medium">{POST_REVEAL_NOTE}</p>
              </div>
            )}

            {klass && (klass.redemption_url || klass.redemption_instructions) && (
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
