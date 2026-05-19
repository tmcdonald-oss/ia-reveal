import Papa from 'papaparse';
import { IMPORT_COLUMNS } from './types';

export type ImportRow = {
  student_id: string;
  first_name: string;
  last_name: string;
  email_address: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  country: string;
  zip: string;
  phone: string;
  isbn: string;
  condition: string;
  price: string;
  code: string;
};

export type ParseResult = {
  rows: ImportRow[];
  errors: string[];
  warnings: string[];
};

const REQUIRED_FIELDS = [
  'student_id',
  'first_name',
  'last_name',
  'email_address',
  'address_line1',
  'city',
  'state',
  'country',
  'zip',
  'phone',
  'isbn',
  'condition',
  'price',
  'code',
] as const;

export function parseImportCsv(text: string): ParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  if (parsed.errors.length) {
    parsed.errors.forEach((e) => errors.push(`Row ${e.row}: ${e.message}`));
  }

  const headers = parsed.meta.fields || [];
  const missing = IMPORT_COLUMNS.filter((c) => !headers.includes(c));
  if (missing.length) {
    errors.push(
      `CSV is missing required columns: ${missing.join(', ')}. Expected columns: ${IMPORT_COLUMNS.join(', ')}.`,
    );
    return { rows: [], errors, warnings };
  }

  const rows: ImportRow[] = [];
  parsed.data.forEach((raw, i) => {
    const row: ImportRow = {
      student_id: (raw.student_id || '').trim(),
      first_name: (raw.first_name || '').trim(),
      last_name: (raw.last_name || '').trim(),
      email_address: (raw.email_address || '').trim(),
      address_line1: (raw.address_line1 || '').trim(),
      address_line2: (raw.address_line2 || '').trim(),
      city: (raw.city || '').trim(),
      state: (raw.state || '').trim(),
      country: (raw.country || '').trim(),
      zip: (raw.zip || '').trim(),
      phone: (raw.phone || '').trim(),
      isbn: (raw.isbn || '').trim(),
      condition: (raw.condition || '').trim(),
      price: (raw.price || '').trim(),
      code: (raw.code || '').trim(),
    };

    const rowLabel = `Row ${i + 2}`;
    for (const field of REQUIRED_FIELDS) {
      if (!row[field]) {
        errors.push(`${rowLabel}: ${field} is required`);
      }
    }

    if (row.email_address && !row.email_address.includes('@')) {
      errors.push(`${rowLabel}: email_address does not look like an email`);
    }

    if (row.price && Number.isNaN(parseFloat(row.price))) {
      errors.push(`${rowLabel}: price "${row.price}" is not a number`);
    }

    rows.push(row);
  });

  const seenCodes = new Set<string>();
  rows.forEach((r, i) => {
    if (seenCodes.has(r.code)) {
      warnings.push(`Row ${i + 2}: duplicate code "${r.code}"`);
    }
    seenCodes.add(r.code);
  });

  const seenStudentIds = new Set<string>();
  rows.forEach((r, i) => {
    if (seenStudentIds.has(r.student_id)) {
      errors.push(`Row ${i + 2}: duplicate student_id "${r.student_id}"`);
    }
    seenStudentIds.add(r.student_id);
  });

  return { rows, errors, warnings };
}

export function buildCsv<T extends Record<string, unknown>>(
  columns: readonly string[],
  rows: T[],
): string {
  return Papa.unparse(
    {
      fields: columns as string[],
      data: rows.map((r) => columns.map((c) => r[c] ?? '')),
    },
    { newline: '\r\n' },
  );
}
