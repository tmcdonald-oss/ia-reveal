'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { parseImportCsv, type ImportRow } from '@/lib/csv';
import { IMPORT_COLUMNS } from '@/lib/types';
import { importRoster } from './actions';

export function ImportForm({ classId }: { classId: string }) {
  const router = useRouter();
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [filename, setFilename] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFilename(file.name);
    const text = await file.text();
    const result = parseImportCsv(text);
    setRows(result.rows);
    setErrors(result.errors);
    setWarnings(result.warnings);
    setSubmitError('');
  }

  async function handleSubmit() {
    if (errors.length || !rows.length) return;
    setSubmitting(true);
    setSubmitError('');
    const result = await importRoster(classId, rows);
    if (result.ok) {
      router.push(`/admin/classes/${classId}`);
      router.refresh();
    } else {
      setSubmitError(result.error);
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-md bg-white border border-slate-200 p-6">
        <h2 className="font-medium text-slate-900">CSV file</h2>
        <p className="mt-1 text-sm text-slate-600">
          Required columns: <code className="text-xs bg-slate-100 px-1 rounded">{IMPORT_COLUMNS.join(', ')}</code>
        </p>
        <p className="mt-1 text-xs text-slate-500">
          The first row must be the header. Field <code>address_line2</code> can be blank.
        </p>

        <input
          type="file"
          accept=".csv,text/csv"
          onChange={handleFile}
          className="mt-4 block w-full text-sm text-slate-700"
        />
        {filename && (
          <div className="mt-2 text-xs text-slate-500">Selected: {filename}</div>
        )}
      </div>

      {errors.length > 0 && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4">
          <div className="font-medium text-red-900">
            {errors.length} error{errors.length === 1 ? '' : 's'} — fix before importing
          </div>
          <ul className="mt-2 text-sm text-red-800 list-disc pl-5 space-y-0.5 max-h-60 overflow-y-auto">
            {errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="rounded-md bg-amber-50 border border-amber-200 p-4">
          <div className="font-medium text-amber-900">Warnings</div>
          <ul className="mt-2 text-sm text-amber-800 list-disc pl-5 space-y-0.5">
            {warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      {rows.length > 0 && errors.length === 0 && (
        <div className="rounded-md bg-white border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-medium text-slate-900">Preview · {rows.length} student{rows.length === 1 ? '' : 's'}</h2>
          </div>
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                <tr className="text-left text-slate-600">
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium">Email</th>
                  <th className="px-4 py-2 font-medium">Student ID</th>
                  <th className="px-4 py-2 font-medium">Code</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-2">{r.last_name}, {r.first_name}</td>
                    <td className="px-4 py-2 text-slate-600">{r.email_address}</td>
                    <td className="px-4 py-2 font-mono text-xs text-slate-600">{r.student_id}</td>
                    <td className="px-4 py-2 font-mono text-xs">{maskCode(r.code)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {submitError && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-800">
          {submitError}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || rows.length === 0 || errors.length > 0}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Importing…' : `Import ${rows.length || 0} student${rows.length === 1 ? '' : 's'}`}
        </button>
      </div>
    </div>
  );
}

function maskCode(code: string): string {
  if (code.length <= 4) return '••••';
  return code.slice(0, 2) + '••••' + code.slice(-2);
}
