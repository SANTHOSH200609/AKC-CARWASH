import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User as UserIcon, Phone, Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppLayout } from '@/components/AppLayout';
import { Logo } from '@/components/Logo';
import { LanguageSwitch } from '@/components/LanguageSwitch';
import { useLang } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Profile = () => {
  const { t } = useLang();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('full_name,phone').eq('user_id', user.id).maybeSingle().then(({ data }) => {
      if (data) { setName(data.full_name || ''); setPhone(data.phone || ''); }
    });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ full_name: name, phone }).eq('user_id', user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success('Profile updated');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <AppLayout>
      <header className="flex items-center justify-between px-5 pt-5">
        <Logo size="sm" />
        <LanguageSwitch />
      </header>
      <div className="px-5 pt-5">
        <h1 className="font-display text-2xl font-bold">{t('profile')}</h1>
      </div>

      <div className="px-5 pt-5">
        <Card className="gradient-card border-0 p-5 text-primary-foreground shadow-elevated">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-2xl font-bold text-accent-foreground">
            {(name || user?.email || '?')[0].toUpperCase()}
          </div>
          <div className="mt-3 font-display text-lg font-semibold">{name || 'Customer'}</div>
          <div className="text-xs opacity-80">{user?.email}</div>
        </Card>

        <Card className="mt-4 space-y-3 p-5">
          <div>
            <Label>{t('fullName')}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>{t('phone')}</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <Button onClick={save} disabled={saving} className="w-full">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('saveChanges')}
          </Button>
        </Card>

        <Button onClick={handleSignOut} variant="outline" className="mt-4 w-full">
          <LogOut className="mr-2 h-4 w-4" /> {t('logout')}
        </Button>
      </div>
    </AppLayout>
  );
};

export default Profile;
