import { useState } from 'react';

const text = {
  title: '\uD68C\uC6D0\uAC00\uC785',
  username: '\uC544\uC774\uB514',
  password: '\uBE44\uBC00\uBC88\uD638',
  passwordConfirm: '\uBE44\uBC00\uBC88\uD638 \uD655\uC778',
  name: '\uC774\uB984',
  email: '\uC774\uBA54\uC77C',
  phone: '\uD734\uB300\uD3F0 \uBC88\uD638',
  birthDate: '\uC0DD\uB144\uC6D4\uC77C',
  consent: '\uAC1C\uC778\uC815\uBCF4 \uC218\uC9D1 \uBC0F \uC774\uC6A9\uC5D0 \uB3D9\uC758\uD569\uB2C8\uB2E4.',
  hint: '\uC544\uC774\uB514\uB294 4\uC790, \uBE44\uBC00\uBC88\uD638\uB294 8\uC790 \uC774\uC0C1 \uC785\uB825\uD558\uC138\uC694.',
  cancel: '\uCDE8\uC18C',
  submit: '\uAC00\uC785\uD558\uAE30',
  loading: '\uAC00\uC785 \uC911...',
  fallbackError: '\uD68C\uC6D0\uAC00\uC785\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.',
  passwordMismatch: '\uBE44\uBC00\uBC88\uD638\uAC00 \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.',
};

const initialForm = { username: '', password: '', passwordConfirm: '', name: '', email: '', phone: '', birthDate: '', consent: false };

export default function SignupModal({ open, onClose, onSignup }) {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  if (!open) return null;

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.type === 'checkbox' ? event.target.checked : event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (form.password !== form.passwordConfirm) throw new Error(text.passwordMismatch);
      const profile = { ...form };
      delete profile.passwordConfirm;
      await onSignup(profile);
      setForm(initialForm);
      onClose();
    } catch (err) {
      setError(err.message || text.fallbackError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4 py-6">
      <div className="bg-gray-900 p-6 rounded-lg w-full max-w-lg max-h-full overflow-y-auto text-white border border-gray-700">
        <h3 className="text-lg font-bold mb-4">{text.title}</h3>
        {error && <div className="text-red-300 bg-red-950 border border-red-800 rounded p-3 mb-3 text-sm">{error}</div>}
        <form onSubmit={submit} className="space-y-3">
          <input value={form.username} onChange={update('username')} placeholder={text.username} minLength={4} required autoComplete="username" className="w-full p-2 rounded bg-gray-800 border border-gray-700" />
          <input value={form.password} onChange={update('password')} placeholder={text.password} minLength={8} required type="password" autoComplete="new-password" className="w-full p-2 rounded bg-gray-800 border border-gray-700" />
          <input value={form.passwordConfirm} onChange={update('passwordConfirm')} placeholder={text.passwordConfirm} minLength={8} required type="password" autoComplete="new-password" className="w-full p-2 rounded bg-gray-800 border border-gray-700" />
          <input value={form.name} onChange={update('name')} placeholder={text.name} required autoComplete="name" className="w-full p-2 rounded bg-gray-800 border border-gray-700" />
          <input value={form.email} onChange={update('email')} placeholder={text.email} required type="email" autoComplete="email" className="w-full p-2 rounded bg-gray-800 border border-gray-700" />
          <input value={form.phone} onChange={update('phone')} placeholder={text.phone} required type="tel" autoComplete="tel" className="w-full p-2 rounded bg-gray-800 border border-gray-700" />
          <label className="block text-sm text-gray-300"><span className="block mb-1">{text.birthDate}</span><input value={form.birthDate} onChange={update('birthDate')} type="date" className="w-full p-2 rounded bg-gray-800 border border-gray-700" /></label>
          <label className="flex gap-2 items-start text-sm text-gray-300"><input checked={form.consent} onChange={update('consent')} required type="checkbox" className="mt-1" /><span>{text.consent}</span></label>
          <p className="text-xs text-gray-400">{text.hint}</p>
          <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-700">{text.cancel}</button><button type="submit" disabled={loading} className="px-4 py-2 rounded bg-blue-600 disabled:opacity-60">{loading ? text.loading : text.submit}</button></div>
        </form>
      </div>
    </div>
  );
}
