import { useState } from 'react';
import { createPortal } from 'react-dom';

const t = { title: '회원가입', intro: '필수 정보를 입력하고 서비스를 시작하세요.', username: '아이디', password: '비밀번호', confirm: '비밀번호 확인', name: '닉네임', email: '이메일', phone: '휴대폰 번호', birth: '생년월일', consent: '개인정보 수집 및 이용에 동의합니다.', cancel: '취소', submit: '가입하기', loading: '가입 중...', mismatch: '비밀번호가 일치하지 않습니다.' };
const initial = { username: '', password: '', passwordConfirm: '', name: '', email: '', phone: '', birthDate: '', consent: false };

export default function SignupModal({ open, onClose, onSignup }) {
  const [form, setForm] = useState(initial); const [loading, setLoading] = useState(false); const [error, setError] = useState(null);
  if (!open) return null;
  const update = (field) => (event) => setForm((value) => ({ ...value, [field]: event.target.type === 'checkbox' ? event.target.checked : event.target.value }));
  const submit = async (event) => { event.preventDefault(); setLoading(true); setError(null); try { if (form.password !== form.passwordConfirm) throw new Error(t.mismatch); const profile = { ...form }; delete profile.passwordConfirm; await onSignup(profile); setForm(initial); onClose(); } catch (err) { setError(err.message); } finally { setLoading(false); } };
  const field = 'mt-1.5 h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-text-primary)] outline-none transition placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-50';
  const label = 'text-sm font-medium text-[var(--color-text-secondary)]';

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/30 px-4 py-6 backdrop-blur-sm sm:py-10">
      <div role="dialog" aria-modal="true" aria-labelledby="signup-title" className="max-h-[calc(100dvh-3rem)] w-full max-w-lg overflow-y-auto rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card)]">
        <div><p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">Account</p><h3 id="signup-title" className="mt-2 text-2xl font-bold text-[var(--color-text-primary)]">{t.title}</h3><p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{t.intro}</p></div>
        {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700" role="alert">{error}</p>}
        <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
          <label htmlFor="signup-username" className={label}>{t.username}<input id="signup-username" value={form.username} onChange={update('username')} placeholder={t.username} minLength={4} required autoComplete="username" className={field} /></label>
          <label htmlFor="signup-name" className={label}>{t.name}<input id="signup-name" value={form.name} onChange={update('name')} placeholder={t.name} required autoComplete="nickname" className={field} /></label>
          <label htmlFor="signup-password" className={label}>{t.password}<input id="signup-password" value={form.password} onChange={update('password')} placeholder={t.password} minLength={8} required type="password" autoComplete="new-password" className={field} /></label>
          <label htmlFor="signup-password-confirm" className={label}>{t.confirm}<input id="signup-password-confirm" value={form.passwordConfirm} onChange={update('passwordConfirm')} placeholder={t.confirm} minLength={8} required type="password" autoComplete="new-password" className={field} /></label>
          <label htmlFor="signup-email" className={`${label} sm:col-span-2`}>{t.email}<input id="signup-email" value={form.email} onChange={update('email')} placeholder={t.email} required type="email" autoComplete="email" className={field} /></label>
          <label htmlFor="signup-phone" className={label}>{t.phone}<input id="signup-phone" value={form.phone} onChange={update('phone')} placeholder={t.phone} required type="tel" autoComplete="tel" className={field} /></label>
          <label htmlFor="signup-birth-date" className={label}>{t.birth}<input id="signup-birth-date" value={form.birthDate} onChange={update('birthDate')} type="date" className={field} /></label>
          <label htmlFor="signup-consent" className="flex items-start gap-3 rounded-xl border border-[var(--color-border)] bg-slate-50/70 p-3 text-sm text-[var(--color-text-secondary)] sm:col-span-2"><input id="signup-consent" checked={form.consent} onChange={update('consent')} required type="checkbox" className="mt-1 size-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]" /><span>{t.consent}</span></label>
          <div className="grid gap-2 pt-2 sm:col-span-2 sm:grid-cols-2"><button type="button" onClick={onClose} className="h-11 rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:border-slate-300 hover:bg-slate-50">{t.cancel}</button><button type="submit" disabled={loading} className="h-11 rounded-xl bg-[var(--color-primary)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50">{loading ? t.loading : t.submit}</button></div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
