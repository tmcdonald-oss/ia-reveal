export type ClassRow = {
  id: string;
  school: string;
  course: string;
  section: string | null;
  instructor: string | null;
  term: string;
  start_date: string;
  drop_deadline: string;
  opt_out_deadline: string | null;
  publisher: string | null;
  redemption_url: string | null;
  redemption_instructions: string | null;
  redemption_button_label: string | null;
  notes: string | null;
  created_at: string;
  created_by: string | null;
};

export type StudentRow = {
  id: string;
  class_id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  zip: string | null;
  phone: string | null;
  isbn: string | null;
  condition: string | null;
  price: number | null;
  code: string;
  reveal_token: string;
  created_at: string;
};

export type RevealEventRow = {
  id: string;
  student_id: string;
  revealed_at: string;
  ip_address: string | null;
  user_agent: string | null;
  is_first_reveal: boolean;
};

export type StudentRevealStatus = {
  student_id: string;
  class_id: string;
  first_name: string;
  last_name: string;
  email: string;
  bookstore_student_id: string;
  first_revealed_at: string | null;
  last_revealed_at: string | null;
  reveal_count: number;
};

export const BULK_ORDER_COLUMNS = [
  'student_id',
  'first_name',
  'last_name',
  'email_address',
  'address_line1',
  'address_line2',
  'city',
  'state',
  'country',
  'zip',
  'phone',
  'isbn',
  'condition',
  'price',
] as const;

export const IMPORT_COLUMNS = [...BULK_ORDER_COLUMNS, 'code'] as const;
