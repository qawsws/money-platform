export default function PageHeader({ eyebrow, title, description }) {
  return (
    <header className="mb-6 rounded-2xl border border-[var(--color-border)] bg-white px-5 py-5 shadow-sm">
      {eyebrow && <p className="text-xs font-black uppercase text-[var(--color-primary)]">{eyebrow}</p>}
      <h1 className="mt-2 text-3xl font-black tracking-tight text-[var(--color-text-primary)] sm:text-4xl">{title}</h1>
      {description && <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-[var(--color-text-secondary)]">{description}</p>}
    </header>
  );
}
