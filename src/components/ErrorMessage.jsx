export default function ErrorMessage({ error }) {
  return <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"><b>{'오류가 발생했습니다.'}</b><p className="mt-1">{String(error?.message || error)}</p></div>;
}
