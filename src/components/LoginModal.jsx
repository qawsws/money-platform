import { useState } from 'react';
import { createPortal } from 'react-dom';

const t = { title: '\uB85C\uADF8\uC778', username: '\uC544\uC774\uB514', password: '\uBE44\uBC00\uBC88\uD638', cancel: '\uCDE8\uC18C', submit: '\uB85C\uADF8\uC778', loading: '\uB85C\uADF8\uC778 \uC911...', fallback: '\uB85C\uADF8\uC778\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.' };

export default function LoginModal({ open, onClose, onLogin, initialUsername = '', notice = '' }) {
  const [username, setUsername] = useState(initialUsername);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);



  if (!open) return null;
  const submit = async (event) => { event.preventDefault(); setLoading(true); setError(null); try { await onLogin({ username, password }); onClose(); } catch (err) { setError(err.message || t.fallback); } finally { setLoading(false); } };
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/30 px-4 py-6 backdrop-blur-sm sm:py-10">
      <div role="dialog" aria-modal="true" aria-labelledby="login-title" className="max-h-[calc(100dvh-3rem)] w-full max-w-sm overflow-y-auto rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card)]">
        <h3 id="login-title" className="text-xl font-black text-[var(--color-text-primary)]">{t.title}</h3>
        {notice && <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700" role="status">{notice}</p>}
        {error && <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}
        <form onSubmit={submit} className="mt-5 space-y-4">
          <label htmlFor="login-username" className="block text-sm font-bold text-[var(--color-text-primary)]">
            {t.username}
            <input id="login-username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder={t.username} required autoComplete="username" className="mt-2 h-11 w-full rounded-2xl border border-[var(--color-border)] px-4 text-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-emerald-100" />
          </label>
          <label htmlFor="login-password" className="block text-sm font-bold text-[var(--color-text-primary)]">
            {t.password}
            <input id="login-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder={t.password} required type="password" autoComplete="current-password" className="mt-2 h-11 w-full rounded-2xl border border-[var(--color-border)] px-4 text-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-emerald-100" />
          </label>
          <div className="grid gap-2 pt-2 sm:grid-cols-2">
            <button type="button" onClick={onClose} className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[var(--color-border)] px-4 text-sm font-bold text-[var(--color-text-secondary)] hover:bg-slate-50">{t.cancel}</button>
            <button type="submit" disabled={loading} className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] px-4 text-sm font-bold text-white hover:bg-[var(--color-primary-hover)] disabled:bg-slate-300">{loading ? t.loading : t.submit}</button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}