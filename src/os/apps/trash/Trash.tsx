import '../apps.css';
import './trash.css';
import { Delete } from 'pixelarticons/react/Delete';
import { useCallback, useEffect, useState } from 'react';
import { trash } from '@/data/trash';
import { unlockAchievement } from '@/os/kernel/achievements';
import { useT } from '@/os/lib/i18n';
import { useModal } from '@/os/shell/Dialogs';
import { cx, Glyph, Sprite } from '@/os/ui/primitives';
import { EmptyState } from '@/os/ui/States';

/** Discarded drafts, and a Cestino that politely refuses to be emptied. */
export default function Trash() {
  const t = useT();
  const [selected, setSelected] = useState(trash[0]?.name ?? '');
  const [refusing, setRefusing] = useState(false);
  const closeRefusal = useCallback(() => {
    setRefusing(false);
  }, []);
  const dialogRef = useModal(refusing, closeRefusal);
  const item = trash.find((i) => i.name === selected);

  useEffect(() => {
    unlockAchievement('archaeologist');
  }, []);

  return (
    <div className="app-trash">
      <div className="trash-toolbar">
        <button
          type="button"
          className="px-btn"
          onClick={() => {
            setRefusing(true);
          }}
        >
          <Glyph icon={Delete} />
          {t('trash.empty')}
        </button>
        <p className="trash-count">{t('trash.count', { n: trash.length })}</p>
      </div>
      {trash.length === 0 && <EmptyState message={t('trash.none')} />}
      <div className="trash-body" hidden={trash.length === 0}>
        <ul className="trash-list" aria-label={t('trash.files')}>
          {trash.map((file) => (
            <li key={file.name}>
              <button
                type="button"
                className={cx('trash-file', file.name === selected && 'is-selected')}
                aria-pressed={file.name === selected}
                onClick={() => {
                  setSelected(file.name);
                }}
              >
                <Sprite id={file.kind === 'image' ? 'photos' : 'readme'} />
                <span className="trash-file-name">{file.name}</span>
              </button>
            </li>
          ))}
        </ul>
        {item && (
          <section className="trash-preview px-well" aria-label={item.name}>
            {item.kind === 'image' ? (
              <img
                className={cx('trash-image', item.pixelated && 'is-pixelated')}
                src={item.src}
                width={item.width}
                height={item.height}
                alt={item.alt}
                // Small pixel art gets a whole-number enlargement; large images fit the pane.
                style={{
                  inlineSize: `calc(var(--u) * ${String(item.width * (item.width <= 64 ? 6 : 1))})`,
                }}
              />
            ) : (
              <pre className="trash-text">{item.text}</pre>
            )}
            <p className="text-read trash-note">{item.note}</p>
          </section>
        )}
      </div>

      <dialog ref={dialogRef} className="os-dialog px-shell" aria-labelledby="trash-refuse-title">
        <p className="window-titlebar dialog-titlebar">
          <span id="trash-refuse-title" className="window-title">
            {t('trash.empty')}
          </span>
        </p>
        <div className="dialog-body">
          <p className="text-read">{t('trash.refuse')}</p>
        </div>
        <form method="dialog" className="dialog-actions">
          <button type="submit" className="px-btn px-btn-primary">
            {t('trash.ok')}
          </button>
        </form>
      </dialog>
    </div>
  );
}
