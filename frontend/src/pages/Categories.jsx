import { useCallback, useEffect, useState } from 'react';
import api from '../api/axios';
import ErrorAlert from '../components/ErrorAlert';
import Loading from '../components/Loading';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', color: '#3b82f6' });

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/categories', { params: { page, limit: 8 } });
      setCategories(data.data);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Kategoriyalarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const resetForm = () => {
    setForm({ name: '', description: '', color: '#3b82f6' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!form.name.trim()) {
      setError('Nom kiritilishi shart');
      return;
    }
    setError('');
    try {
      if (editingId) {
        await api.put(`/categories/${editingId}`, form);
      } else {
        await api.post('/categories', form);
      }
      resetForm();
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Saqlashda xatolik');
    }
  };

  const handleEdit = (cat) => {
    setForm({
      name: cat.name,
      description: cat.description || '',
      color: cat.color || '#3b82f6',
    });
    setEditingId(cat._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Kategoriyani o\'chirasizmi?')) return;
    try {
      await api.delete(`/categories/${id}`);
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'O\'chirishda xatolik');
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kategoriyalar</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Jami: {pagination.total}</p>
        </div>
        <button
          type="button"
          onClick={() => { resetForm(); setShowForm(true); }}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Yangi kategoriya
        </button>
      </div>

      <ErrorAlert message={error} onClose={() => setError('')} />

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
        >
          <h2 className="mb-3 font-semibold dark:text-white">
            {editingId ? 'Tahrirlash' : 'Yangi kategoriya'}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nom *"
              className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <input
              type="color"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              className="h-10 w-full cursor-pointer rounded-lg border border-gray-300 dark:border-gray-600"
            />
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Tavsif"
              rows={2}
              className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:col-span-2"
            />
          </div>
          <div className="mt-3 flex gap-2">
            <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
              Saqlash
            </button>
            <button type="button" onClick={resetForm} className="rounded-lg border px-4 py-2 text-sm dark:border-gray-600 dark:text-gray-300">
              Bekor qilish
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <Loading />
      ) : categories.length === 0 ? (
        <p className="py-12 text-center text-gray-500 dark:text-gray-400">
          Kategoriyalar yo&apos;q
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <div
              key={cat._id}
              className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
              style={{ borderLeftWidth: 4, borderLeftColor: cat.color }}
            >
              <h3 className="font-semibold text-gray-900 dark:text-white">{cat.name}</h3>
              {cat.description && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{cat.description}</p>
              )}
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => handleEdit(cat)}
                  className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                >
                  Tahrirlash
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(cat._id)}
                  className="text-sm text-red-600 hover:underline dark:text-red-400"
                >
                  O&apos;chirish
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg border px-3 py-1 text-sm disabled:opacity-40 dark:border-gray-600 dark:text-gray-300"
          >
            Oldingi
          </button>
          <span className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400">
            {page} / {pagination.pages}
          </span>
          <button
            type="button"
            disabled={page >= pagination.pages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border px-3 py-1 text-sm disabled:opacity-40 dark:border-gray-600 dark:text-gray-300"
          >
            Keyingi
          </button>
        </div>
      )}
    </div>
  );
};

export default Categories;
