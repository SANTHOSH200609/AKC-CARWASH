import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useLang } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const AdminServices = () => {
  const { t } = useLang();
  const [services, setServices] = useState<any[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from('services').select('*').order('sort_order');
    setServices(data || []);
  };

  useEffect(() => { load(); }, []);

  const updateField = (id: string, field: string, value: any) => {
    setServices((prev) => prev.map((s) => s.id === id ? { ...s, [field]: value } : s));
  };

  const save = async (s: any) => {
    setSavingId(s.id);
    const { error } = await supabase.from('services').update({
      name_en: s.name_en, name_ta: s.name_ta,
      description_en: s.description_en, description_ta: s.description_ta,
      price: Number(s.price), duration_minutes: Number(s.duration_minutes),
      active: s.active,
    }).eq('id', s.id);
    setSavingId(null);
    if (error) return toast.error(error.message);
    toast.success('Saved');
  };

  return (
    <AdminLayout>
      <div className="px-4 pt-4">
        <h1 className="font-display text-2xl font-bold">{t('pricing')}</h1>
        <p className="text-xs text-muted-foreground">Manage services & prices</p>
      </div>
      <div className="space-y-3 px-4 pt-4">
        {services.map((s) => (
          <Card key={s.id} className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-muted-foreground">{s.slug}</span>
              <div className="flex items-center gap-2">
                <Label className="text-xs">Active</Label>
                <Switch checked={s.active} onCheckedChange={(v) => updateField(s.id, 'active', v)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Name (EN)</Label>
                <Input value={s.name_en} onChange={(e) => updateField(s.id, 'name_en', e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Name (TA)</Label>
                <Input value={s.name_ta} onChange={(e) => updateField(s.id, 'name_ta', e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">{t('price')} (₹)</Label>
                <Input type="number" value={s.price} onChange={(e) => updateField(s.id, 'price', e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">{t('duration_label')}</Label>
                <Input type="number" value={s.duration_minutes} onChange={(e) => updateField(s.id, 'duration_minutes', e.target.value)} />
              </div>
            </div>
            <Button size="sm" onClick={() => save(s)} disabled={savingId === s.id} className="w-full">
              {savingId === s.id && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
              {t('save')}
            </Button>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
};

export default AdminServices;
