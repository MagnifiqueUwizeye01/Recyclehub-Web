import { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import ModernPageHeader from '../../components/ui/ModernPageHeader';
import ModernPanel from '../../components/ui/ModernPanel';
import { MATERIAL_TYPES } from '../../utils/constants';
import toast from 'react-hot-toast';

export default function AdminConfigPage() {
  const [categories, setCategories] = useState(MATERIAL_TYPES);
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('rh_config');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.categories)) setCategories(parsed.categories);
    } catch {
      /* ignore */
    }
  }, []);

  const addCategory = () => {
    const value = newCategory.trim();
    if (!value) return;
    if (categories.includes(value)) return;
    setCategories((prev) => [...prev, value]);
    setNewCategory('');
  };

  const save = () => {
    localStorage.setItem('rh_config', JSON.stringify({ categories }));
    toast.success('Settings saved.');
  };

  return (
    <AdminLayout>
      <div className="mx-auto w-full max-w-4xl space-y-8">
        <ModernPageHeader
          title="Platform settings"
          description="Local preferences for listing categories. Saved in this browser."
        />
        <ModernPanel title="Material categories" subtitle="Used when sellers classify listings.">
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Active tags</p>
            <div className="mb-2 flex flex-wrap gap-2">
              {categories.map((item) => (
                <span key={item} className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-700">
                  {item}
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="Add category"
              />
              <button type="button" onClick={addCategory} className="rounded-lg border border-emerald-600 px-3 py-2 text-sm text-emerald-700">
                Add
              </button>
            </div>
          </div>
          <button type="button" onClick={save} className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700">
            Save settings
          </button>
        </ModernPanel>
      </div>
    </AdminLayout>
  );
}
