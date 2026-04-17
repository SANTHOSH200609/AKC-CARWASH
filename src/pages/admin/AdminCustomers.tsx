import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useLang } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Phone, Mail } from 'lucide-react';

const AdminCustomers = () => {
  const { t } = useLang();
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).then(({ data }) => setCustomers(data || []));
  }, []);

  return (
    <AdminLayout>
      <div className="px-4 pt-4">
        <h1 className="font-display text-2xl font-bold">{t('customers')}</h1>
        <p className="text-xs text-muted-foreground">{customers.length} total</p>
      </div>
      <div className="space-y-2 px-4 pt-4">
        {customers.map((c) => (
          <Card key={c.id} className="flex items-center gap-3 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-hero font-bold text-primary-foreground">
              {(c.full_name || c.email || '?')[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{c.full_name || 'Unnamed'}</div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                {c.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</span>}
                {c.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</span>}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
};

export default AdminCustomers;
