import { useLang } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

export const LanguageSwitch = () => {
  const { lang, setLang } = useLang();
  return (
    <div className="inline-flex items-center rounded-full border border-border bg-background p-1 text-xs font-medium">
      <Button
        size="sm"
        variant={lang === 'en' ? 'default' : 'ghost'}
        onClick={() => setLang('en')}
        className="h-7 rounded-full px-3"
      >
        EN
      </Button>
      <Button
        size="sm"
        variant={lang === 'ta' ? 'default' : 'ghost'}
        onClick={() => setLang('ta')}
        className="h-7 rounded-full px-3"
      >
        தமிழ்
      </Button>
    </div>
  );
};
