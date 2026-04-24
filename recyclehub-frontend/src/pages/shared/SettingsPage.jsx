import { useState, useCallback } from 'react';
import RoleDashboardLayout from '../../layouts/RoleDashboardLayout';
import { useAuth } from '../../hooks/useAuth';
import { getApiErrorMessage } from '../../utils/authMapper';
import {
  Shield, CheckCircle, XCircle, Mail, Loader2,
  Lock, AlertTriangle, ChevronRight,
} from 'lucide-react';
import {
  beginTwoFactorSetup,
  cancelTwoFactorSetup,
  confirmTwoFactorSetup,
  disableTwoFactor,
  getMe,
} from '../../api/auth.api';
import toast from 'react-hot-toast';

/* ─── small input ──────────────────────────────────────────────────────── */
function FieldInput({ label, ...props }) {
  return (
    <div>
      {label && <label className="mb-1.5 block text-xs font-semibold text-gray-500">{label}</label>}
      <input
        {...props}
        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 transition-all focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
      />
    </div>
  );
}

/* ─── action button ─────────────────────────────────────────────────────── */
function Btn({ children, loading, variant = 'primary', onClick, type = 'button', ...rest }) {
  const styles = {
    primary:   'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
    secondary: 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
    danger:    'bg-red-600 text-white hover:bg-red-700 shadow-sm',
  };
  return (
    <button type={type} onClick={onClick} disabled={loading}
      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-60 ${styles[variant]}`}
      {...rest}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  );
}

/* ─── page ──────────────────────────────────────────────────────────────── */
export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [waitingForCode,  setWaitingForCode]  = useState(false);
  const [busy,            setBusy]            = useState(false);
  const [confirmCode,     setConfirmCode]     = useState('');
  const [disablePwd,      setDisablePwd]      = useState('');
  const [showDisable2fa,  setShowDisable2fa]  = useState(false);

  const refreshProfile = useCallback(async () => {
    try { const u = await getMe(); updateUser(u); } catch { /* ignore */ }
  }, [updateUser]);

  const is2faEnabled = !!user?.twoFactorEnabled;

  return (
    <RoleDashboardLayout>
      <div className="mx-auto max-w-2xl space-y-6 pb-16">
        {/* title */}
        <div>
          <h1 className="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-2xl font-bold text-transparent md:text-3xl">
            Settings
          </h1>
          <p className="mt-1 text-sm text-gray-500">Security and sign-in options for your account.</p>
        </div>

        {/* 2FA card */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          {/* header */}
          <div className="border-b border-gray-100 p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                <Shield size={22} className="text-emerald-600" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-base font-semibold text-gray-900">Two-factor authentication</h2>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${is2faEnabled ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                    {is2faEnabled ? <><CheckCircle size={11} /> Enabled</> : <><XCircle size={11} /> Off</>}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  Each sign-in sends a <strong>6-digit code to your email</strong> after you enter your password.
                </p>
              </div>
            </div>
          </div>

          {/* body */}
          <div className="p-5">
            {is2faEnabled ? (
              !showDisable2fa ? (
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50">
                    <AlertTriangle size={16} className="text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">Two-factor authentication is active</p>
                    <p className="mt-0.5 text-xs text-gray-500">Your account is protected with an email verification code on each sign-in.</p>
                    <button type="button" onClick={() => { setShowDisable2fa(true); setDisablePwd(''); }}
                      className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 transition-colors">
                      Turn off two-factor authentication <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
                    Disabling 2FA will make your account less secure. Enter your password to confirm.
                  </div>
                  <FieldInput
                    label="Current password"
                    type="password"
                    autoComplete="current-password"
                    value={disablePwd}
                    onChange={(e) => setDisablePwd(e.target.value)}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Btn variant="danger" loading={busy} onClick={async () => {
                      try {
                        setBusy(true);
                        await disableTwoFactor(disablePwd);
                        toast.success('Two-factor authentication is off.');
                        setShowDisable2fa(false);
                        setDisablePwd('');
                        await refreshProfile();
                      } catch (e) { toast.error(getApiErrorMessage(e)); }
                      finally { setBusy(false); }
                    }}>Confirm disable</Btn>
                    <Btn variant="secondary" onClick={() => { setShowDisable2fa(false); setDisablePwd(''); }}>Cancel</Btn>
                  </div>
                </div>
              )
            ) : waitingForCode ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-3">
                  <Mail size={16} className="mt-0.5 shrink-0 text-blue-600" />
                  <p className="text-sm text-blue-700">We sent a 6-digit code to your email. Enter it below to complete setup.</p>
                </div>
                <FieldInput
                  label="Email code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="000000"
                  maxLength={8}
                  value={confirmCode}
                  onChange={(e) => setConfirmCode(e.target.value)}
                />
                <div className="flex flex-wrap gap-2">
                  <Btn loading={busy} onClick={async () => {
                    const d = confirmCode.replace(/\D/g, '');
                    if (d.length !== 6) { toast.error('Enter the 6-digit code from your email.'); return; }
                    try {
                      setBusy(true);
                      await confirmTwoFactorSetup(d);
                      toast.success('Two-factor authentication is enabled.');
                      setWaitingForCode(false);
                      setConfirmCode('');
                      await refreshProfile();
                    } catch (e) { toast.error(getApiErrorMessage(e)); }
                    finally { setBusy(false); }
                  }}>Verify &amp; Enable</Btn>
                  <Btn variant="secondary" loading={busy} onClick={async () => {
                    try {
                      setBusy(true);
                      await cancelTwoFactorSetup();
                      setWaitingForCode(false);
                      setConfirmCode('');
                      toast.success('Setup cancelled.');
                    } catch (e) { toast.error(getApiErrorMessage(e)); }
                    finally { setBusy(false); }
                  }}>Cancel</Btn>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                  <Lock size={16} className="text-gray-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Add an extra layer of security to your account by requiring an email code each time you sign in.</p>
                  <Btn loading={busy} onClick={async () => {
                    try {
                      setBusy(true);
                      const msg = await beginTwoFactorSetup();
                      setWaitingForCode(true);
                      setConfirmCode('');
                      toast.success(msg || 'Check your email for the code.');
                    } catch (e) { toast.error(getApiErrorMessage(e)); }
                    finally { setBusy(false); }
                  }} className="mt-3">
                    Enable two-factor authentication
                  </Btn>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* quick links */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-5">
            <h2 className="text-base font-semibold text-gray-900">Account</h2>
          </div>
          {[
            { label: 'Change password',   href: '/change-password', icon: Lock,  desc: 'Update your account password' },
            { label: 'Manage profile',    href: '/profile',          icon: Shield, desc: 'Edit personal and company info' },
          ].map(({ label, href, icon: Icon, desc }) => (
            <a key={href} href={href}
              className="flex items-center gap-4 border-b border-gray-50 px-5 py-4 transition-colors hover:bg-gray-50 last:border-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                <Icon size={16} className="text-gray-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{label}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </a>
          ))}
        </div>
      </div>
    </RoleDashboardLayout>
  );
}
