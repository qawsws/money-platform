// SectionHeader 컴포넌트 - 섹션 제목과 설명을 일관된 디자인으로 렌더링합니다
// 섹션별 템플릿을 분리하여 반복 코드를 줄입니다

export default function SectionHeader({ title, description }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      <p className="text-gray-400 text-sm mt-1">{description}</p>
    </div>
  );
}
