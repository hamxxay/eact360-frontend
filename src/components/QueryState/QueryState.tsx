import { Button } from '../Button/Button';

export function Loading({ label }: { label: string }) {
  return (
    <div className={'e-qs-loading'} role="status">
      <span className={'e-qs-bar'} />
      <span className={'e-qs-bar'} />
      <span className={'e-qs-bar'} />
      <span className="visually-hidden">{label}</span>
    </div>
  );
}

export function LoadError({ what, error, onRetry }: { what: string; error: unknown; onRetry: () => void }) {
  return (
    <div className={'e-qs-error'} role="alert">
      <b>Couldn’t load {what}.</b>
      <p>{error instanceof Error ? error.message : 'Unknown error.'}</p>
      <Button onClick={onRetry}>Try again</Button>
    </div>
  );
}
