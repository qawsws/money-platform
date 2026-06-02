export default function ErrorMessage({ error }) {
  return <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"><b>{'\uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.'}</b><p className="mt-1">{String(error?.message || error)}</p></div>;
}
