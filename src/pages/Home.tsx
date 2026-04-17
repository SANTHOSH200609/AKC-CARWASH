import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Sparkles, MapPin, Clock, ShieldCheck, ChevronRight, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AppLayout } from '@/components/AppLayout';
import { Logo } from '@/components/Logo';
import { LanguageSwitch } from '@/components/LanguageSwitch';
import { useLang } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import heroImage from '@/assets/hero-carwash.jpg';

interface Service {
  id: string;
  slug: string;
  name_en: string;
  name_ta: string;
  description_en: string | null;
  description_ta: string | null;
  price: number;
  duration_minutes: number;
}

const Home = () => {
  const { t, lang } = useLang();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    document.title = `${t('appName')} — ${t('tagline')}`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', `${t('appName')}. ${t('tagline')}. Book online — basic, foam, interior, full.`);
    supabase.from('services').select('*').eq('active', true).order('sort_order').then(({ data }) => {
      if (data) setServices(data as Service[]);
    });
  }, [t]);

  const handleBook = (slug: string) => {
    if (!user) navigate('/auth', { state: { redirectTo: `/book/${slug}` } });
    else navigate(`/book/${slug}`);
  };

  return (
    <AppLayout>
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-5">
        <Logo size="md" />
        <div className="flex items-center gap-2">
          <LanguageSwitch />
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-5 mt-5 overflow-hidden rounded-3xl shadow-elevated">
        <img
          src={heroImage}
          alt="Premium car wash in Madurai"
          width={1280}
          height={896}
          className="h-64 w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 text-primary-foreground">
          <h1 className="font-display text-3xl font-bold leading-tight">
            {lang === 'en' ? (
              <>Shine like<br/><span className="text-accent">brand new</span></>
            ) : (
              <>புதிது போல<br/><span className="text-accent">பளபளப்பு</span></>
            )}
          </h1>
          <div className="mt-2 flex items-center gap-1.5 text-sm opacity-90">
            <MapPin className="h-3.5 w-3.5" /> {t('location')}
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <div className="mx-5 mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-card p-3 shadow-card">
          <Clock className="mx-auto h-4 w-4 text-accent" />
          <div className="mt-1 text-[10px] font-medium text-muted-foreground">20-75 min</div>
        </div>
        <div className="rounded-2xl bg-card p-3 shadow-card">
          <ShieldCheck className="mx-auto h-4 w-4 text-accent" />
          <div className="mt-1 text-[10px] font-medium text-muted-foreground">Trusted</div>
        </div>
        <div className="rounded-2xl bg-card p-3 shadow-card">
          <Sparkles className="mx-auto h-4 w-4 text-accent" />
          <div className="mt-1 text-[10px] font-medium text-muted-foreground">Premium</div>
        </div>
      </div>

      {/* Services */}
      <section className="mt-6 px-5">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-display text-xl font-bold">{t('chooseService')}</h2>
        </div>
        <div className="space-y-3">
          {services.map((s) => (
            <Card
              key={s.id}
              onClick={() => handleBook(s.slug)}
              className="cursor-pointer overflow-hidden border-border p-4 transition-all hover:-translate-y-0.5 hover:shadow-elevated active:scale-[0.99]"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl gradient-hero text-2xl">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-base font-semibold">{lang === 'en' ? s.name_en : s.name_ta}</div>
                  <div className="line-clamp-1 text-xs text-muted-foreground">
                    {lang === 'en' ? s.description_en : s.description_ta}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs">
                    <span className="font-semibold text-accent">₹{s.price}</span>
                    <span className="text-muted-foreground">{s.duration_minutes} {t('minutes')}</span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Location */}
      <section className="mt-6 px-5">
        <h2 className="mb-3 font-display text-xl font-bold">{t('ourLocation')}</h2>
        <Card className="overflow-hidden">
          <iframe
            title="AKC Car Wash Madurai"
            src="https://www.google.com/maps?q=Madurai,Tamil+Nadu&output=embed"
            className="h-44 w-full"
            loading="lazy"
          />
          <div className="flex items-center justify-between p-3">
            <div className="text-sm font-medium">AKC Car Wash, Madurai</div>
            <a
              href="https://www.google.com/maps/dir/?api=1&destination=AKC+Car+Wash+Madurai"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-accent"
            >
              Directions →
            </a>
          </div>
        </Card>
      </section>

      {/* Admin & login */}
      <div className="mt-6 px-5">
        {!user ? (
          <div className="flex flex-col gap-2">
            <Button onClick={() => navigate('/auth')} variant="default" size="lg" className="w-full">
              <LogIn className="mr-2 h-4 w-4" /> {t('continueAsCustomer')}
            </Button>
            <Link to="/admin/login" className="text-center text-xs text-muted-foreground hover:text-foreground">
              {t('adminLogin')}
            </Link>
          </div>
        ) : isAdmin ? (
          <Button onClick={() => navigate('/admin')} variant="outline" size="lg" className="w-full">
            {t('dashboard')} →
          </Button>
        ) : null}
      </div>
    </AppLayout>
  );
};

export default Home;
