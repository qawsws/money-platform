export default function LoadingSkeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-gray-800 rounded ${className}`}>
      <div className="h-6 bg-gray-700 rounded mb-2" />
      <div className="h-4 bg-gray-700 rounded w-3/4" />
    </div>
  );
}
