export default function SectionHeader({ title, description, action }) {
  return <div className="mb-4 flex items-end justify-between gap-4"><div><h2 className="text-xl font-bold text-slate-950">{title}</h2><p className="mt-1 text-sm text-slate-500">{description}</p></div>{action}</div>;
}
