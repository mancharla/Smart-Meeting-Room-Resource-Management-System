export interface AdminUser {
  id: number;
  full_name: string;
  email: string;
  role_id: number;
  role_name: string;
  department_id: number | null;
  department_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSearchParams {
  search?: string;
  role_id?: number;
  is_active?: boolean;
}

export interface UserUpdate {
  role_id?: number;
  department_id?: number;
  is_active?: boolean;
}
