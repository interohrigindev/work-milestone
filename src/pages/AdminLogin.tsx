import { Navigate } from 'react-router-dom';

// AdminLogin is now redirected to the unified LoginPage
export default function AdminLogin() {
  return <Navigate to="/" replace />;
}
