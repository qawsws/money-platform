export default function LoadingSkeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-md bg-slate-100 ${className}`}><div className="mb-2 h-5 rounded bg-slate-200" /><div className="h-4 w-3/4 rounded bg-slate-200" /></div>;
}
