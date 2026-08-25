export interface UserSearchResult {
  id: string;
  full_name: string;
  email: string;
  admission_number: string | null;
  account_status: string;
}

export interface RoleOption {
  id: string;
  code: string;
  name: string;
  category: string;
}

export interface UserRoleAssignment {
  id: string;
  user_id: string;
  full_name: string;
  role_id: string;
  role_code: string;
  role_name: string;
  scope_type: 'global' | 'committee' | 'ministry' | 'executive';
  scope_id: string | null;
  scope_name: string | null;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
}

export interface RolePermissionMatrixRow {
  role_id: string;
  role_code: string;
  role_name: string;
  category: string;
  permission_code: string;
  permission_module: string;
  permission_description: string | null;
}
