import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';

export const AppLayout = ({ children, hideNav = false }: { children: ReactNode; hideNav?: boolean }) => {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="mx-auto max-w-md">{children}</div>
      {!hideNav && <BottomNav />}
    </div>
  );
};
