import { useEffect, useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { AppLayout } from '@/components/AppLayout';
import { Logo } from '@/components/Logo';
import { LanguageSwitch } from '@/components/LanguageSwitch';
import { useLang } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

const Notifications = () => {
  const { t } = useLang();
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      setItems(data || []);
      // mark all as read
      await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
    };
    load();
    const channel = supabase
      .channel('notif')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return (
    <AppLayout>
      <header className="flex items-center justify-between px-5 pt-5">
        <Logo size="sm" />
        <LanguageSwitch />
      </header>
      <div className="px-5 pt-5">
        <h1 className="font-display text-2xl font-bold">{t('notifications')}</h1>
      </div>
      <div className="space-y-2 px-5 pt-4">
        {items.length === 0 ? (
          <Card className="p-8 text-center">
            <Bell className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">{t('noNotifications')}</p>
          </Card>
        ) : (
          items.map((n) => (
            <Card key={n.id} className="flex items-start gap-3 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10">
                <Check className="h-4 w-4 text-accent" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold">{n.title}</div>
                <div className="text-xs text-muted-foreground">{n.message}</div>
                <div className="mt-1 text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</div>
              </div>
            </Card>
          ))
        )}
      </div>
    </AppLayout>
  );
};

export default Notifications;
