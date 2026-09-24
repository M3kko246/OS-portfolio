import { useEffect, useRef } from 'react';
import { useOsIndex } from '@/os/context';
import { shellStore, useShell } from '@/os/kernel/shell';
import { useReducedMotion } from '@/os/lib/motion';
import { useT } from '@/os/lib/i18n';
import { BrandMark, cx } from '@/os/ui/primitives';

/** Opens and closes a native <dialog> as a blocking modal in sync with `open`. */
export function useModal(open: boolean, onClosed: () => void) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    dialog.addEventListener('close', onClosed);
    return () => {
      dialog.removeEventListener('close', onClosed);
    };
  }, [onClosed]);
  return ref;
}

const closeAbout = () => {
  shellStore.getState().setAboutOpen(false);
};

export function AboutDialog() {
  const t = useT();
  const { profile } = useOsIndex();
  const open = useShell((s) => s.aboutOpen);
  const ref = useModal(open, closeAbout);
  return (
    <dialog ref={ref} className="os-dialog px-shell" aria-labelledby="about-os-title">
      <p className="window-titlebar dialog-titlebar">
        <span id="about-os-title" className="window-title">
          {t('context.about', { os: profile.osName })}
        </span>
      </p>
      <div className="dialog-body">
        <BrandMark className="brand-mark-4" />
        <p className="text-read">{t('aboutOs.body', { os: profile.osName, name: profile.name })}</p>
      </div>
      <form method="dialog" className="dialog-actions">
        <button type="submit" className="px-btn px-btn-primary">
          {t('window.close')}
        </button>
      </form>
    </dialog>
  );
}

/** Stepped fade to ink, a message and a way back. The URL does not change. */
export function Shutdown() {
  const t = useT();
  const on = useShell((s) => s.shutdown);
  const reduced = useReducedMotion();
  const buttonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (on) buttonRef.current?.focus();
  }, [on]);

  if (!on) return null;
  return (
    <div className={cx('shutdown', 'theme-dark', !reduced && 'is-animated')} role="status">
      <p className="font-pixel text-ui-2">{t('shutdown.message')}</p>
      <button
        ref={buttonRef}
        type="button"
        className="px-btn px-btn-primary"
        onClick={() => {
          shellStore.getState().setShutdown(false);
          document.getElementById('start-button')?.focus();
        }}
      >
        {t('shutdown.restart')}
      </button>
    </div>
  );
}
