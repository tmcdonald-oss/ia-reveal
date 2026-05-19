import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { formatDate, formatDateTime } from '@/lib/dates';
import { CONSENT_STATEMENT } from '@/lib/consent';
import type { ClassRow, RevealEventRow, StudentRow } from '@/lib/types';
import { PrintButton } from './PrintButton';

export default async function EvidencePage({
  params,
}: {
  params: Promise<{ classId: string; studentId: string }>;
}) {
  const { classId, studentId } = await params;
  const supabase = await createClient();

  const [studentRes, classRes, eventsRes] = await Promise.all([
    supabase.from('students').select('*').eq('id', studentId).single(),
    supabase.from('classes').select('*').eq('id', classId).single(),
    supabase
      .from('reveal_events')
      .select('*')
      .eq('student_id', studentId)
      .order('revealed_at'),
  ]);

  if (!studentRes.data || !classRes.data) notFound();

  const student = studentRes.data as StudentRow;
  const klass = classRes.data as ClassRow;
  const events = (eventsRes.data as RevealEventRow[]) || [];
  const firstReveal = events[0];

  return (
    <div className="max-w-3xl">
      <div className="mb-6 print:hidden">
        <Link href={`/admin/classes/${classId}`} className="text-sm text-slate-600 hover:text-slate-900">
          &larr; Back to {klass.course}
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">Evidence packet</h1>
          <PrintButton />
        </div>
      </div>

      <article className="rounded-md bg-white border border-slate-200 p-8 print:border-0 print:shadow-none print:p-0">
        <header className="border-b border-slate-200 pb-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">
            Inclusive Access · Code Reveal Audit Record
          </div>
          <div className="mt-1 text-lg font-semibold text-slate-900">
            {klass.school} — {klass.course}{klass.section ? ` · ${klass.section}` : ''} — {klass.term}
          </div>
          <div className="text-sm text-slate-600">Generated {formatDateTime(new Date())}</div>
        </header>

        <Section title="Student">
          <Row label="Name" value={`${student.last_name}, ${student.first_name}`} />
          <Row label="Email" value={student.email} />
          <Row label="Student ID" value={student.student_id} mono />
          {student.phone && <Row label="Phone" value={student.phone} />}
        </Section>

        <Section title="Class">
          <Row label="Course" value={`${klass.course}${klass.section ? ` · ${klass.section}` : ''}`} />
          {klass.instructor && <Row label="Instructor" value={klass.instructor} />}
          <Row label="Term" value={klass.term} />
          <Row label="Class start date" value={formatDate(klass.start_date)} />
          <Row label="Drop deadline" value={formatDate(klass.drop_deadline)} />
          {klass.publisher && <Row label="Publisher / Platform" value={klass.publisher} />}
          {student.isbn && <Row label="ISBN" value={student.isbn} mono />}
        </Section>

        <Section title="Reveal status">
          {firstReveal ? (
            <>
              <Row label="First reveal" value={formatDateTime(firstReveal.revealed_at)} />
              {firstReveal.ip_address && <Row label="IP address" value={firstReveal.ip_address} mono />}
              {firstReveal.user_agent && <Row label="User agent" value={firstReveal.user_agent} mono small />}
              <Row label="Total reveal events" value={events.length.toString()} />
            </>
          ) : (
            <Row label="Status" value="Not yet revealed by student" />
          )}
        </Section>

        {events.length > 1 && (
          <Section title="All reveal events">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2 font-medium">When</th>
                  <th className="py-2 font-medium">IP</th>
                  <th className="py-2 font-medium">First?</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-1.5">{formatDateTime(e.revealed_at)}</td>
                    <td className="py-1.5 font-mono text-xs text-slate-600">{e.ip_address || ''}</td>
                    <td className="py-1.5">{e.is_first_reveal ? 'Yes' : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        )}

        <Section title="Consent statement shown to student">
          <p className="whitespace-pre-wrap text-sm text-slate-700">{CONSENT_STATEMENT}</p>
        </Section>
      </article>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function Row({
  label,
  value,
  mono,
  small,
}: {
  label: string;
  value: string;
  mono?: boolean;
  small?: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-3 py-1 border-b border-slate-100 last:border-0">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className={`col-span-2 text-slate-900 ${mono ? 'font-mono' : ''} ${small ? 'text-xs' : 'text-sm'}`}>
        {value}
      </dd>
    </div>
  );
}
