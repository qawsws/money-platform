export default function QuoteSectionHeader({ title, description, action }) {
  return (
    <div className="mb-5 flex flex-col gap-3 border-b border-[var(--color-border)] pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-xl font-black tracking-tight text-[var(--color-text-primary)]">{title}</h2>
        {description && <p className="mt-1 text-sm font-semibold leading-6 text-[var(--color-text-secondary)]">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
