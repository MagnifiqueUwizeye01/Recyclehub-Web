import { useState } from 'react';
import RoleDashboardLayout from '../../layouts/RoleDashboardLayout';
import Button from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { changePassword } from '../../api/auth.api';
import { Key, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ChangePasswordPage() {
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirm) return toast.error('Passwords do not match');
    if (newPassword.length < 8) return toast.error('Password must be at least 8 characters');
    try {
      setLoading(true);
      await changePassword({ email: user?.email, currentPassword: oldPassword, newPassword });
      toast.success('Password changed successfully!');
      setOldPassword(''); setNewPassword(''); setConfirm('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <RoleDashboardLayout>
      <div className="max-w-md mx-auto animate-fade-in">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Key size={22} className="text-emerald-600" />
          Change password
        </h1>
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Current password</label>
              <div className="relative">
                <input
                  type={showOld ? 'text' : 'password'}
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowOld((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                >
                  {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">New password</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Confirm new password</label>
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <Button type="submit" loading={loading} className="w-full" size="lg">
              Update password
            </Button>
          </form>
        </div>
      </div>
    </RoleDashboardLayout>
  );
}
