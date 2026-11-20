import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { installEnterToNext } from '../../lib/enterToNext';
import { GradientRail } from '../GradientRail/GradientRail';
import { TopProgress } from '../Loaders/TopProgress';
import { TopBar } from '../TopBar/TopBar';

/** Icon rail + top bar + page. The rail is a fixed 92px column; below 640px it becomes a bottom icon bar.
   (The older full-width Sidebar component is kept in src/components/Sidebar for rollback.) */
export function AppShell() {
  // Data entry: Enter moves to the next field (last field keeps its normal Enter), see src/lib/enterToNext.ts
  useEffect(() => installEnterToNext(document), []);

  return (
    <div className="e-shell">
      <TopProgress />
      <a href="#main" className={'e-shell-skip'}>Skip to content</a>
      <GradientRail />
      <div className={'e-shell-main'}>
        <TopBar />
        <main id="main" className={'e-shell-content'} tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
