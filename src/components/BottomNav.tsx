import { Home, CalendarCheck, User, Bell } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useLang } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export const BottomNav = () => {
  const { t } = useLang();
  const items = [
    { to: '/', icon: Home, label: t('home') },
    { to: '/bookings', icon: CalendarCheck, label: t('myBookings') },
    { to: '/notifications', icon: Bell, label: t('notifications') },
    { to: '/profile', icon: User, label: t('profile') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-lg pb-safe">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
        {items.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex min-w-[60px] flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors',
                isActive ? 'text-accent' : 'text-muted-foreground hover:text-foreground'
              )
            }
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px]">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
