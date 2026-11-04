import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminDashboard } from '../api/admin';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<unknown>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) {
      navigate('/admin/login');
      return;
    }
    getAdminDashboard()
      .then(({ data }) => setDashboard(data))
      .catch((error) => {
        const response = (error as { response?: { data?: { message?: string } } }).response;
        setMessage(response?.data?.message || 'Something went wrong');
      });
  }, [navigate]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
      {message && <p className="text-red-500">{message}</p>}
      {dashboard !== null && (
        <pre className="mt-4 text-sm">{JSON.stringify(dashboard, null, 2)}</pre>
      )}
    </div>
  );
}
