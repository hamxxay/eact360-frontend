
/** Small circular spinner for buttons and inline waits. Inherits the text colour. */
export function Spinner({ size = 16, label }: { size?: number; label?: string }) {
  return (
    <span className={'e-ld-spinner'} role={label ? 'status' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <svg viewBox="0 0 24 24" width={size} height={size}>
        <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" strokeOpacity=".25" strokeWidth="3" />
        <path d="M12 2.5a9.5 9.5 0 0 1 9.5 9.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </span>
  );
}
