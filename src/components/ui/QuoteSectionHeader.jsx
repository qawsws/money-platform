export default function QuoteSectionHeader({ title, description, action }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-xl font-extrabold tracking-tight text-[var(--color-text-primary)]">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">{description}</p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
