import { useState, useCallback } from 'react';
import RoleDashboardLayout from '../../layouts/RoleDashboardLayout';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Shield } from 'lucide-react';
import { getApiErrorMessage } from '../../utils/authMapper';
import {
  beginTwoFactorSetup,
  cancelTwoFactorSetup,
  confirmTwoFactorSetup,
  disableTwoFactor,
  getMe,
} from '../../api/auth.api';
import toast from 'react-hot-toast';

/**
 * Two-factor authentication: email OTP at sign-in (no authenticator app).
 */
export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [waitingForEmailCode, setWaitingForEmailCode] = useState(false);
  const [twoFaBusy, setTwoFaBusy] = useState(false);
  const [confirmCode, setConfirmCode] = useState('');
  const [disablePwd, setDisablePwd] = useState('');
  const [showDisable2fa, setShowDisable2fa] = useState(false);

  const refreshProfile = useCallback(async () => {
    try {
      const u = await getMe();
      updateUser(u);
    } catch {
      /* ignore */
    }
  }, [updateUser]);

  return (
    <RoleDashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6 pb-16 animate-fade-in px-4 sm:px-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Security and sign-in options for your account.</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <Shield className="text-emerald-600" size={22} aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-gray-900">Two-factor authentication</h2>
              <p className="text-sm text-gray-600 mt-1">
                When this is on, each sign-in sends a <strong>6-digit code to your email</strong> after you enter your
                password. Use the same email account you use for RecycleHub.
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Status:{' '}
                <span className={user?.twoFactorEnabled ? 'text-emerald-700 font-medium' : 'text-gray-700'}>
                  {user?.twoFactorEnabled ? 'Enabled' : 'Off'}
                </span>
              </p>
            </div>
          </div>

          {user?.twoFactorEnabled ? (
            <div className="pt-2 border-t border-gray-100 space-y-4">
              {!showDisable2fa ? (
                <Button type="button" variant="outline" onClick={() => { setShowDisable2fa(true); setDisablePwd(''); }}>
                  Turn off two-factor authentication
                </Button>
              ) : (
                <div className="space-y-3 max-w-md">
                  <Input
                    label="Enter your password to confirm"
                    type="password"
                    autoComplete="current-password"
                    value={disablePwd}
                    onChange={(e) => setDisablePwd(e.target.value)}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      loading={twoFaBusy}
                      type="button"
                      variant="danger"
                      onClick={async () => {
                        try {
                          setTwoFaBusy(true);
                          await disableTwoFactor(disablePwd);
                          toast.success('Two-factor authentication is off.');
                          setShowDisable2fa(false);
                          setDisablePwd('');
                          await refreshProfile();
                        } catch (e) {
                          toast.error(getApiErrorMessage(e));
                        } finally {
                          setTwoFaBusy(false);
                        }
                      }}
                    >
                      Confirm
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => { setShowDisable2fa(false); setDisablePwd(''); }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : waitingForEmailCode ? (
            <div className="pt-2 border-t border-gray-100 space-y-4">
              <p className="text-sm text-gray-600">
                Enter the 6-digit code we sent to your email address.
              </p>
              <Input
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
                <Button
                  loading={twoFaBusy}
                  type="button"
                  onClick={async () => {
                    const d = confirmCode.replace(/\D/g, '');
                    if (d.length !== 6) {
                      toast.error('Enter the 6-digit code from your email.');
                      return;
                    }
                    try {
                      setTwoFaBusy(true);
                      await confirmTwoFactorSetup(d);
                      toast.success('Two-factor authentication is enabled.');
                      setWaitingForEmailCode(false);
                      setConfirmCode('');
                      await refreshProfile();
                    } catch (e) {
                      toast.error(getApiErrorMessage(e));
                    } finally {
                      setTwoFaBusy(false);
                    }
                  }}
                >
                  Confirm
                </Button>
                <Button
                  variant="secondary"
                  type="button"
                  loading={twoFaBusy}
                  onClick={async () => {
                    try {
                      setTwoFaBusy(true);
                      await cancelTwoFactorSetup();
                      setWaitingForEmailCode(false);
                      setConfirmCode('');
                      toast.success('Setup cancelled.');
                    } catch (e) {
                      toast.error(getApiErrorMessage(e));
                    } finally {
                      setTwoFaBusy(false);
                    }
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="pt-2 border-t border-gray-100">
              <Button
                type="button"
                onClick={async () => {
                  try {
                    setTwoFaBusy(true);
                    const msg = await beginTwoFactorSetup();
                    setWaitingForEmailCode(true);
                    setConfirmCode('');
                    toast.success(msg || 'Check your email for the code.');
                  } catch (e) {
                    toast.error(getApiErrorMessage(e));
                  } finally {
                    setTwoFaBusy(false);
                  }
                }}
                loading={twoFaBusy}
              >
                Enable two-factor authentication
              </Button>
            </div>
          )}
        </div>
      </div>
    </RoleDashboardLayout>
  );
}
