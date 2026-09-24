import { useT } from '@/os/lib/i18n';

/** Temporary body for apps that arrive in later stages (listed in the stage reports). */
export default function ComingSoon() {
  const t = useT();
  return (
    <div className="app-soon">
      <p className="text-read">{t('soon.message')}</p>
      <p>
        <a className="px-btn" href="/classica">
          {t('nav.classic')}
        </a>
      </p>
    </div>
  );
}
