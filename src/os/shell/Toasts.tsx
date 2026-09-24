import { Trophy } from 'pixelarticons/react/Trophy';
import { useEffect, useRef, useState } from 'react';
import {
  ACHIEVEMENTS,
  rewardKey,
  toastStore,
  useToasts,
  type AchievementId,
} from '@/os/kernel/achievements';
import { useT } from '@/os/lib/i18n';
import { useReducedMotion } from '@/os/lib/motion';
import { cx, Glyph } from '@/os/ui/primitives';

const VISIBLE_MS = 4000;

function Toast({ id }: { id: AchievementId }) {
  const t = useT();
  const reduced = useReducedMotion();
  const [leaving, setLeaving] = useState(false);
  const timerRef = useRef(0);
  const reward = ACHIEVEMENTS.find((a) => a.id === id)?.reward;

  const done = () => {
    toastStore.getState().shift();
  };
  const leave = () => {
    if (reduced) done();
    else setLeaving(true);
  };
  const start = () => {
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(leave, VISIBLE_MS);
  };
  const hold = () => {
    window.clearTimeout(timerRef.current);
  };

  useEffect(() => {
    timerRef.current = window.setTimeout(() => {
      if (reduced) toastStore.getState().shift();
      else setLeaving(true);
    }, VISIBLE_MS);
    return () => {
      window.clearTimeout(timerRef.current);
    };
  }, [reduced]);

  return (
    // Hovering keeps the notice on screen: it only leaves when nobody is reading it.
    <div
      className={cx('toast px-shell', !reduced && (leaving ? 'is-leaving' : 'is-entering'))}
      onPointerEnter={hold}
      onPointerLeave={start}
      onAnimationEnd={() => {
        if (leaving) done();
      }}
    >
      <Glyph icon={Trophy} className="icon toast-icon" />
      <div>
        <p className="toast-title">
          {t('toast.achievement', { name: t(`achievement.${id}.name`) })}
        </p>
        <p className="toast-text">{t(`achievement.${id}.description`)}</p>
        {reward && (
          <p className="toast-text">{t('toast.reward', { reward: t(rewardKey(reward)) })}</p>
        )}
      </div>
    </div>
  );
}

/** The live region stays mounted, so screen readers announce each notice as it arrives. */
export function Toasts() {
  const current = useToasts((s) => s.queue[0]);
  return (
    <div className="toast-region" role="status">
      {current && <Toast key={current} id={current} />}
    </div>
  );
}
