import { signInAnonymously, onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from './firebase';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin1234';

let currentUser: User | null = null;

// Listen for auth state
onAuthStateChanged(auth, (user) => {
  currentUser = user;
});

async function ensureAnonymousAuth(): Promise<boolean> {
  // If already signed in, use current user
  if (currentUser) return true;
  try {
    await signInAnonymously(auth);
    return true;
  } catch {
    // If anonymous auth is not enabled in Firebase Console,
    // fall back to sessionStorage-only mode
    console.warn('Anonymous auth not available. Running in offline admin mode.');
    return false;
  }
}

export async function loginAdmin(password: string): Promise<boolean> {
  if (password !== ADMIN_PASSWORD) return false;
  // Try Firebase anonymous auth (for Firestore write rules)
  // If it fails, still allow admin access via sessionStorage
  await ensureAnonymousAuth();
  sessionStorage.setItem('isAdmin', 'true');
  return true;
}

export function isAdminAuthenticated(): boolean {
  return sessionStorage.getItem('isAdmin') === 'true';
}

export function logoutAdmin() {
  sessionStorage.removeItem('isAdmin');
}
