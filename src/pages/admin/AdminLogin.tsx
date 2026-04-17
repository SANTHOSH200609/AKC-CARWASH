import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, ShieldCheck, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Logo } from '@/components/Logo';
import { toast } from 'sonner';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email || !password) return toast.error('Enter email and password');
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      return toast.error(error.message);
    }
    // Verify admin role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', data.user.id)
      .eq('role', 'admin')
      .maybeSingle();
    setLoading(false);
    if (!roleData) {
      await supabase.auth.signOut();
      return toast.error('This account is not an admin');
    }
    toast.success('Welcome admin');
    navigate('/admin', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-glow to-accent">
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center px-5 pt-6">
        <div className="flex w-full items-center justify-between">
          <Link to="/" className="flex items-center gap-1 text-sm text-primary-foreground/80 hover:text-primary-foreground">
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
        </div>

        <div className="mt-12 text-center text-primary-foreground">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold">Admin Login</h1>
          <p className="mt-1 text-sm opacity-80">AKC Car Wash management</p>
        </div>

        <Card className="mt-8 w-full p-6 shadow-elevated">
          <div className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@akc.in" />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button onClick={submit} disabled={loading} size="lg" className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign in
            </Button>
            <p className="text-center text-[11px] text-muted-foreground leading-relaxed">
              First time? Sign up at <Link to="/auth" className="underline">/auth</Link>, then ask the system owner to grant your account the <code className="rounded bg-secondary px-1">admin</code> role in the database.
            </p>
          </div>
        </Card>

        <div className="mt-6 flex items-center gap-2 opacity-80">
          <Logo size="sm" />
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
