import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { register as registerApi } from '../../api/auth.api';
import { uploadSellerLicense } from '../../api/uploads.api';
import { registerPersonalSchema } from '../../utils/validators';
import { Recycle, Eye, EyeOff, Building2, ShoppingBag, Check, AlertCircle } from 'lucide-react';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { getApiErrorMessage } from '../../utils/authMapper';
import { getDashboardPath } from '../../utils/roleGuard';

const steps = ['Choose Role', 'Personal Info', 'Company Info'];

export default function RegisterPage() {
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const preselected = location.state?.preselectedRole || location.state?.role;
  const [step, setStep] = useState(preselected === 'Buyer' || preselected === 'Seller' ? 1 : 0);
  const [role, setRole] = useState(() => {
    const r = location.state?.preselectedRole || location.state?.role;
    if (r === 'Seller' || r === 'Buyer') return r;
    return '';
  });
  const [loading, setLoading] = useState(false);
  const [registrationError, setRegistrationError] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [companyData, setCompanyData] = useState({});

  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    resolver: step === 1 ? zodResolver(registerPersonalSchema) : undefined,
  });

  const onPersonalSubmit = (data) => {
    setCompanyData((prev) => ({ ...prev, ...data }));
    setStep(2);
  };

  const onFinalSubmit = async (e) => {
    e.preventDefault();
    if (!companyData?.username || !companyData?.password || companyData?.confirmPassword === undefined) {
      toast.error('Your session data was lost. Go back to Personal Info and continue again.');
      setStep(1);
      return;
    }
    const fd = new FormData(e.target);
    const file = fd.get('licenseDocument');
    const websiteRaw = (fd.get('websiteUrl') || '').toString().trim();

    let licenseDocument;
    try {
      setLoading(true);
      setRegistrationError('');
      if (role === 'Seller' && file instanceof File && file.size > 0) {
        licenseDocument = await uploadSellerLicense(file);
      } else if (role === 'Seller') {
        licenseDocument = undefined;
      }

      const payload = {
        username: companyData.username,
        firstName: companyData.firstName,
        lastName: companyData.lastName,
        email: companyData.email,
        phoneNumber: companyData.phoneNumber || undefined,
        password: companyData.password,
        confirmPassword: companyData.confirmPassword,
        gender: companyData.gender,
        role: role === 'Seller' ? 'Seller' : 'Buyer',
        companyName: fd.get('companyName') || undefined,
        industryType: role === 'Buyer' ? fd.get('industryType') || undefined : undefined,
        city: fd.get('city') || undefined,
        address: fd.get('address') || undefined,
        websiteUrl: websiteRaw && websiteRaw !== 'https://' ? websiteRaw : undefined,
        licenseDocument: role === 'Seller' ? licenseDocument : undefined,
      };
      const result = await registerApi(payload);
      if (!result?.token || !result?.user) {
        toast.error('Invalid response from server');
        return;
      }
      login(result.token, result.user);
      toast.success('Welcome to RecycleHub!');
      navigate(getDashboardPath(result.user.role));
    } catch (err) {
      const msg = getApiErrorMessage(err);
      setRegistrationError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const password = watch?.('password');
  const getStrength = (p = '') => {
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };
  const strength = getStrength(password);
  const strengthColors = ['bg-red-500', 'bg-orange-400', 'bg-amber-400', 'bg-hub-accent'];

  return (
    <div className="min-h-screen bg-hub-bg flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex w-2/5 bg-hub-surface border-r border-hub-border flex-col justify-center px-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-hub-accent/5 rounded-full blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-hub-accent flex items-center justify-center">
              <Recycle size={22} className="text-white" />
            </div>
            <span className="font-display font-bold text-hub-text text-2xl">RecycleHub</span>
          </div>
          <h2 className="text-3xl font-display font-bold text-hub-text mb-4">Join the circular economy</h2>
          <p className="text-hub-muted font-body mb-8">Connect with verified buyers and sellers of industrial recyclable materials across Africa.</p>
          {['Free to register', 'Verified marketplace', 'B2B sourcing', 'Secure MoMo payments'].map((f) => (
            <div key={f} className="flex items-center gap-3 mb-3">
              <div className="w-5 h-5 rounded-full bg-hub-accent/10 border border-hub-accent/30 flex items-center justify-center">
                <Check size={10} className="text-hub-accent" />
              </div>
              <span className="text-sm text-hub-textMuted font-body">{f}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Steps */}
          <div className="flex items-center gap-2 mb-8">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all ${i <= step ? 'bg-hub-accent text-white' : 'bg-hub-surface2 text-hub-muted border border-hub-border'}`}>
                  {i < step ? <Check size={12} /> : i + 1}
                </div>
                <span className={`text-xs font-body ${i === step ? 'text-hub-text' : 'text-hub-muted'}`}>{s}</span>
                {i < steps.length - 1 && <div className={`flex-1 h-0.5 ${i < step ? 'bg-hub-accent' : 'bg-hub-border'}`} />}
              </div>
            ))}
          </div>

          {/* Step 0: Role */}
          {step === 0 && (
            <div>
              <h1 className="text-2xl font-display font-bold text-hub-text mb-2">Choose your role</h1>
              <p className="text-hub-muted text-sm mb-6">How will you use RecycleHub?</p>
              <div className="space-y-3">
                {[
                  { r: 'Buyer', icon: <ShoppingBag size={28} />, title: 'I\'m a Buyer', desc: 'Browse and purchase verified recyclable materials for your business.' },
                  { r: 'Seller', icon: <Building2 size={28} />, title: 'I\'m a Seller', desc: 'List and sell industrial recyclable materials to verified buyers.' },
                ].map(({ r, icon, title, desc }) => (
                  <button key={r} onClick={() => { setRole(r); setStep(1); }}
                    className="w-full p-5 bg-hub-surface border border-hub-border rounded-2xl text-left hover:border-hub-accent/40 hover:bg-hub-surface2 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-hub-accent/10 flex items-center justify-center text-hub-accent group-hover:scale-110 transition-transform">{icon}</div>
                      <div>
                        <h3 className="font-display font-bold text-hub-text">{title}</h3>
                        <p className="text-xs text-hub-muted font-body mt-0.5">{desc}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Personal Info */}
          {step === 1 && (
            <form onSubmit={handleSubmit(onPersonalSubmit)} className="space-y-4">
              {location.state?.preselectedRole === 'Buyer' && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-900">
                  Create a free buyer account to start purchasing materials
                </div>
              )}
              {registrationError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2">
                  <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{registrationError}</p>
                </div>
              )}
              <h1 className="text-2xl font-display font-bold text-hub-text mb-4">Personal Information</h1>
              <div className="grid grid-cols-2 gap-3">
                <Input label="First Name" required error={errors.firstName?.message} {...register('firstName')} />
                <Input label="Last Name" required error={errors.lastName?.message} {...register('lastName')} />
              </div>
              <Input label="Username" required error={errors.username?.message} {...register('username')} />
              <Select label="Gender" required options={[{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }]} placeholder="Select gender" error={errors.gender?.message} {...register('gender')} />
              <Input label="Email" type="email" required error={errors.email?.message} {...register('email')} />
              <Input label="Phone Number" type="tel" placeholder="+250..." error={errors.phoneNumber?.message} {...register('phoneNumber')} />
              <div>
                <Input label="Password" type={showPwd ? 'text' : 'password'} required error={errors.password?.message}
                  rightElement={<button type="button" onClick={() => setShowPwd((p) => !p)} className="text-hub-muted hover:text-hub-text">{showPwd ? <EyeOff size={16} /> : <Eye size={16} />}</button>}
                  {...register('password')} />
                {password && (
                  <div className="flex gap-1 mt-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full ${i < strength ? strengthColors[strength - 1] : 'bg-hub-border'}`} />
                    ))}
                  </div>
                )}
              </div>
              <Input label="Confirm Password" type="password" required error={errors.confirmPassword?.message} {...register('confirmPassword')} />
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => setStep(0)} className="flex-1">Back</Button>
                <Button type="submit" className="flex-1">Continue</Button>
              </div>
            </form>
          )}

          {/* Step 2: Company */}
          {step === 2 && (
            <form onSubmit={onFinalSubmit} className="space-y-4">
              {registrationError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2">
                  <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{registrationError}</p>
                </div>
              )}
              <h1 className="text-2xl font-display font-bold text-hub-text mb-4">Company Information</h1>
              <Input label="Company Name" name="companyName" required />
              {role === 'Buyer' && <Input label="Industry Type" name="industryType" />}
              <Input label="City" name="city" required />
              <Input label="Address" name="address" required />
              <Input label="Website (optional)" name="websiteUrl" type="text" inputMode="url" placeholder="https://example.com" />
              <textarea name="description" placeholder="Brief company description (optional)"
                className="w-full bg-hub-surface border border-hub-border rounded-lg px-3 py-2.5 text-hub-text placeholder-hub-muted text-sm font-body focus:outline-none focus:border-hub-accent resize-none h-20" />
              {role === 'Seller' && (
                <div>
                  <label className="text-sm font-medium text-hub-textMuted font-body block mb-1.5">License Document</label>
                  <input type="file" name="licenseDocument" accept=".pdf,.jpg,.jpeg,.png"
                    className="w-full bg-hub-surface border border-hub-border rounded-lg px-3 py-2.5 text-hub-text text-sm font-body focus:outline-none focus:border-hub-accent file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-hub-accent/10 file:text-hub-accent" />
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => setStep(1)} className="flex-1">Back</Button>
                <Button type="submit" loading={loading} className="flex-1">Create Account</Button>
              </div>
            </form>
          )}

          <p className="text-center text-sm text-hub-muted mt-6 font-body">
            Already have an account? <Link to="/login" className="text-hub-accent hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
