import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { z } from 'zod';
import { Mail, Loader2, ArrowLeft, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Logo } from '@/components/Logo';
import { LanguageSwitch } from '@/components/LanguageSwitch';
import { useLang } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

const emailSchema = z.string().trim().email().max(255);
const otpSchema = z.string().regex(/^\d{6}$/);
const phoneSchema = z.string().trim().regex(/^\+?\d{8,15}$/, 'Enter a valid phone (+91...)');

type Method = 'email' | 'phone';
type Step = 'enter' | 'otp';

const Auth = () => {
  const { t } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as any)?.redirectTo || '/';

  const [method, setMethod] = useState<Method>('email');
  const [step, setStep] = useState<Step>('enter');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const sendEmailOtp = async () => {
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

  const verifyEmailOtp = async () => {
    const v = otpSchema.safeParse(otp);
    if (!v.success) return toast.error('Enter the 6-digit code');
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(t('welcome') + '!');
    navigate(redirectTo, { replace: true });
  };

  const sendSmsOtp = async () => {
    const v = phoneSchema.safeParse(phone);
    if (!v.success) return toast.error(v.error.errors[0].message);
    if (!fullName.trim()) return toast.error('Enter your full name');
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('send-sms-otp', {
      body: { phone, fullName },
    });
    setLoading(false);
    if (error || data?.error) return toast.error(data?.error || error!.message);
    toast.success('Code sent via SMS');
    setStep('otp');
  };

  const verifySmsOtp = async () => {
    const v = otpSchema.safeParse(otp);
    if (!v.success) return toast.error('Enter the 6-digit code');
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('verify-sms-otp', {
      body: { phone, code: otp },
    });
    if (error || data?.error || !data?.email) {
      setLoading(false);
      return toast.error(data?.error || error?.message || 'Verification failed');
    }
    // Sign in with the temp creds returned by the edge function
    const { error: signErr } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    setLoading(false);
    if (signErr) return toast.error(signErr.message);
    toast.success(t('welcome') + '!');
    navigate(redirectTo, { replace: true });
  };

  const handleSend = () => (method === 'email' ? sendEmailOtp() : sendSmsOtp());
  const handleVerify = () => (method === 'email' ? verifyEmailOtp() : verifySmsOtp());

  const switchMethod = (m: string) => {
    setMethod(m as Method);
    setStep('enter');
    setOtp('');
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
          <Tabs value={method} onValueChange={switchMethod} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email"><Mail className="mr-2 h-4 w-4" />Email</TabsTrigger>
              <TabsTrigger value="phone"><Phone className="mr-2 h-4 w-4" />Phone</TabsTrigger>
            </TabsList>

            {/* EMAIL TAB */}
            <TabsContent value="email" className="mt-4">
              {step === 'enter' ? (
                <div className="space-y-4 animate-fade-up">
                  <div>
                    <Label htmlFor="name-e">{t('fullName')}</Label>
                    <Input id="name-e" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
                  </div>
                  <div>
                    <Label htmlFor="email">{t('email')}</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                  </div>
                  <Button onClick={handleSend} disabled={loading} size="lg" className="w-full">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                    {t('sendOtp')}
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    We'll email you a 6-digit code
                  </p>
                </div>
              ) : (
                <OtpStep
                  otp={otp} setOtp={setOtp} loading={loading}
                  onVerify={handleVerify} onBack={() => setStep('enter')}
                  destination={email} t={t}
                />
              )}
            </TabsContent>

            {/* PHONE TAB */}
            <TabsContent value="phone" className="mt-4">
              {step === 'enter' ? (
                <div className="space-y-4 animate-fade-up">
                  <div>
                    <Label htmlFor="name-p">{t('fullName')}</Label>
                    <Input id="name-p" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
                  </div>
                  <div>
                    <Label htmlFor="phone">{t('phone')}</Label>
                    <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 9876543210" />
                  </div>
                  <Button onClick={handleSend} disabled={loading} size="lg" className="w-full">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Phone className="mr-2 h-4 w-4" />}
                    {t('sendOtp')}
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    We'll text you a 6-digit code
                  </p>
                </div>
              ) : (
                <OtpStep
                  otp={otp} setOtp={setOtp} loading={loading}
                  onVerify={handleVerify} onBack={() => setStep('enter')}
                  destination={phone} t={t}
                />
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

const OtpStep = ({
  otp, setOtp, loading, onVerify, onBack, destination, t,
}: {
  otp: string; setOtp: (v: string) => void; loading: boolean;
  onVerify: () => void; onBack: () => void; destination: string; t: (k: any) => string;
}) => (
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
      <p className="mt-2 text-xs text-muted-foreground">Sent to {destination}</p>
    </div>
    <Button onClick={onVerify} disabled={loading} size="lg" className="w-full">
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {t('verifyOtp')}
    </Button>
    <Button variant="ghost" onClick={onBack} className="w-full text-xs">
      Resend / Change
    </Button>
  </div>
);

export default Auth;
