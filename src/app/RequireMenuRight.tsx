import type { ReactNode } from 'react';
import { Button } from '../components/Button/Button';
import { Card } from '../components/Card/Card';
import { PageHeader } from '../components/PageHeader/PageHeader';
import { PageSkeleton } from '../components/Loaders/Skeleton';
import { useNav } from './nav';

/** Shows a migrated screen only if the user's legacy menu offers it, so rights match the classic site.
   (This is a convenience, not security: the legacy handlers do not check rights themselves.) */
export function RequireMenuRight({ route, children }: { route: string; children: ReactNode }) {
  const { groups, loading } = useNav();
  if (loading) return <PageSkeleton label="Checking access" />;
  if (groups.some((g) => g.items.some((i) => i.to === route))) return <>{children}</>;
  return (
    <>
      <PageHeader title="No access" subtitle="Your role doesn’t include this screen." />
      <Card>
        <p className="e-note">Ask your administrator for the right if you need it.</p>
        <Button variant="primary" to="/">Go to dashboard</Button>
      </Card>
    </>
  );
}
