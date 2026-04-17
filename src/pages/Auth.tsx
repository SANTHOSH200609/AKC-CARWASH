import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { z } from 'zod';
import { Mail, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Logo } from '@/components/Logo';
import { LanguageSwitch } from '@/components/LanguageSwitch';
import { useLang } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

const emailSchema = z.string().trim().email().max(255);
const otpSchema = z.string().regex(/^\d{6}$/);

const Auth = () => {
  const { t } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as any)?.redirectTo || '/';

  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    const v = emailSchema.safeParse(email);
    if (!v.success) return toast.error('Enter a valid email');
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { data: { full_name: fullName, phone } },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success('Code sent to your email');
    setStep('otp');
  };

  const verifyOtp = async () => {
    const v = otpSchema.safeParse(otp);
    if (!v.success) return toast.error('Enter the 6-digit code');
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(t('welcome') + '!');
    navigate(redirectTo, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
      <div className="mx-auto max-w-md px-5 pt-6">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-1 text-sm text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <LanguageSwitch />
        </div>

        <div className="mt-12 flex flex-col items-center text-center">
          <Logo size="lg" />
          <h1 className="mt-6 font-display text-2xl font-bold">{t('welcome')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('tagline')}</p>
        </div>

        <Card className="mt-8 p-6 shadow-elevated">
          {step === 'email' ? (
            <div className="space-y-4 animate-fade-up">
              <div>
                <Label htmlFor="name">{t('fullName')}</Label>
                <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
              </div>
              <div>
                <Label htmlFor="phone">{t('phone')}</Label>
                <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 9876543210" />
              </div>
              <div>
                <Label htmlFor="email">{t('email')}</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <Button onClick={sendOtp} disabled={loading} size="lg" className="w-full">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                {t('sendOtp')}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                We'll email you a 6-digit code to verify
              </p>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-up">
              <div>
                <Label htmlFor="otp">{t('otpCode')}</Label>
                <Input
                  id="otp"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="text-center text-2xl tracking-[0.5em]"
                />
                <p className="mt-2 text-xs text-muted-foreground">{t('enterOtp')} ({email})</p>
              </div>
              <Button onClick={verifyOtp} disabled={loading} size="lg" className="w-full">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('verifyOtp')}
              </Button>
              <Button variant="ghost" onClick={() => setStep('email')} className="w-full text-xs">
                Resend / Change email
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Auth;
