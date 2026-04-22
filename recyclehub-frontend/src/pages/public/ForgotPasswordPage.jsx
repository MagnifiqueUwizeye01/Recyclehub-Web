import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Recycle, ArrowLeft } from 'lucide-react';
import { forgotPassword } from '../../api/auth.api';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    try {
      const message = await forgotPassword(data);
      toast.success(message || 'Request received.');
      const q = encodeURIComponent((data.email || '').trim());
      navigate(`/reset-password?email=${q}`, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Request failed');
    }
  };

  return (
    <div className="min-h-screen bg-hub-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-hub-accent flex items-center justify-center"><Recycle size={22} className="text-white" /></div>
            <span className="font-display font-bold text-hub-text text-2xl">RecycleHub</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-hub-text">Forgot password</h1>
          <p className="text-hub-muted text-sm mt-1">We&apos;ll email a 6-digit code if an account exists for this address.</p>
        </div>
        <div className="bg-hub-surface border border-hub-border rounded-2xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Email address" type="email" placeholder="you@company.com" icon={<Mail size={16} />} {...register('email', { required: true })} />
            <Button type="submit" loading={isSubmitting} className="w-full">Send code</Button>
            <Link to="/login" className="flex items-center gap-1 text-sm text-hub-muted hover:text-hub-text transition-colors justify-center">
              <ArrowLeft size={14} /> Back to login
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}
