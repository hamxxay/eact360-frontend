import { Button } from '../../components/Button/Button';
import { Card } from '../../components/Card/Card';
import { PageHeader } from '../../components/PageHeader/PageHeader';

export function NotFoundPage() {
  return (
    <>
      <PageHeader title="Page not found" subtitle="This screen hasn’t moved to the new design yet, or the link is wrong." />
      <Card>
        <p className="e-note">Go back to the dashboard, or open the classic site, where every screen is still available.</p>
        <div className="e-row-actions">
          <Button variant="primary" to="/">Go to dashboard</Button>
          <Button to="/classic/DashBoard.aspx">Open the classic dashboard</Button>
        </div>
      </Card>
    </>
  );
}
