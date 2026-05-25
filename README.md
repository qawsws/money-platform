# MoneyPlatform

React + Vite 기반의 투자 정보 플랫폼 예제입니다. Tailwind CSS를 사용한 다크 테마 UI로 구성되어 있으며, 주요 시장 지수, 암호화폐, 미국 주식, 뉴스, 인기 커뮤니티 게시물을 보여줍니다.

## 실행 방법

1. 패키지 설치

```bash
npm install
```

2. 개발 서버 실행

```bash
npm run dev
```

3. 빌드

```bash
npm run build
```

4. 배포용 미리보기

```bash
npm run preview
```

## 프로젝트 구조

- `src/`
  - `App.jsx` — 페이지 레이아웃과 섹션 컴포넌트를 조합합니다.
  - `main.jsx` — Vite 애플리케이션 진입점입니다.
  - `index.css` — Tailwind CSS를 `@import "tailwindcss"`로 불러옵니다.
  - `mock/marketData.js` — 모든 목업 데이터를 한 곳에 정리한 파일입니다.
  - `components/` — 화면을 구성하는 재사용 가능한 컴포넌트들입니다.

## components 폴더 역할

- `Header.jsx` — 상단 네비게이션과 로그인/가입 버튼을 렌더링합니다.
- `Footer.jsx` — 페이지 하단 정보와 링크, 소셜 아이콘을 표시합니다.
- `MarketIndex.jsx` — 주요 시장 지수 카드 섹션입니다.
- `CoinPrice.jsx` — 암호화폐 시세 카드 섹션입니다.
- `StockCard.jsx` — 미국 주식 테이블과 모바일 카드 레이아웃을 처리합니다.
- `NewsList.jsx` — 투자 관련 뉴스 목록을 표시합니다.
- `CommunityPosts.jsx` — 인기 커뮤니티 게시물을 카드 형태로 나열합니다.
- `SectionHeader.jsx` — 각 섹션 제목과 설명을 일관된 스타일로 렌더링합니다.
- `SectionDivider.jsx` — 섹션 간 구분선을 재사용하기 위한 컴포넌트입니다.

## mock 데이터 구조 (`src/mock/marketData.js`)

- `marketIndices` — `id`, `name`, `value`, `change`, `isPositive`, `icon`.
- `cryptoPrices` — `id`, `name`, `symbol`, `price`, `change`, `isPositive`, `image`.
- `usStocks` — `id`, `symbol`, `name`, `price`, `change`, `isPositive`, `description`.
- `newsList` — `id`, `title`, `summary`, `category`, `time`, `importance`.
- `communityPosts` — `id`, `author`, `title`, `views`, `likes`, `comments`, `category`, `score`.

## 정리된 리팩토링 포인트

- 공통 섹션 제목과 구분선을 별도 컴포넌트로 분리하여 반복 코드 제거
- 목업 데이터 파일을 `src/mock/marketData.js`로 이동
- 컴포넌트별 역할을 README에 명확히 정리
- 모바일 반응형 테이블 오버플로우와 카드 레이아웃 안정화
- 불필요한 중복 코드 제거 및 코드 정리
