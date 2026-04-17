import { Sparkles } from 'lucide-react';

export const Logo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizeMap = {
    sm: { box: 'h-8 w-8', icon: 'h-4 w-4', text: 'text-base' },
    md: { box: 'h-10 w-10', icon: 'h-5 w-5', text: 'text-lg' },
    lg: { box: 'h-14 w-14', icon: 'h-7 w-7', text: 'text-2xl' },
  }[size];

  return (
    <div className="flex items-center gap-2">
      <div className={`${sizeMap.box} flex items-center justify-center rounded-xl gradient-hero shadow-glow`}>
        <Sparkles className={`${sizeMap.icon} text-white`} strokeWidth={2.5} />
      </div>
      <div className={`font-display font-bold ${sizeMap.text} tracking-tight text-primary`}>
        AKC<span className="text-accent">.</span>
      </div>
    </div>
  );
};
