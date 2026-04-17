import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { IndianRupee, CalendarCheck, Users, Sparkles, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useLang } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

const AdminDashboard = () => {
  const { t } = useLang();
  const [stats, setStats] = useState({ today: 0, totalBookings: 0, customers: 0, services: 0 });
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    document.title = 'Admin Dashboard — AKC Car Wash';
    const load = async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const [{ data: todayB }, { count: totalB }, { count: cust }, { count: svc }, { data: rec }] = await Promise.all([
        supabase.from('bookings').select('price').eq('scheduled_date', today).eq('status', 'completed'),
        supabase.from('bookings').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('services').select('*', { count: 'exact', head: true }).eq('active', true),
        supabase.from('bookings').select('*').order('created_at', { ascending: false }).limit(5),
      ]);
      setStats({
        today: (todayB || []).reduce((s, b: any) => s + Number(b.price), 0),
        totalBookings: totalB || 0,
        customers: cust || 0,
        services: svc || 0,
      });
      setRecent(rec || []);
    };
    load();
  }, []);

  return (
    <AdminLayout>
      <div className="px-4 pt-4">
        <h1 className="font-display text-2xl font-bold">{t('dashboard')}</h1>
        <p className="text-xs text-muted-foreground">{format(new Date(), 'EEEE, MMM d, yyyy')}</p>
      </div>

      {/* Earnings hero */}
      <Card className="mx-4 mt-4 gradient-hero border-0 p-5 text-primary-foreground shadow-elevated">
        <div className="text-xs uppercase tracking-wider opacity-80">{t('todayEarnings')}</div>
        <div className="mt-1 flex items-center font-display text-4xl font-bold">
          <IndianRupee className="h-7 w-7" />{stats.today.toLocaleString('en-IN')}
        </div>
      </Card>

      {/* Stats grid */}
      <div className="mx-4 mt-4 grid grid-cols-3 gap-3">
        <Card className="p-3 text-center">
          <CalendarCheck className="mx-auto h-5 w-5 text-accent" />
          <div className="mt-1 text-lg font-bold">{stats.totalBookings}</div>
          <div className="text-[10px] text-muted-foreground">{t('totalBookings')}</div>
        </Card>
        <Card className="p-3 text-center">
          <Users className="mx-auto h-5 w-5 text-accent" />
          <div className="mt-1 text-lg font-bold">{stats.customers}</div>
          <div className="text-[10px] text-muted-foreground">{t('totalCustomers')}</div>
        </Card>
        <Card className="p-3 text-center">
          <Sparkles className="mx-auto h-5 w-5 text-accent" />
          <div className="mt-1 text-lg font-bold">{stats.services}</div>
          <div className="text-[10px] text-muted-foreground">{t('activeServices')}</div>
        </Card>
      </div>

      {/* Recent bookings */}
      <div className="mx-4 mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold">Recent bookings</h2>
          <Link to="/admin/bookings" className="text-xs font-medium text-accent flex items-center gap-1">
            All <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="space-y-2">
          {recent.map((b) => (
            <Card key={b.id} className="flex items-center justify-between p-3 text-sm">
              <div>
                <div className="font-semibold">{b.customer_name || 'Customer'}</div>
                <div className="text-xs text-muted-foreground">{b.service_name} · {b.scheduled_slot}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-accent">₹{b.price}</div>
                <div className="text-[10px] uppercase text-muted-foreground">{b.status}</div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
