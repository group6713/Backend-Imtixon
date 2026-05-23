import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ErrorAlert from '../components/ErrorAlert';
import Loading from '../components/Loading';

const Register = () => {
  const { register, isAuthenticated, loading: authLoading } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  if (authLoading) return <Loading fullScreen />;
  if (isAuthenticated) return <Navigate to="/" replace />;

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Ism kiritilishi shart';
    else if (form.name.length < 2) e.name = 'Ism kamida 2 belgi';
    if (!form.email.trim()) e.email = 'Email kiritilishi shart';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'To\'g\'ri email kiriting';
    if (!form.password) e.password = 'Parol kiritilishi shart';
    else if (form.password.length < 6) e.password = 'Parol kamida 6 belgi';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Parollar mos kelmaydi';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setApiError('');
    if (!validate()) return;

    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/');
    } catch (err) {
      setApiError(err.response?.data?.message || 'Ro\'yxatdan o\'tishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
      <button
        type="button"
        onClick={toggleDarkMode}
        className="fixed right-4 top-4 rounded-lg p-2 text-2xl"
      >
        {darkMode ? '☀️' : '🌙'}
      </button>

      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-gray-800">
        <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
          Ro&apos;yxatdan o&apos;tish
        </h1>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          Yangi hisob yarating
        </p>

        <ErrorAlert message={apiError} onClose={() => setApiError('')} />

        <form onSubmit={handleSubmit} className="space-y-4">
          {['name', 'email', 'password', 'confirmPassword'].map((field) => {
            const labels = {
              name: 'Ism',
              email: 'Email',
              password: 'Parol',
              confirmPassword: 'Parolni tasdiqlash',
            };
            return (
              <div key={field}>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {labels[field]}
                </label>
                <input
                  type={field.includes('password') ? 'password' : field === 'email' ? 'email' : 'text'}
                  value={form[field]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                {errors[field] && <p className="mt-1 text-xs text-red-500">{errors[field]}</p>}
              </div>
            );
          })}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Kutilmoqda...' : 'Ro\'yxatdan o\'tish'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Hisobingiz bormi?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
            Kirish
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
