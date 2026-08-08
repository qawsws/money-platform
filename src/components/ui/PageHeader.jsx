export default function PageHeader({ eyebrow, title, description }) {
  return (
    <div className="mb-6">
      {eyebrow && <p className="text-sm font-bold text-[var(--color-primary)]">{eyebrow}</p>}
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--color-text-primary)]">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">{description}</p>
    </div>
  );
}
