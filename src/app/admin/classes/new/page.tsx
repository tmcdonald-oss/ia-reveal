import Link from 'next/link';
import { ClassForm } from '../_components/ClassForm';
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

      <ClassForm action={createClass} submitLabel="Create class" cancelHref="/admin" />
    </div>
  );
}
