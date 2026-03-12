import { signInAnonymously } from 'firebase/auth';
import { auth } from './firebase';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin1234';

export async function loginAdmin(password: string): Promise<boolean> {
  if (password !== ADMIN_PASSWORD) return false;
  try {
    await signInAnonymously(auth);
    sessionStorage.setItem('isAdmin', 'true');
    return true;
  } catch {
    return false;
  }
}

export function isAdminAuthenticated(): boolean {
  return sessionStorage.getItem('isAdmin') === 'true';
}

export function logoutAdmin() {
  sessionStorage.removeItem('isAdmin');
}
