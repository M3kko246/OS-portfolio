import '../apps.css';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { MessageKey } from '@/i18n';
import type { AppProps } from '@/os/apps/manifest';
import {
  ACHIEVEMENTS,
  rewardKey,
  unlockedBy,
  type AchievementId,
  type Reward,
} from '@/os/kernel/achievements';
import { useSession } from '@/os/kernel/session';
import { settingsStore, useSettings, type Settings as SettingsData } from '@/os/kernel/settings';
import { announce } from '@/os/lib/announce';
import { useT } from '@/os/lib/i18n';
import { playSound } from '@/os/lib/sound';
import { useModal } from '@/os/shell/Dialogs';

type Choice<K extends keyof SettingsData> = [SettingsData[K], MessageKey];

function Radios<K extends keyof SettingsData>({
  setting,
  legend,
  choices,
  id,
  cosmetic,
}: {
  setting: K;
  legend: string;
  choices: Choice<K>[];
  id?: string;
  /** Choices that an achievement unlocks stay disabled until then. */
  cosmetic?: Reward['kind'];
}) {
  const value = useSettings((s) => s[setting]);
  const unlocked = useSession((s) => s.achievements);
  const t = useT();
  const groupId = useId();
  return (
    <fieldset className="settings-group" id={id}>
      <legend className="font-bold">{legend}</legend>
      {choices.map(([choice, label]) => {
        const lock = cosmetic ? unlockedBy(cosmetic, String(choice)) : undefined;
        const locked = lock !== undefined && !unlocked.includes(lock);
        return (
          <label key={String(choice)} className="choice">
            <input
              type="radio"
              name={groupId}
              checked={value === choice}
              disabled={locked}
              onChange={() => {
                settingsStore.getState().set(setting, choice);
              }}
            />
            {t(label)}
            {locked && (
              <span className="choice-hint">
                {t('settings.lockedBy', { name: t(`achievement.${lock}.name`) })}
              </span>
            )}
          </label>
        );
      })}
    </fieldset>
  );
}

function Toggle({
  setting,
  label,
}: {
  setting: 'crt' | 'pixelCursor' | 'dithering' | 'sound';
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
          if (setting === 'sound' && e.target.checked) playSound('click');
        }}
      />
      {label}
    </label>
  );
}

function Achievements() {
  const t = useT();
  const unlocked = useSession((s) => s.achievements);
  return (
    <section className="settings-group" aria-labelledby="settings-achievements">
      <h2 id="settings-achievements" className="settings-heading font-bold">
        {t('settings.achievements', { n: unlocked.length, total: ACHIEVEMENTS.length })}
      </h2>
      <ul className="achievements">
        {ACHIEVEMENTS.map(({ id, reward }) => (
          <AchievementRow key={id} id={id} reward={reward} done={unlocked.includes(id)} />
        ))}
      </ul>
    </section>
  );
}

function AchievementRow({
  id,
  reward,
  done,
}: {
  id: AchievementId;
  reward: Reward;
  done: boolean;
}) {
  const t = useT();
  return (
    <li className={done ? 'achievement is-done' : 'achievement'}>
      <p>
        <strong>{t(`achievement.${id}.name`)}</strong>{' '}
        <span className="choice-hint">
          {done ? t('settings.achievementDone') : t('settings.achievementTodo')}
        </span>
      </p>
      <p>{t(`achievement.${id}.description`)}</p>
      <p className="choice-hint">
        {t('settings.achievementReward', { reward: t(rewardKey(reward)) })}
      </p>
    </li>
  );
}

export default function Settings({ params }: AppProps) {
  const t = useT();
  const volume = useSettings((s) => s.volume);
  const sound = useSettings((s) => s.sound);
  const volumeId = useId();
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
        cosmetic="wallpaper"
        choices={[
          ['auto', 'settings.wallpaper.auto'],
          ['dawn', 'settings.wallpaper.dawn'],
          ['day', 'settings.wallpaper.day'],
          ['dusk', 'settings.wallpaper.dusk'],
          ['night', 'settings.wallpaper.night'],
          ['solid-night', 'settings.wallpaper.solid-night'],
          ['solid-chalk', 'settings.wallpaper.solid-chalk'],
          ['drafts', 'settings.wallpaper.drafts'],
        ]}
      />
      <fieldset className="settings-group">
        <legend className="font-bold">{t('settings.sound')}</legend>
        <Toggle setting="sound" label={t('settings.soundOn')} />
        <label className="choice" htmlFor={volumeId}>
          {t('settings.volume')}
        </label>
        <input
          id={volumeId}
          type="range"
          className="settings-range"
          min={0}
          max={1}
          step={0.1}
          value={volume}
          disabled={!sound}
          aria-valuetext={`${String(Math.round(volume * 100))}%`}
          onChange={(e) => {
            settingsStore.getState().set('volume', Number(e.target.value));
          }}
          onPointerUp={() => {
            playSound('click');
          }}
        />
      </fieldset>
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
        setting="mode"
        legend={t('settings.mode')}
        choices={[
          ['auto', 'settings.mode.auto'],
          ['desktop', 'settings.mode.desktop'],
          ['handheld', 'settings.mode.handheld'],
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
        <legend className="font-bold">{t('settings.effects')}</legend>
        <Toggle setting="crt" label={t('settings.crt')} />
        <Toggle setting="pixelCursor" label={t('settings.cursor')} />
        <Toggle setting="dithering" label={t('settings.dithering')} />
      </fieldset>
      <Radios
        setting="hat"
        legend={t('settings.hat')}
        cosmetic="hat"
        choices={[
          ['none', 'settings.hat.none'],
          ['captain', 'settings.hat.captain'],
          ['nightcap', 'settings.hat.nightcap'],
        ]}
      />
      <Radios
        setting="terminalTheme"
        legend={t('settings.terminalTheme')}
        cosmetic="terminalTheme"
        choices={[
          ['classic', 'settings.terminalTheme.classic'],
          ['amber', 'settings.terminalTheme.amber'],
          ['paper', 'settings.terminalTheme.paper'],
        ]}
      />
      <Achievements />
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
