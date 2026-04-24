import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Recycle } from 'lucide-react';
import { login as loginApi, completeTwoFactorLogin } from '../../api/auth.api';
import { useAuth } from '../../hooks/useAuth';
import { loginSchema } from '../../utils/validators';
import { getDashboardPath } from '../../utils/roleGuard';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';
import { getApiErrorMessage } from '../../utils/authMapper';

export default function LoginPage() {
  const { login, isAuthenticated, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [showPwd, setShowPwd] = useState(false);
  const [twoFaChallengeToken, setTwoFaChallengeToken] = useState(null);
  const [emailOtp, setEmailOtp] = useState('');
  const [otpSubmitting, setOtpSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    if (authLoading || !isAuthenticated || !user) return;
    navigate(getDashboardPath(user.role), { replace: true });
  }, [authLoading, isAuthenticated, user, navigate]);

  const finishLogin = (authToken, userData) => {
    login(authToken, userData, { remember: rememberMe });
    toast.success(`Welcome back, ${userData.firstName || userData.email}!`);
    navigate(getDashboardPath(userData.role));
  };

  const onSubmit = async (data) => {
    try {
      const result = await loginApi(data);
      if (result?.requiresTwoFactor && result.twoFactorChallengeToken) {
        setTwoFaChallengeToken(result.twoFactorChallengeToken);
        setEmailOtp('');
        return;
      }
      if (!result?.token || !result?.user) {
        toast.error('Invalid response from server');
        return;
      }
      const { token, user } = result;
      finishLogin(token, user);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const onSubmitOtp = async (e) => {
    e.preventDefault();
    const digits = emailOtp.replace(/\D/g, '');
    if (digits.length !== 6) {
      toast.error('Enter the 6-digit code from your email.');
      return;
    }
    try {
      setOtpSubmitting(true);
      const result = await completeTwoFactorLogin({ challengeToken: twoFaChallengeToken, code: digits });
      if (!result?.token || !result?.user) {
        toast.error('Invalid response from server');
        return;
      }
      finishLogin(result.token, result.user);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setOtpSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-hub-bg flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-30" />
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-hub-accent flex items-center justify-center">
              <Recycle size={22} className="text-white" />
            </div>
            <span className="font-display font-bold text-hub-text text-2xl">RecycleHub</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-hub-text">Welcome back</h1>
          <p className="text-hub-muted text-sm font-body mt-1">Sign in to your account</p>
        </div>
        <div className="bg-hub-surface border border-hub-border rounded-2xl p-8 shadow-2xl glow-emerald">
          <div className="-mt-2 mb-6 flex justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-full border border-hub-border bg-white px-4 py-2 text-sm font-semibold text-hub-muted shadow-sm transition-colors hover:border-emerald-200 hover:text-emerald-800"
            >
              Back to marketplace
            </Link>
          </div>
          {twoFaChallengeToken ? (
            <form onSubmit={onSubmitOtp} className="space-y-4">
              <p className="text-sm text-hub-muted font-body">
                We sent a 6-digit code to your email. Enter it below to finish signing in.
              </p>
              <Input
                label="Email code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                maxLength={8}
                value={emailOtp}
                onChange={(ev) => setEmailOtp(ev.target.value)}
                icon={<Lock size={16} />}
              />
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setTwoFaChallengeToken(null);
                    setEmailOtp('');
                  }}
                >
                  Back
                </Button>
                <Button type="submit" loading={otpSubmitting} className="flex-1" size="lg">
                  Verify &amp; sign in
                </Button>
              </div>
            </form>
          ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              icon={<Mail size={16} />}
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password"
              type={showPwd ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              icon={<Lock size={16} />}
              error={errors.password?.message}
              rightElement={
                <button type="button" onClick={() => setShowPwd((p) => !p)} className="text-hub-muted hover:text-hub-text transition-colors">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              {...register('password')}
            />
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 text-hub-muted">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="accent-hub-accent"
                  />
                  Remember me on this device
                </label>
                <Link to="/forgot-password" className="shrink-0 text-hub-accent hover:underline">
                  Forgot password?
                </Link>
              </div>
              <p className="text-[11px] leading-snug text-hub-muted/90">
                Leave unchecked to sign out automatically when you close the browser (recommended on shared computers).
              </p>
            </div>
            <Button type="submit" loading={isSubmitting} className="w-full" size="lg">Sign In</Button>
          </form>
          )}
          <p className="text-center text-sm text-hub-muted mt-6 font-body">
            Don't have an account?{' '}
            <Link to="/register" className="text-hub-accent hover:underline">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
