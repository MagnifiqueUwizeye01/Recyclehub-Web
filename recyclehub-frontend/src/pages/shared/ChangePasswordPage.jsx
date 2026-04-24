import { useState } from 'react';
import RoleDashboardLayout from '../../layouts/RoleDashboardLayout';
import { useAuth } from '../../hooks/useAuth';
import { changePassword } from '../../api/auth.api';
import { Key, Eye, EyeOff, Lock, CheckCircle, Loader2, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

function PasswordInput({ label, hint, value, onChange, show, onToggle }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-gray-500">{label}</label>
      <div className="relative">
        <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type={show ? 'text' : 'password'}
          required
          value={value}
          onChange={onChange}
          className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-10 text-sm text-gray-900 transition-all focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
        />
        <button type="button" onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-700">
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

export default function ChangePasswordPage() {
  const [showOld,      setShowOld]      = useState(false);
  const [showNew,      setShowNew]      = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [oldPassword,  setOldPassword]  = useState('');
  const [newPassword,  setNewPassword]  = useState('');
  const [confirm,      setConfirm]      = useState('');
  const [loading,      setLoading]      = useState(false);
  const { user } = useAuth();

  /* password strength */
  const strength = (() => {
    if (!newPassword) return 0;
    let s = 0;
    if (newPassword.length >= 8)  s++;
    if (/[A-Z]/.test(newPassword)) s++;
    if (/[0-9]/.test(newPassword)) s++;
    if (/[^A-Za-z0-9]/.test(newPassword)) s++;
    return s;
  })();
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = ['', 'bg-red-500', 'bg-amber-500', 'bg-blue-500', 'bg-emerald-500'][strength];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirm) return toast.error('Passwords do not match.');
    if (newPassword.length < 8)  return toast.error('Password must be at least 8 characters.');
    try {
      setLoading(true);
      await changePassword({ email: user?.email, currentPassword: oldPassword, newPassword });
      toast.success('Password changed successfully!');
      setOldPassword(''); setNewPassword(''); setConfirm('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <RoleDashboardLayout>
      <div className="mx-auto max-w-md">
        {/* title */}
        <div className="mb-6">
          <h1 className="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-2xl font-bold text-transparent">
            Change Password
          </h1>
          <p className="mt-1 text-sm text-gray-500">Update your account password to keep your account secure.</p>
        </div>

        {/* tips */}
        <div className="mb-6 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 p-4">
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-emerald-800">
            <ShieldCheck size={14} /> Password requirements
          </p>
          <ul className="space-y-1">
            {[
              ['At least 8 characters', newPassword.length >= 8],
              ['One uppercase letter',  /[A-Z]/.test(newPassword)],
              ['One number',            /[0-9]/.test(newPassword)],
              ['One special character', /[^A-Za-z0-9]/.test(newPassword)],
            ].map(([text, met]) => (
              <li key={text} className={`flex items-center gap-2 text-xs ${met ? 'text-emerald-700' : 'text-gray-500'}`}>
                <CheckCircle size={11} className={met ? 'text-emerald-500' : 'text-gray-300'} />
                {text}
              </li>
            ))}
          </ul>
        </div>

        {/* form */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                <Key size={18} className="text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Update password</p>
                <p className="text-xs text-gray-500">Signed in as {user?.email}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 p-5">
            <PasswordInput
              label="Current password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              show={showOld}
              onToggle={() => setShowOld((p) => !p)}
            />
            <PasswordInput
              label="New password"
              hint="Must be at least 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              show={showNew}
              onToggle={() => setShowNew((p) => !p)}
            />

            {/* strength meter */}
            {newPassword.length > 0 && (
              <div>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-gray-500">Password strength</span>
                  <span className={`font-medium ${['','text-red-500','text-amber-500','text-blue-500','text-emerald-600'][strength]}`}>{strengthLabel}</span>
                </div>
                <div className="flex gap-1">
                  {[1,2,3,4].map((i) => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= strength ? strengthColor : 'bg-gray-100'}`} />
                  ))}
                </div>
              </div>
            )}

            <PasswordInput
              label="Confirm new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              show={showConfirm}
              onToggle={() => setShowConfirm((p) => !p)}
            />

            {confirm && newPassword && (
              <div className={`flex items-center gap-2 text-xs ${confirm === newPassword ? 'text-emerald-600' : 'text-red-500'}`}>
                <CheckCircle size={12} />
                {confirm === newPassword ? 'Passwords match' : 'Passwords do not match'}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 disabled:opacity-60">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Updating…</> : <><Key size={16} /> Update Password</>}
            </button>
          </form>
        </div>
      </div>
    </RoleDashboardLayout>
  );
}
