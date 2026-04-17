import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useLang } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Calendar, Clock, MapPin, Phone, Car } from 'lucide-react';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-warning/10 text-warning border-warning/30',
  accepted: 'bg-accent/10 text-accent border-accent/30',
  in_progress: 'bg-primary/10 text-primary border-primary/30',
  completed: 'bg-success/10 text-success border-success/30',
  rejected: 'bg-destructive/10 text-destructive border-destructive/30',
  cancelled: 'bg-muted text-muted-foreground border-border',
};

const AdminBookings = () => {
  const { t } = useLang();
  const [filter, setFilter] = useState<string>('all');
  const [bookings, setBookings] = useState<any[]>([]);

  const load = async () => {
    let q = supabase.from('bookings').select('*').order('created_at', { ascending: false });
    if (filter !== 'all') q = q.eq('status', filter as any);
    const { data } = await q;
    setBookings(data || []);
  };

  useEffect(() => {
    load();
    const channel = supabase.channel('admin-bookings').on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, load).subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const updateStatus = async (b: any, status: string, title: string, message: string) => {
    const { error } = await supabase.from('bookings').update({ status: status as any }).eq('id', b.id);
    if (error) return toast.error(error.message);
    await supabase.from('notifications').insert({ user_id: b.user_id, title, message, booking_id: b.id });
    toast.success(`Marked ${status}`);
  };

  return (
    <AdminLayout>
      <div className="px-4 pt-4">
        <h1 className="font-display text-2xl font-bold">{t('bookings')}</h1>
      </div>

      <Tabs value={filter} onValueChange={setFilter} className="px-4 pt-3">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
          <TabsTrigger value="pending" className="text-xs">{t('pending')}</TabsTrigger>
          <TabsTrigger value="in_progress" className="text-xs">In Prog</TabsTrigger>
          <TabsTrigger value="completed" className="text-xs">Done</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-3 px-4 pt-4">
        {bookings.map((b) => (
          <Card key={b.id} className="p-4 shadow-card">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-display text-base font-semibold">{b.customer_name || 'Customer'}</div>
                <div className="text-xs text-muted-foreground">{b.service_name}</div>
              </div>
              <Badge variant="outline" className={STATUS_STYLES[b.status]}>{t(b.status as any)}</Badge>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-1.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5"><Calendar className="h-3 w-3" />{format(new Date(b.scheduled_date), 'MMM d')}</div>
              <div className="flex items-center gap-1.5"><Clock className="h-3 w-3" />{b.scheduled_slot}</div>
              <div className="flex items-center gap-1.5"><Phone className="h-3 w-3" />{b.customer_phone}</div>
              <div className="flex items-center gap-1.5 truncate"><Car className="h-3 w-3" />{b.vehicle_info}</div>
              {b.address && <div className="col-span-2 flex items-start gap-1.5"><MapPin className="mt-0.5 h-3 w-3 shrink-0" />{b.address}</div>}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <span className="font-bold text-accent">₹{b.price} · {b.payment_method.toUpperCase()}</span>
            </div>

            {/* Actions */}
            <div className="mt-3 flex flex-wrap gap-2">
              {b.status === 'pending' && (
                <>
                  <Button size="sm" onClick={() => updateStatus(b, 'accepted', 'Booking accepted', `Your ${b.service_name} on ${b.scheduled_date} ${b.scheduled_slot} is confirmed.`)}>{t('accept')}</Button>
                  <Button size="sm" variant="destructive" onClick={() => updateStatus(b, 'rejected', 'Booking rejected', `Sorry, your ${b.service_name} booking could not be accepted.`)}>{t('reject')}</Button>
                </>
              )}
              {b.status === 'accepted' && (
                <Button size="sm" onClick={() => updateStatus(b, 'in_progress', 'Service started', `${b.service_name} is now in progress.`)}>{t('start')}</Button>
              )}
              {b.status === 'in_progress' && (
                <Button size="sm" variant="default" onClick={() => updateStatus(b, 'completed', 'Service completed', `Thank you! Your ${b.service_name} is complete. ₹${b.price}`)}>{t('markComplete')}</Button>
              )}
            </div>
          </Card>
        ))}
        {bookings.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No bookings</p>}
      </div>
    </AdminLayout>
  );
};

export default AdminBookings;
