import Link from 'next/link';
import type { ClassRow } from '@/lib/types';

/**
 * Shared by the new and edit screens so a field added in one cannot go
 * missing in the other.
 */
export function ClassForm({
  action,
  defaults,
  submitLabel,
  cancelHref,
}: {
  action: (formData: FormData) => void | Promise<void>;
  defaults?: Partial<ClassRow>;
  submitLabel: string;
  cancelHref: string;
}) {
  const d = defaults || {};
  return (
    <form action={action} className="rounded-md bg-white border border-slate-200 p-6 space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Field label="School" name="school" required placeholder="UCA" defaultValue={d.school} />
        <Field label="Term" name="term" required placeholder="Fall 2026" defaultValue={d.term} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <Field
            label="Course"
            name="course"
            required
            placeholder="MATH 1301 - College Algebra"
            defaultValue={d.course}
          />
        </div>
        <Field label="Section / CRN" name="section" placeholder="002" defaultValue={d.section} />
      </div>

      <Field label="Instructor" name="instructor" placeholder="Dr. Smith" defaultValue={d.instructor} />

      <div className="grid grid-cols-3 gap-4">
        <Field label="Class start date" name="start_date" type="date" required defaultValue={d.start_date} />
        <Field label="Opt-out deadline" name="opt_out_deadline" type="date" defaultValue={d.opt_out_deadline} />
        <Field label="Refund deadline" name="drop_deadline" type="date" required defaultValue={d.drop_deadline} />
      </div>
      <p className="-mt-2 text-xs text-slate-500">
        Both deadlines appear on the reveal page. The opt-out deadline is the
        last day a student can leave the program; the refund deadline is the
        last day a refund can be issued. Leave the opt-out date blank to hide it.
      </p>

      <Field
        label="Publisher / Platform"
        name="publisher"
        placeholder="Used in admin views and mail merge"
        defaultValue={d.publisher}
      />

      <div className="border-t border-slate-200 pt-5">
        <h2 className="text-sm font-semibold text-slate-900">
          Redemption section (shown to student after they reveal)
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          All three fields are optional. If you leave them blank, no redemption
          section appears on the reveal page.
        </p>
      </div>

      <Field label="Redemption URL" name="redemption_url" placeholder="https://..." defaultValue={d.redemption_url} />
      <Field
        label="Redemption button label"
        name="redemption_button_label"
        placeholder="Open redemption page"
        defaultValue={d.redemption_button_label}
      />
      <TextareaField
        label="Redemption instructions"
        name="redemption_instructions"
        placeholder="Steps the student should follow to redeem their code"
        defaultValue={d.redemption_instructions}
      />
      <TextareaField label="Internal notes" name="notes" defaultValue={d.notes} />

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          {submitLabel}
        </button>
        <Link href={cancelHref} className="text-sm text-slate-600 hover:text-slate-900">
          Cancel
        </Link>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = 'text',
  required,
  placeholder,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string | null;
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
        defaultValue={defaultValue ?? ''}
        className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
      />
    </label>
  );
}

function TextareaField({
  label,
  name,
  placeholder,
  defaultValue,
}: {
  label: string;
  name: string;
  placeholder?: string;
  defaultValue?: string | null;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700">{label}</span>
      <textarea
        name={name}
        rows={3}
        placeholder={placeholder}
        defaultValue={defaultValue ?? ''}
        className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
      />
    </label>
  );
}
