import { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CalendarCheck, Users, Tag, LogOut } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useLang } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export const AdminLayout = ({ children }: { children: ReactNode }) => {
  const { t } = useLang();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const items = [
    { to: '/admin', icon: LayoutDashboard, label: t('dashboard'), end: true },
    { to: '/admin/bookings', icon: CalendarCheck, label: t('bookings') },
    { to: '/admin/services', icon: Tag, label: t('pricing') },
    { to: '/admin/customers', icon: Users, label: t('customers') },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-secondary/30 pb-20">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
          <Logo size="sm" />
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-md">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-lg">
        <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
          {items.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex min-w-[60px] flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors',
                  isActive ? 'text-accent' : 'text-muted-foreground'
                )
              }
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px]">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};
