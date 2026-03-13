import { supabase } from './supabase';

export interface Department {
  id: string;
  name: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  department_id: string | null;
  department_name: string | null;
  role: 'employee' | 'leader' | 'director' | 'division_head' | 'ceo' | 'admin';
  is_active: boolean;
  phone: string | null;
  avatar_url: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  employee: '사원',
  leader: '팀장',
  director: '이사',
  division_head: '본부장',
  ceo: '대표',
  admin: '관리자',
};

export function getRoleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role;
}

// Avatar color based on name hash
export function getAvatarColor(name: string): string {
  const colors = [
    '#579BFC', '#00C875', '#FDAB3D', '#E2445C', '#A25DDC',
    '#FF642E', '#CAB641', '#00D2D2', '#FF158A', '#037F4C',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export async function fetchDepartments(): Promise<Department[]> {
  const { data, error } = await supabase
    .from('departments')
    .select('id, name')
    .order('name');

  if (error) {
    console.error('Failed to fetch departments:', error);
    return [];
  }
  return data ?? [];
}

export async function fetchEmployees(): Promise<Employee[]> {
  const { data, error } = await supabase
    .from('employees')
    .select(`
      id,
      name,
      email,
      department_id,
      departments ( name ),
      role,
      is_active,
      phone,
      avatar_url
    `)
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Failed to fetch employees:', error);
    return [];
  }

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    department_id: row.department_id as string | null,
    department_name: (row.departments as { name: string } | null)?.name ?? null,
    role: row.role as Employee['role'],
    is_active: row.is_active as boolean,
    phone: row.phone as string | null,
    avatar_url: row.avatar_url as string | null,
  }));
}

export async function fetchEmployeeById(id: string): Promise<Employee | null> {
  const { data, error } = await supabase
    .from('employees')
    .select(`
      id,
      name,
      email,
      department_id,
      departments ( name ),
      role,
      is_active,
      phone,
      avatar_url
    `)
    .eq('id', id)
    .single();

  if (error || !data) return null;

  const row = data as Record<string, unknown>;
  return {
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    department_id: row.department_id as string | null,
    department_name: (row.departments as { name: string } | null)?.name ?? null,
    role: row.role as Employee['role'],
    is_active: row.is_active as boolean,
    phone: row.phone as string | null,
    avatar_url: row.avatar_url as string | null,
  };
}
