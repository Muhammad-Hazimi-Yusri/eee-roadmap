// src/utils/toast.ts
// Lightweight toast notification used in place of browser alerts.
// Styles live in src/styles/global.css under .app-toast.

export type ToastType = 'success' | 'error' | 'info';

const TOAST_ID = 'app-toast';
const DEFAULT_DURATION_MS = 3000;
const FADE_OUT_MS = 300;

export function showToast(
  message: string,
  type: ToastType = 'info',
  durationMs: number = DEFAULT_DURATION_MS
): void {
  if (typeof document === 'undefined') return;

  document.getElementById(TOAST_ID)?.remove();

  const toast = document.createElement('div');
  toast.id = TOAST_ID;
  toast.className = `app-toast app-toast--${type}`;
  toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
  toast.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('app-toast--visible');
    setTimeout(() => {
      toast.classList.remove('app-toast--visible');
      setTimeout(() => toast.remove(), FADE_OUT_MS);
    }, durationMs);
  });
}
