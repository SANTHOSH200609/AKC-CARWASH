import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, Sparkles, IndianRupee } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/AppLayout';
import { Logo } from '@/components/Logo';
import { LanguageSwitch } from '@/components/LanguageSwitch';
import { useLang } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-warning/10 text-warning border-warning/30',
  accepted: 'bg-accent/10 text-accent border-accent/30',
  in_progress: 'bg-primary/10 text-primary border-primary/30',
  completed: 'bg-success/10 text-success border-success/30',
  rejected: 'bg-destructive/10 text-destructive border-destructive/30',
  cancelled: 'bg-muted text-muted-foreground border-border',
};

const Bookings = () => {
  const { t } = useLang();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = `${t('myBookings')} — AKC Car Wash`;
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setBookings(data || []);
      setLoading(false);
    };
    load();
    const channel = supabase
      .channel('bookings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, t]);

  return (
    <AppLayout>
      <header className="flex items-center justify-between px-5 pt-5">
        <Logo size="sm" />
        <LanguageSwitch />
      </header>

      <div className="px-5 pt-5">
        <h1 className="font-display text-2xl font-bold">{t('myBookings')}</h1>
      </div>

      <div className="space-y-3 px-5 pt-4">
        {loading ? null : bookings.length === 0 ? (
          <Card className="p-8 text-center">
            <Sparkles className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 font-medium">{t('noBookings')}</p>
            <p className="text-xs text-muted-foreground">{t('bookFirst')}</p>
            <Button asChild className="mt-4"><Link to="/">{t('bookNow')}</Link></Button>
          </Card>
        ) : (
          bookings.map((b) => (
            <Card key={b.id} className="p-4 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-display text-base font-semibold">{b.service_name}</div>
                  <div className="text-xs text-muted-foreground">#{b.id.slice(0, 8).toUpperCase()}</div>
                </div>
                <Badge variant="outline" className={STATUS_STYLES[b.status]}>{t(b.status as any)}</Badge>
              </div>
              <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" />{format(new Date(b.scheduled_date), 'MMM d, yyyy')}</div>
                <div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" />{b.scheduled_slot}</div>
                {b.address && <div className="flex items-start gap-2"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />{b.address}</div>}
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                <span className="text-xs text-muted-foreground uppercase">{b.payment_method}</span>
                <span className="flex items-center font-display font-bold text-accent"><IndianRupee className="h-4 w-4" />{b.price}</span>
              </div>
            </Card>
          ))
        )}
      </div>
    </AppLayout>
  );
};

export default Bookings;
