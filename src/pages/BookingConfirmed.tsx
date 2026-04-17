import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, Calendar, Clock, MapPin, IndianRupee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AppLayout } from '@/components/AppLayout';
import { useLang } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

const BookingConfirmed = () => {
  const { id } = useParams();
  const { t } = useLang();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    supabase.from('bookings').select('*').eq('id', id).maybeSingle().then(({ data }) => setBooking(data));
  }, [id]);

  if (!booking) return null;

  return (
    <AppLayout hideNav>
      <div className="flex min-h-screen flex-col items-center px-5 pt-12 text-center">
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-success/20" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
            <CheckCircle2 className="h-12 w-12 text-success" strokeWidth={2} />
          </div>
        </div>
        <h1 className="mt-6 font-display text-2xl font-bold">{t('bookingConfirmed')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('bookingId')}: <span className="font-mono text-foreground">#{booking.id.slice(0, 8).toUpperCase()}</span>
        </p>

        <Card className="mt-6 w-full p-5 text-left shadow-card">
          <div className="font-display text-lg font-bold text-primary">{booking.service_name}</div>
          <div className="mt-3 space-y-2.5 text-sm">
            <div className="flex items-center gap-2.5"><Calendar className="h-4 w-4 text-accent" />{format(new Date(booking.scheduled_date), 'EEE, MMM d, yyyy')}</div>
            <div className="flex items-center gap-2.5"><Clock className="h-4 w-4 text-accent" />{booking.scheduled_slot}</div>
            <div className="flex items-start gap-2.5"><MapPin className="mt-0.5 h-4 w-4 text-accent" /><span className="flex-1">{booking.address}</span></div>
            <div className="flex items-center gap-2.5"><IndianRupee className="h-4 w-4 text-accent" /><span className="font-semibold">{booking.price} ({booking.payment_method.toUpperCase()})</span></div>
          </div>
        </Card>

        <p className="mt-4 text-xs text-muted-foreground">
          You'll get a notification once admin accepts your booking.
        </p>

        <div className="mt-6 flex w-full flex-col gap-2">
          <Button onClick={() => navigate('/bookings')} size="lg" className="w-full">
            {t('myBookings')}
          </Button>
          <Button onClick={() => navigate('/')} variant="ghost" className="w-full">
            {t('home')}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default BookingConfirmed;
