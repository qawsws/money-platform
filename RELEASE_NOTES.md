Release notes

v0.1.0 - 주요 변경사항

- React Router로 라우팅 전환 및 상세 페이지 라우트 추가
- React Query로 데이터 패칭/캐싱 마이그레이션 (News, Market, Crypto, Stocks, Community)
- Zust and 전역 즐겨찾기 상태 추가 및 로컬스토리지 동기화
- Modal overlay routing (background location) 적용 — 리스트 클릭 시 모달로 상세 표시, 직접 링크도 지원
- MSW 핸들러 강화 및 Playwright E2E 테스트 추가
- React Query DevTools 개발 모드에 추가
- 코드 스플리팅: 주요 섹션 컴포넌트 lazy-load 적용
- GitHub Actions CI 워크플로우 추가 (빌드/린트/E2E)

Notes:
- Playwright는 일부 브라우저 설치에서 디스크 공간 오류(ENOSPC)가 발생할 수 있음. CI 환경에서는 기본적으로 playwright 설치가 필요합니다.
