import { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { MATERIAL_TYPES } from '../../utils/constants';
import toast from 'react-hot-toast';

export default function AdminConfigPage() {
  const [pageSize, setPageSize] = useState(12);
  const [categories, setCategories] = useState(MATERIAL_TYPES);
  const [newCategory, setNewCategory] = useState('');

  const addCategory = () => {
    const value = newCategory.trim();
    if (!value) return;
    if (categories.includes(value)) return;
    setCategories((prev) => [...prev, value]);
    setNewCategory('');
  };

  const save = () => {
    localStorage.setItem('rh_config', JSON.stringify({ pageSize, categories }));
    toast.success('Settings saved.');
  };

  return (
    <AdminLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <div className="space-y-4 rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
          <label className="block text-sm text-gray-700">
            Default page size: {pageSize}
            <input type="range" min={5} max={50} value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="mt-2 w-full" />
          </label>
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Material categories</p>
            <div className="mb-2 flex flex-wrap gap-2">
              {categories.map((item) => (
                <span key={item} className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-700">{item}</span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Add category" />
              <button type="button" onClick={addCategory} className="rounded-lg border border-emerald-600 px-3 py-2 text-sm text-emerald-700">Add</button>
            </div>
          </div>
          <button type="button" onClick={save} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white">Save Settings</button>
        </div>
      </div>
    </AdminLayout>
  );
}
