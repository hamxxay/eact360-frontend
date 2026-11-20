import { useEffect, useState } from 'react';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';

/** Thin slate bar at the top of the window while any data is loading or saving.
   Waits 200 ms before showing, so quick answers don't flash, and stays 300 ms after to finish smoothly. */
export function TopProgress() {
  const busy = useIsFetching() + useIsMutating() > 0;
  const [state, setState] = useState<'idle' | 'run' | 'done'>('idle');

  useEffect(() => {
    if (busy) {
      const t = setTimeout(() => setState('run'), 200);
      return () => clearTimeout(t);
    }
    if (state === 'run') {
      setState('done');
      const t = setTimeout(() => setState('idle'), 350);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [busy]);

  if (state === 'idle') return null;
  return (
    <div className={`${'e-ld-top'} ${state === 'done' ? 'e-ld-top-done' : ''}`} role="progressbar" aria-label="Loading" aria-busy={state === 'run'}>
      <span />
    </div>
  );
}
