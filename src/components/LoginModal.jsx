import { useState } from 'react';

const text = {
  title: '\uB85C\uADF8\uC778',
  username: '\uC544\uC774\uB514',
  password: '\uBE44\uBC00\uBC88\uD638',
  cancel: '\uCDE8\uC18C',
  submit: '\uB85C\uADF8\uC778',
  loading: '\uB85C\uADF8\uC778 \uC911...',
  fallbackError: '\uB85C\uADF8\uC778\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.',
};

export default function LoginModal({ open, onClose, onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  if (!open) return null;

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onLogin({ username, password });
      onClose();
    } catch (err) {
      setError(err.message || text.fallbackError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4">
      <div className="bg-gray-900 p-6 rounded-lg w-full max-w-md text-white border border-gray-700">
        <h3 className="text-lg font-bold mb-4">{text.title}</h3>
        {error && <div className="text-red-300 bg-red-950 border border-red-800 rounded p-3 mb-3 text-sm">{error}</div>}
        <form onSubmit={submit} className="space-y-3">
          <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder={text.username} required autoComplete="username" className="w-full p-2 rounded bg-gray-800 border border-gray-700" />
          <input value={password} onChange={(event) => setPassword(event.target.value)} placeholder={text.password} required type="password" autoComplete="current-password" className="w-full p-2 rounded bg-gray-800 border border-gray-700" />
          <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-700">{text.cancel}</button><button type="submit" disabled={loading} className="px-4 py-2 rounded bg-blue-600 disabled:opacity-60">{loading ? text.loading : text.submit}</button></div>
        </form>
      </div>
    </div>
  );
}
