import { supabase } from './supabase';
import type { Employee } from './employees';

export interface AuthUser {
  id: string;
  email: string;
  employee: Employee | null;
}

/** Look up Supabase employee profile by email */
async function fetchEmployeeByEmail(email: string): Promise<Employee | null> {
  const { data: emp } = await supabase
    .from('employees')
    .select('id, name, email, department_id, departments(name), role, is_active, phone, avatar_url')
    .eq('email', email)
    .single();

  if (!emp) return null;

  return {
    id: (emp as Record<string, unknown>).id as string,
    name: (emp as Record<string, unknown>).name as string,
    email: (emp as Record<string, unknown>).email as string,
    department_id: (emp as Record<string, unknown>).department_id as string | null,
    department_name: ((emp as Record<string, unknown>).departments as { name: string } | null)?.name ?? null,
    role: (emp as Record<string, unknown>).role as Employee['role'],
    is_active: (emp as Record<string, unknown>).is_active as boolean,
    phone: (emp as Record<string, unknown>).phone as string | null,
    avatar_url: (emp as Record<string, unknown>).avatar_url as string | null,
  };
}

/** Check if email exists in employees table */
export async function checkEmployeeExists(email: string): Promise<boolean> {
  const emp = await fetchEmployeeByEmail(email);
  return !!emp;
}

/** Sign in with email/password via Supabase Auth */
export async function loginWithEmail(email: string, password: string): Promise<AuthUser> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  if (!data.user?.email) throw new Error('로그인에 실패했습니다.');

  const employee = await fetchEmployeeByEmail(data.user.email);

  return {
    id: data.user.id,
    email: data.user.email,
    employee,
  };
}

/** Sign up new user via Supabase Auth (for existing employees setting first password) */
export async function signUpWithEmail(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) throw new Error(error.message);
}

/** Sign out */
export async function logout(): Promise<void> {
  await supabase.auth.signOut();
  sessionStorage.removeItem('isAdmin');
}

/** Get current session user with employee profile */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return null;

  const employee = await fetchEmployeeByEmail(user.email);

  return {
    id: user.id,
    email: user.email,
    employee,
  };
}

/** Check if user has admin-level role */
export function isAdminRole(employee: Employee | null): boolean {
  if (!employee) return false;
  return ['admin', 'ceo', 'director', 'division_head'].includes(employee.role);
}

/** Check if there is a currently authenticated user */
export function isAuthenticated(): boolean {
  // Supabase stores session in localStorage, check synchronously
  const storageKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
  return !!storageKey && !!localStorage.getItem(storageKey);
}

/** Listen for auth state changes */
export function onAuthChange(callback: (user: AuthUser | null) => void) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
    if (!session?.user?.email) {
      callback(null);
      return;
    }

    const employee = await fetchEmployeeByEmail(session.user.email);
    callback({
      id: session.user.id,
      email: session.user.email,
      employee,
    });
  });

  return () => subscription.unsubscribe();
}
