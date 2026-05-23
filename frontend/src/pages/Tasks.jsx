import { useCallback, useEffect, useState } from 'react';
import api from '../api/axios';
import ErrorAlert from '../components/ErrorAlert';
import Loading from '../components/Loading';

const STATUS_LABELS = {
  pending: 'Kutilmoqda',
  in_progress: 'Jarayonda',
  completed: 'Bajarildi',
};

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    category: '',
  });

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/tasks', { params: { page, limit: 8 } });
      setTasks(data.data);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Vazifalarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  }, [page]);

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/categories', { params: { limit: 50 } });
      setCategories(data.data);
    } catch {
      /* optional */
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchCategories();
  }, [fetchTasks]);

  const resetForm = () => {
    setForm({ title: '', description: '', status: 'pending', priority: 'medium', category: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!form.title.trim()) {
      setError('Sarlavha kiritilishi shart');
      return;
    }
    setError('');
    const payload = { ...form, category: form.category || undefined };

    try {
      if (editingId) {
        await api.put(`/tasks/${editingId}`, payload);
      } else {
        await api.post('/tasks', payload);
      }
      resetForm();
      fetchTasks();
    } catch (err) {
      setError(err.response?.data?.message || 'Saqlashda xatolik');
    }
  };

  const handleEdit = (task) => {
    setForm({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      category: task.category?._id || '',
    });
    setEditingId(task._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Vazifani o\'chirasizmi?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      fetchTasks();
    } catch (err) {
      setError(err.response?.data?.message || 'O\'chirishda xatolik');
    }
  };

  const priorityColor = {
    low: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
    high: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vazifalar</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Jami: {pagination.total}
          </p>
        </div>
        <button
          type="button"
          onClick={() => { resetForm(); setShowForm(true); }}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Yangi vazifa
        </button>
      </div>

      <ErrorAlert message={error} onClose={() => setError('')} />

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
        >
          <h2 className="mb-3 font-semibold dark:text-white">
            {editingId ? 'Vazifani tahrirlash' : 'Yangi vazifa'}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Sarlavha *"
              className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:col-span-2"
            />
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Tavsif"
              rows={2}
              className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:col-span-2"
            />
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="low">Past</option>
              <option value="medium">O&apos;rta</option>
              <option value="high">Yuqori</option>
            </select>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:col-span-2"
            >
              <option value="">Kategoriyasiz</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
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
      ) : tasks.length === 0 ? (
        <p className="py-12 text-center text-gray-500 dark:text-gray-400">
          Hozircha vazifalar yo&apos;q
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {tasks.map((task) => (
            <div
              key={task._id}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">{task.title}</h3>
                <span className={`rounded-full px-2 py-0.5 text-xs ${priorityColor[task.priority]}`}>
                  {task.priority}
                </span>
              </div>
              {task.description && (
                <p className="mb-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {task.description}
                </p>
              )}
              <div className="mb-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded bg-gray-100 px-2 py-0.5 dark:bg-gray-700 dark:text-gray-300">
                  {STATUS_LABELS[task.status]}
                </span>
                {task.category && (
                  <span
                    className="rounded px-2 py-0.5 text-white"
                    style={{ backgroundColor: task.category.color }}
                  >
                    {task.category.name}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleEdit(task)}
                  className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                >
                  Tahrirlash
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(task._id)}
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

export default Tasks;
