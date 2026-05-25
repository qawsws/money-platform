// SectionDivider 컴포넌트 - 페이지 섹션 사이의 구분선을 재사용합니다
// App.jsx에서 반복되는 구분선 코드를 줄이기 위해 사용합니다

export default function SectionDivider() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="border-t border-gray-800"></div>
    </div>
  );
}
