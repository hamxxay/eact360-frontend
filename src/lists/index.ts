import type { ListDef } from './engine';
import { JV_LISTS } from './defs/jv';
import { JV_APPROVAL_LISTS } from './defs/jvApprovals';

/** Every config-driven list screen. Adding a definition here adds its route and switches its classic page
   over (MIGRATED in src/app/nav.ts); removing it rolls back to the classic page. */
export const LIST_DEFS: ListDef[] = [...JV_LISTS, ...JV_APPROVAL_LISTS];

/** Legacy page name (lower case, no .aspx) → React route, for MIGRATED. */
export function listMigrations(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const d of LIST_DEFS) {
    const name = d.legacyPage.split('/').pop()!.replace(/\.aspx$/i, '').toLowerCase();
    map[name] = d.route;
  }
  return map;
}
