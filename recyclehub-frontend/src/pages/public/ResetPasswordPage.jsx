import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Recycle } from 'lucide-react';
import { resetPassword } from '../../api/auth.api';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const emailFromQuery = (params.get('email') || '').trim();

  const { register, handleSubmit, watch, reset, formState: { isSubmitting, errors } } = useForm({
    defaultValues: { email: emailFromQuery, otp: '', newPassword: '', confirmPassword: '' },
  });

  useEffect(() => {
    reset({
      email: emailFromQuery,
      otp: '',
      newPassword: '',
      confirmPassword: '',
    });
  }, [emailFromQuery, reset]);

  const onSubmit = async (data) => {
    try {
      const msg = await resetPassword({
        email: data.email.trim(),
        otp: data.otp.replace(/\s/g, ''),
        newPassword: data.newPassword,
      });
      toast.success(msg || 'Password reset successfully!');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Reset failed');
    }
  };

  return (
    <div className="min-h-screen bg-hub-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-4 flex justify-center">
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-full border border-hub-border bg-white px-4 py-2 text-sm font-semibold text-hub-muted shadow-sm transition-colors hover:border-emerald-200 hover:text-emerald-800"
          >
            Back to sign in
          </Link>
        </div>
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-hub-accent flex items-center justify-center"><Recycle size={22} className="text-white" /></div>
            <span className="font-display font-bold text-hub-text text-2xl">RecycleHub</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-hub-text">Reset password</h1>
          <p className="text-hub-muted text-sm mt-1">Enter the 6-digit code from your email, then choose a new password.</p>
        </div>
        <div className="bg-hub-surface border border-hub-border rounded-2xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              required
              error={errors.email?.message}
              {...register('email', { required: 'Email is required' })}
            />
            <Input
              label="Verification code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              maxLength={8}
              required
              error={errors.otp?.message}
              {...register('otp', {
                required: 'Code is required',
                pattern: { value: /^\s*\d{6}\s*$/, message: 'Enter the 6-digit code from your email' },
              })}
            />
            <Input
              label="New password"
              type="password"
              required
              error={errors.newPassword?.message}
              {...register('newPassword', { minLength: { value: 8, message: 'Min 8 characters' } })}
            />
            <Input
              label="Confirm password"
              type="password"
              required
              error={errors.confirmPassword?.message}
              {...register('confirmPassword', {
                validate: (v) => v === watch('newPassword') || 'Passwords do not match',
              })}
            />
            <Button type="submit" loading={isSubmitting} className="w-full">Reset password</Button>
            <Link to="/login" className="block text-center text-sm text-hub-muted hover:text-hub-text">Back to login</Link>
          </form>
        </div>
      </div>
    </div>
  );
}
