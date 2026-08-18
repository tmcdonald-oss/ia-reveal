import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatDateTime } from '@/lib/dates';
import { buildRevealUrl, POS_ACCESS_CODE_MAX_LENGTH } from '@/lib/tokens';

export const dynamic = 'force-dynamic';

type PoolRow = {
  id: string;
  ean: string | null;
  reveal_token: string;
  status: string;
  batch_label: string | null;
  pos_host: string | null;
  pos_access_code_id: number | null;
  assigned_student_name: string | null;
  assigned_student_id: string | null;
  assignment_note: string | null;
  created_at: string;
};

type StatusRow = {
  code_id: string;
  first_revealed_at: string | null;
  reveal_count: number;
};

export default async function PoolPage() {
  const supabase = await createClient();

  const { data: codes } = await supabase
    .from('codes')
    .select('id, ean, reveal_token, status, batch_label, pos_host, pos_access_code_id, assigned_student_name, assigned_student_id, assignment_note, created_at')
    .order('pos_access_code_id');

  const { data: statuses } = await supabase
    .from('code_reveal_status')
    .select('code_id, first_revealed_at, reveal_count');

  const statusById = new Map<string, StatusRow>();
  (statuses as StatusRow[] | null)?.forEach((s) => statusById.set(s.code_id, s));

  const pool = (codes as PoolRow[]) || [];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  const available = pool.filter((c) => c.status === 'available').length;
  const assigned = pool.filter((c) => c.assigned_student_name).length;
  const revealed = pool.filter((c) => statusById.get(c.id)?.first_revealed_at).length;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Code pool</h1>
          <p className="text-sm text-slate-600">
            Codes with a reveal link but no student attached. The POS assigns
            them to a buyer at the point of sale.
          </p>
        </div>
        {pool.length > 0 && (
          <a
            href="/admin/pool/export/urls"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Export URLs for POS
          </a>
        )}
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <Stat label="Codes in pool" value={pool.length.toString()} />
        <Stat label="Available" value={available.toString()} />
        <Stat label="Assigned to a student" value={assigned.toString()} />
        <Stat label="Revealed" value={revealed.toString()} />
      </div>

      <div className="rounded-md bg-white border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200">
          <h2 className="font-medium text-slate-900">Codes</h2>
        </div>
        {pool.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-600">
            No pooled codes yet.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-slate-600">
                <th className="px-4 py-2 font-medium">POS row</th>
                <th className="px-4 py-2 font-medium">Student</th>
                <th className="px-4 py-2 font-medium">Reveal URL</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Revealed</th>
              </tr>
            </thead>
            <tbody>
              {pool.map((c) => {
                const st = statusById.get(c.id);
                let url: string;
                let tooLong = false;
                try {
                  url = buildRevealUrl(appUrl, c.reveal_token);
                } catch {
                  url = `${appUrl}/r/${c.reveal_token}`;
                  tooLong = true;
                }
                return (
                  <tr key={c.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-2 font-mono text-xs text-slate-600">
                      {c.pos_host ? `${c.pos_host} · ` : ''}{c.pos_access_code_id ?? '—'}
                    </td>
                    <td className="px-4 py-2">
                      {c.assigned_student_name ? (
                        <>
                          <div className="text-slate-900">{c.assigned_student_name}</div>
                          {c.assigned_student_id && (
                            <div className="font-mono text-xs text-slate-500">
                              {c.assigned_student_id}
                            </div>
                          )}
                          {c.assignment_note && (
                            <div className="mt-0.5 text-xs text-amber-700">
                              {c.assignment_note}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-slate-500">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <span className="font-mono text-xs break-all">{url}</span>
                      {tooLong && (
                        <span className="ml-2 rounded bg-red-50 px-1.5 py-0.5 text-xs text-red-700">
                          over {POS_ACCESS_CODE_MAX_LENGTH} chars
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-slate-600">{c.status}</td>
                    <td className="px-4 py-2">
                      {st?.first_revealed_at ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700">
                          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                          {formatDateTime(st.first_revealed_at)}
                        </span>
                      ) : (
                        <span className="text-slate-500">Not revealed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <p className="mt-4 text-xs text-slate-500">
        <Link href="/admin" className="underline">Back to classes</Link>
      </p>
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
