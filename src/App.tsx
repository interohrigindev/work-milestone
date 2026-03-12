import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ViewerPage from './pages/ViewerPage';
import AdminLogin from './pages/AdminLogin';
import AdminPage from './pages/AdminPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ViewerPage />} />
        <Route path="/view/:projectId" element={<ViewerPage />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
