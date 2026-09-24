import '../apps.css';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { MessageKey } from '@/i18n';
import type { AppProps } from '@/os/apps/manifest';
import { settingsStore, useSettings, type Settings as SettingsData } from '@/os/kernel/settings';
import { announce } from '@/os/lib/announce';
import { useT } from '@/os/lib/i18n';
import { useModal } from '@/os/shell/Dialogs';

type Choice<K extends keyof SettingsData> = [SettingsData[K], MessageKey];

function Radios<K extends keyof SettingsData>({
  setting,
  legend,
  choices,
  id,
}: {
  setting: K;
  legend: string;
  choices: Choice<K>[];
  id?: string;
}) {
  const value = useSettings((s) => s[setting]);
  const t = useT();
  const groupId = useId();
  return (
    <fieldset className="settings-group" id={id}>
      <legend className="font-bold">{legend}</legend>
      {choices.map(([choice, label]) => (
        <label key={String(choice)} className="choice">
          <input
            type="radio"
            name={groupId}
            checked={value === choice}
            onChange={() => {
              settingsStore.getState().set(setting, choice);
            }}
          />
          {t(label)}
        </label>
      ))}
    </fieldset>
  );
}

function Toggle({
  setting,
  label,
}: {
  setting: 'crt' | 'pixelCursor' | 'dithering';
  label: string;
}) {
  const value = useSettings((s) => s[setting]);
  return (
    <label className="choice">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => {
          settingsStore.getState().set(setting, e.target.checked);
        }}
      />
      {label}
    </label>
  );
}

export default function Settings({ params }: AppProps) {
  const t = useT();
  const [confirming, setConfirming] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const closeConfirm = useCallback(() => {
    setConfirming(false);
  }, []);
  const dialogRef = useModal(confirming, closeConfirm);

  // Opened from "Cambia sfondo": start at the wallpaper section.
  useEffect(() => {
    if (params.section !== 'wallpaper') return;
    rootRef.current?.querySelector<HTMLInputElement>('#settings-wallpaper input')?.focus();
  }, [params.section]);

  return (
    <div ref={rootRef} className="app-settings">
      <Radios
        setting="theme"
        legend={t('settings.theme')}
        choices={[
          ['auto', 'settings.theme.auto'],
          ['light', 'settings.theme.light'],
          ['dark', 'settings.theme.dark'],
        ]}
      />
      <Radios
        id="settings-wallpaper"
        setting="wallpaper"
        legend={t('settings.wallpaper')}
        choices={[
          ['solid-night', 'settings.wallpaper.solid-night'],
          ['solid-chalk', 'settings.wallpaper.solid-chalk'],
        ]}
      />
      <Radios
        setting="scale"
        legend={t('settings.scale')}
        choices={[
          ['auto', 'settings.scale.auto'],
          ['large', 'settings.scale.large'],
        ]}
      />
      <Radios
        setting="motion"
        legend={t('settings.motion')}
        choices={[
          ['auto', 'settings.motion.auto'],
          ['reduced', 'settings.motion.reduced'],
        ]}
      />
      <Radios
        setting="lang"
        legend={t('settings.language')}
        choices={[
          ['it', 'settings.lang.it'],
          ['en', 'settings.lang.en'],
        ]}
      />
      <Radios
        setting="quality"
        legend={t('settings.quality')}
        choices={[
          ['auto', 'settings.quality.auto'],
          ['high', 'settings.quality.high'],
          ['low', 'settings.quality.low'],
        ]}
      />
      <fieldset className="settings-group">
        <legend className="font-bold">{t('app.settings')}</legend>
        <Toggle setting="crt" label={t('settings.crt')} />
        <Toggle setting="pixelCursor" label={t('settings.cursor')} />
        <Toggle setting="dithering" label={t('settings.dithering')} />
      </fieldset>
      <p>
        <button
          type="button"
          className="px-btn"
          onClick={() => {
            setConfirming(true);
          }}
        >
          {t('settings.reset')}
        </button>
      </p>

      <dialog ref={dialogRef} className="os-dialog px-shell" aria-labelledby="reset-title">
        <p className="window-titlebar dialog-titlebar">
          <span id="reset-title" className="window-title">
            {t('settings.resetTitle')}
          </span>
        </p>
        <div className="dialog-body">
          <p className="text-read">{t('settings.resetBody')}</p>
        </div>
        <form method="dialog" className="dialog-actions">
          <button type="submit" className="px-btn">
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            className="px-btn px-btn-primary"
            onClick={() => {
              settingsStore.getState().reset();
              announce(t('settings.resetDone'));
            }}
          >
            {t('settings.resetConfirm')}
          </button>
        </form>
      </dialog>
    </div>
  );
}
