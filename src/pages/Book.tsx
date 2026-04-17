import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { format, addDays } from 'date-fns';
import { ArrowLeft, Loader2, Calendar as CalendarIcon, IndianRupee, Clock } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AppLayout } from '@/components/AppLayout';
import { LanguageSwitch } from '@/components/LanguageSwitch';
import { useLang } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const SLOTS = ['08:00', '09:30', '11:00', '12:30', '14:00', '15:30', '17:00', '18:30'];

const bookingSchema = z.object({
  vehicle_info: z.string().trim().min(2).max(80),
  address: z.string().trim().min(3).max(200),
  customer_name: z.string().trim().min(2).max(80),
  customer_phone: z.string().trim().min(7).max(20),
});

interface Service {
  id: string;
  slug: string;
  name_en: string;
  name_ta: string;
  price: number;
  duration_minutes: number;
}

const Book = () => {
  const { slug } = useParams();
  const { t, lang } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [service, setService] = useState<Service | null>(null);
  const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [slot, setSlot] = useState<string>(SLOTS[0]);
  const [vehicle, setVehicle] = useState('');
  const [address, setAddress] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [payment, setPayment] = useState<'cod' | 'online'>('cod');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!slug) return;
    supabase.from('services').select('*').eq('slug', slug).maybeSingle().then(({ data }) => {
      if (data) setService(data as Service);
    });
    if (user) {
      supabase.from('profiles').select('full_name,phone').eq('user_id', user.id).maybeSingle().then(({ data }) => {
        if (data) {
          setName(data.full_name || '');
          setPhone(data.phone || '');
        }
      });
    }
  }, [slug, user]);

  const next7Days = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

  const submit = async () => {
    if (!user || !service) return;
    const parsed = bookingSchema.safeParse({ vehicle_info: vehicle, address, customer_name: name, customer_phone: phone });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    setLoading(true);
    const { data, error } = await supabase.from('bookings').insert({
      user_id: user.id,
      service_id: service.id,
      service_name: lang === 'en' ? service.name_en : service.name_ta,
      price: service.price,
      scheduled_date: date,
      scheduled_slot: slot,
      vehicle_info: vehicle,
      address,
      customer_name: name,
      customer_phone: phone,
      payment_method: payment,
    }).select('id').single();
    setLoading(false);

    if (error) return toast.error(error.message);
    await supabase.from('notifications').insert({
      user_id: user.id,
      title: 'Booking received',
      message: `Your ${service.name_en} on ${date} at ${slot} is pending confirmation.`,
      booking_id: data.id,
    });
    navigate(`/booking/${data.id}/confirmed`);
  };

  if (!service) {
    return (
      <AppLayout hideNav>
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout hideNav>
      <header className="flex items-center justify-between px-5 pt-5">
        <Link to="/" className="flex items-center gap-1 text-sm font-medium">
          <ArrowLeft className="h-4 w-4" /> {t('home')}
        </Link>
        <LanguageSwitch />
      </header>

      <div className="px-5 pt-4 pb-8">
        {/* Service summary */}
        <Card className="gradient-card border-0 p-5 text-primary-foreground shadow-elevated">
          <div className="text-xs opacity-80">{t('chooseService')}</div>
          <h1 className="mt-1 font-display text-2xl font-bold">{lang === 'en' ? service.name_en : service.name_ta}</h1>
          <div className="mt-3 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5"><IndianRupee className="h-4 w-4 text-accent" /><span className="font-bold">{service.price}</span></div>
            <div className="flex items-center gap-1.5 opacity-80"><Clock className="h-4 w-4" /><span>{service.duration_minutes} {t('minutes')}</span></div>
          </div>
        </Card>

        {/* Date */}
        <h3 className="mt-6 mb-2 font-display text-base font-semibold flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-accent" /> {t('selectDate')}
        </h3>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5">
          {next7Days.map((d) => {
            const ds = format(d, 'yyyy-MM-dd');
            const active = ds === date;
            return (
              <button
                key={ds}
                onClick={() => setDate(ds)}
                className={cn(
                  'flex min-w-[64px] flex-col items-center rounded-2xl border-2 px-3 py-2 text-xs font-medium transition-all',
                  active ? 'border-accent bg-accent/10 text-foreground' : 'border-border bg-card text-muted-foreground'
                )}
              >
                <span className="text-[10px] uppercase">{format(d, 'EEE')}</span>
                <span className="text-lg font-bold text-foreground">{format(d, 'd')}</span>
                <span className="text-[10px]">{format(d, 'MMM')}</span>
              </button>
            );
          })}
        </div>

        {/* Slot */}
        <h3 className="mt-5 mb-2 font-display text-base font-semibold">{t('selectTime')}</h3>
        <div className="grid grid-cols-4 gap-2">
          {SLOTS.map((s) => (
            <button
              key={s}
              onClick={() => setSlot(s)}
              className={cn(
                'rounded-xl border-2 py-2 text-xs font-semibold transition-all',
                slot === s ? 'border-accent bg-accent text-accent-foreground' : 'border-border bg-card text-muted-foreground'
              )}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Details */}
        <div className="mt-5 space-y-3">
          <div>
            <Label>{t('fullName')}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>{t('phone')}</Label>
            <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 9876543210" />
          </div>
          <div>
            <Label>{t('vehicleInfo')}</Label>
            <Input value={vehicle} onChange={(e) => setVehicle(e.target.value)} placeholder="Maruti Swift — TN59 AB 1234" />
          </div>
          <div>
            <Label>{t('address')}</Label>
            <Textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} placeholder="Door no, Street, Madurai" />
          </div>
        </div>

        {/* Payment */}
        <h3 className="mt-5 mb-2 font-display text-base font-semibold">{t('paymentMethod')}</h3>
        <RadioGroup value={payment} onValueChange={(v) => setPayment(v as any)} className="space-y-2">
          <label className={cn('flex items-center justify-between rounded-2xl border-2 p-3 cursor-pointer', payment === 'cod' ? 'border-accent bg-accent/5' : 'border-border')}>
            <div className="text-sm font-medium">{t('cod')}</div>
            <RadioGroupItem value="cod" />
          </label>
          <label className={cn('flex items-center justify-between rounded-2xl border-2 p-3 cursor-pointer opacity-70', payment === 'online' ? 'border-accent bg-accent/5' : 'border-border')}>
            <div>
              <div className="text-sm font-medium">{t('online')}</div>
              <div className="text-[10px] text-muted-foreground">Coming soon</div>
            </div>
            <RadioGroupItem value="online" disabled />
          </label>
        </RadioGroup>

        {/* Total + CTA */}
        <Card className="mt-5 flex items-center justify-between border-0 bg-secondary p-4">
          <span className="text-sm font-medium text-muted-foreground">{t('total')}</span>
          <span className="font-display text-2xl font-bold text-accent">₹{service.price}</span>
        </Card>

        <Button onClick={submit} disabled={loading} size="lg" className="mt-4 w-full">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('confirmBooking')}
        </Button>
      </div>
    </AppLayout>
  );
};

export default Book;
