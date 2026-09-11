export type AccountStatus =
  | 'active'
  | 'pending_approval'
  | 'suspended'
  | 'inactive'
  | 'graduated'
  | 'alumni'
  | 'archived'
  | 'deceased';

export interface User {
  id: string;
  username: string;
  email: string;
  phone_number: string | null;
  password_hash: string;
  full_name: string;
  gender: 'male' | 'female' | null;
  date_of_birth: string | null;
  national_id: string | null;
  passport_photo_url: string | null;
  admission_number: string | null;
  registration_number: string | null;
  school: string | null;
  faculty: string | null;
  department: string | null;
  course: string | null;
  programme: string | null;
  year_of_study: number | null;
  expected_graduation_year: number | null;
  campus_residence: string | null;
  is_non_resident: boolean;
  date_of_salvation: string | null;
  baptism_status: 'not_baptized' | 'baptized' | null;
  account_status: AccountStatus;
  email_verified_at: string | null;
  two_factor_enabled: boolean;
  last_login_at: string | null;
  failed_login_attempts: number;
  locked_until: string | null;
  password_changed_at: string | null;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}

/** Safe subset of a user record that is ever returned to clients. */
export type PublicUser = Omit<
  User,
  'password_hash' | 'two_factor_enabled'
>;

export function toPublicUser(user: User): PublicUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash, two_factor_enabled, ...rest } = user;
  return rest;
}
