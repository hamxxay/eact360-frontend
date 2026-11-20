import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon } from '../Icon/Icon';

export type ToastType = 'ok' | 'wait' | 'bad' | 'info';
export interface ToastInput { type: ToastType; title: string; sub?: string; action?: { label: string; onClick: () => void } }
interface ToastItem extends ToastInput { id: number }

const Ctx = createContext<(t: ToastInput) => void>(() => {});
export const useToast = () => useContext(Ctx);

const MAX = 3;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const next = useRef(1);
  const notify = useCallback((t: ToastInput) => {
    setItems((list) => [...list, { ...t, id: next.current++ }].slice(-MAX));
  }, []);
  const remove = useCallback((id: number) => setItems((list) => list.filter((t) => t.id !== id)), []);

  return (
    <Ctx.Provider value={notify}>
      {children}
      <div className={'e-toast-stack'}>
        {items.map((t) => <Toast key={t.id} item={t} onClose={() => remove(t.id)} />)}
      </div>
    </Ctx.Provider>
  );
}

function Toast({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const [paused, setPaused] = useState(false);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => close.current(), item.type === 'bad' ? 9000 : 5000);
    return () => clearTimeout(t);
  }, [paused, item.type]);

  return (
    <div
      className={['e-toast-nt', `e-toast-${item.type}`].join(' ')} role={item.type === 'bad' ? 'alert' : 'status'}
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}
    >
      <span className={'e-toast-ic'}><Icon name={item.type} size={18} /></span>
      <div className={'e-toast-tx'}>
        <b>{item.title}</b>
        {item.sub && <span>{item.sub}</span>}
      </div>
      {item.action && (
        <button type="button" className={'e-toast-act'} onClick={() => { item.action!.onClick(); onClose(); }}>{item.action.label}</button>
      )}
      <button type="button" className={'e-toast-x'} onClick={onClose} aria-label="Dismiss"><Icon name="close" size={14} /></button>
    </div>
  );
}
