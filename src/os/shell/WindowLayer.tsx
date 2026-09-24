import { useWindows } from '@/os/kernel/windows';
import { registerSnapPreview } from './layers';
import { Window } from './Window';

/**
 * Windows render in a stable DOM order (creation order) so focus and iframes survive restacking;
 * the stacking order comes from their index in `order`.
 */
export function WindowLayer() {
  const windows = useWindows((s) => s.windows);
  const order = useWindows((s) => s.order);
  const focusedId = useWindows((s) => s.focusedId);
  const area = useWindows((s) => s.area);

  return (
    <>
      <div className="window-layer">
        {Object.values(windows).map((win) => (
          <Window
            key={win.id}
            win={win}
            z={order.indexOf(win.id) + 1}
            focused={focusedId === win.id}
            area={area}
          />
        ))}
      </div>
      <div className="snap-layer" aria-hidden="true">
        <div ref={registerSnapPreview} className="snap-preview" hidden />
      </div>
    </>
  );
}
