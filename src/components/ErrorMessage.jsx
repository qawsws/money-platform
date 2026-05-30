export default function ErrorMessage({ error }) {
  return (
    <div className="bg-red-900 text-red-100 rounded p-3">
      <strong className="block">오류가 발생했습니다.</strong>
      <p className="text-sm mt-1">{String(error?.message || error)}</p>
    </div>
  );
}
