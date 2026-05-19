import Link from 'next/link';
import { createClass } from './actions';

export default function NewClassPage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link href="/admin" className="text-sm text-slate-600 hover:text-slate-900">
          &larr; Back to classes
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">New class</h1>
        <p className="mt-1 text-sm text-slate-600">
          Define the class, then upload the roster + codes CSV in the next step.
        </p>
      </div>

      <form action={createClass} className="rounded-md bg-white border border-slate-200 p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Field label="School" name="school" required placeholder="UCA" />
          <Field label="Term" name="term" required placeholder="Summer 2026" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <Field label="Course" name="course" required placeholder="MATH 1301 - College Algebra" />
          </div>
          <Field label="Section" name="section" placeholder="002" />
        </div>

        <Field label="Instructor" name="instructor" placeholder="Dr. Smith" />

        <div className="grid grid-cols-2 gap-4">
          <Field label="Class start date" name="start_date" type="date" required />
          <Field label="Drop deadline" name="drop_deadline" type="date" required />
        </div>

        <Field label="Publisher / Platform" name="publisher" placeholder="Used in admin views and mail merge" />

        <div className="border-t border-slate-200 pt-5">
          <h2 className="text-sm font-semibold text-slate-900">Redemption section (shown to student after they reveal)</h2>
          <p className="mt-1 text-xs text-slate-500">All three fields are optional. If you leave them blank, no redemption section appears on the reveal page.</p>
        </div>

        <Field label="Redemption URL" name="redemption_url" placeholder="https://..." />
        <Field
          label="Redemption button label"
          name="redemption_button_label"
          placeholder="Open redemption page"
        />
        <TextareaField
          label="Redemption instructions"
          name="redemption_instructions"
          placeholder="Steps the student should follow to redeem their code"
        />
        <TextareaField label="Internal notes" name="notes" />

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Create class
          </button>
          <Link href="/admin" className="text-sm text-slate-600 hover:text-slate-900">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = 'text',
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700">
        {label}{required && <span className="text-red-600"> *</span>}
      </span>
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
      />
    </label>
  );
}

function TextareaField({
  label,
  name,
  placeholder,
}: {
  label: string;
  name: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700">{label}</span>
      <textarea
        name={name}
        rows={3}
        placeholder={placeholder}
        className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
      />
    </label>
  );
}
