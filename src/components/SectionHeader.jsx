export default function SectionHeader({ title, description }) {
  return <div className="mb-6"><h2 className="text-2xl font-bold text-white">{title}</h2><p className="text-gray-400 text-sm mt-1">{description}</p></div>;
}
