# MoneyPlatform

투자자가 시장 지수, 암호화폐, 미국 주식, 한국 주식, 뉴스, 커뮤니티, 포트폴리오를 한 화면에서 확인할 수 있는 투자 정보 통합 웹 서비스입니다.

배포 주소: https://money-platform.onrender.com

## 프로젝트 목표

MoneyPlatform은 단순한 종목 목록 페이지가 아니라, 실제 사용자가 로그인해서 관심 자산을 저장하고 포트폴리오를 관리하며 투자 관련 글과 뉴스를 함께 확인할 수 있는 웹 서비스를 목표로 만들었습니다.

특히 다음에 집중했습니다.

- 시장 데이터를 보기 쉽게 정리하는 대시보드 UI
- 회원/관리자 역할이 분리된 실제 서비스 흐름
- 포트폴리오 평가금액, 수익률, 자산군 비중 계산
- 게시글, 댓글, 좋아요, 신고, 공지 관리가 포함된 커뮤니티
- OpenAI API를 활용한 AI 뉴스 요약, 포트폴리오 분석, 투자 인사이트
- Render 배포와 PostgreSQL 운영 환경 구성

## 주요 기능

### 시장 정보

- 시장 지수 조회
- 암호화폐 가격 및 24시간 변동률 조회
- 미국 주식 가격 및 등락률 조회
- 한국 주식 가격 및 등락률 조회
- 자산 상세 페이지
- 가격 흐름 차트
- 변동률 랭킹
- 시장 관련 뉴스 연결

### 회원 기능

- 회원가입
- 로그인/로그아웃
- 세션 복원
- 마이페이지
- 비밀번호 변경
- 회원 탈퇴
- 닉네임 기반 활동 표시

### 즐겨찾기

- 자산 상세 페이지에서 즐겨찾기 추가
- 즐겨찾기 목록 조회
- 중복 추가 방지
- 즐겨찾기 삭제
- 로그인하지 않은 사용자 접근 제어

### 포트폴리오

- 보유 자산 추가
- 수량, 평균 매수가 저장
- 한국 주식은 원화 기준 표시
- 미국 주식과 암호화폐는 달러 기준 표시
- 총 평가금액은 환율을 반영해 원화 기준으로 계산
- 평가금액, 투자금액, 수익금, 수익률 계산
- 자산군 비중 시각화
- 보유 자산 수정/삭제

### 뉴스

- 금융 뉴스 목록
- 국내증시, 해외증시, 경제 등 카테고리 분리
- 뉴스 상세 페이지
- 외부 원문 링크
- 뉴스 저장/저장 취소
- AI 뉴스 요약

### 커뮤니티

- 게시글 목록
- 게시글 작성
- 게시글 상세
- 댓글 작성
- 좋아요/좋아요 취소
- 게시글 신고
- 댓글 신고
- 작성자 삭제
- 관리자 삭제
- XSS 문자열이 실행되지 않도록 React 렌더링 기반 표시

### 관리자

- 관리자 대시보드
- 회원 목록 조회
- 회원 상세 관리
- 관리자 메모
- 사용자/관리자 권한 변경
- 게시글 관리
- 댓글 관리
- 신고 관리
- 공지 작성/수정/숨김/복구/삭제

### AI 기능

- AI 뉴스 요약
- AI 포트폴리오 분석
- AI 투자 인사이트
- `AI_ENABLED=false`일 때 실제 OpenAI 호출 차단
- 캐시, rate limit, 일일 호출 제한 적용
- 실제 API Key는 GitHub에 커밋하지 않음

## 기술 스택

### Frontend

- React
- Vite
- React Router
- TanStack Query
- Zustand
- Tailwind CSS

### Backend

- Node.js
- Express
- SQLite
- PostgreSQL
- JWT 인증
- OpenAI API

### Infra / QA

- Render
- Render PostgreSQL
- Playwright
- MSW
- ESLint

## 데이터 저장 구조

로컬 개발 환경에서는 SQLite를 사용합니다.

```text
data/money-platform.sqlite
```

배포 환경에서는 `DATABASE_URL` 환경변수가 있으면 PostgreSQL을 사용합니다.

Render 배포에서는 `render.yaml`을 통해 PostgreSQL DB가 연결되도록 구성되어 있습니다.

```yaml
DATABASE_URL:
  fromDatabase:
    name: money-platform-db
    property: connectionString
```

즉, 로컬에서는 SQLite로 빠르게 개발하고, 배포 환경에서는 PostgreSQL에 사용자 데이터가 저장됩니다.

## 실행 방법

```bash
npm install
npm run dev
```

로컬 실행 주소:

```text
http://localhost:5173
```

`npm run dev`는 다음을 함께 실행합니다.

- Vite frontend: `5173`
- Node API server: `3001`
- Local SQLite DB: `data/money-platform.sqlite`

## 검증 명령어

```bash
npm run lint
npm run build
npm run test:e2e
```

최근 검증 결과:

- lint 통과
- build 통과
- E2E 7개 통과
- 회원/관리자 기능 QA 69개 체크 통과

## 환경변수

실제 값은 `.env` 또는 Render Environment에만 설정합니다.

```env
DATABASE_URL=postgresql://user:password@host:port/database
DATABASE_SSL=true
JWT_SECRET=change-me-long-random-secret
AI_ENABLED=false
OPENAI_API_KEY=optional-openai-key-placeholder
OPENAI_MODEL=gpt-4.1-mini
```

주의:

- `.env` 파일은 Git에 올리지 않습니다.
- OpenAI API Key, JWT Secret, DB 접속 문자열은 GitHub에 커밋하지 않습니다.
- `AI_ENABLED=false`이면 AI 버튼을 눌러도 실제 OpenAI API를 호출하지 않습니다.

## 배포

Render Blueprint 배포를 사용합니다.

```bash
npm run build
npm start
```

Render 설정:

- Web Service: `money-platform`
- Database: `money-platform-db`
- Branch: `master`
- Health Check: `/api/auth/health`
- Plan: Free

## QA 내용

배포 전 다음 기능을 실제 흐름 기준으로 검증했습니다.

- 회원가입/로그인/세션 확인
- 일반 회원의 관리자 접근 차단
- 즐겨찾기 추가/삭제
- 포트폴리오 추가/수정/삭제
- 커뮤니티 글 작성/조회/좋아요/댓글/신고
- 관리자 회원 관리
- 관리자 공지 관리
- 관리자 신고 처리
- 관리자 게시글/댓글 삭제
- 테스트 데이터 DB 삭제 확인
- AI 기능 자동 호출 없음 확인

## 보안 고려

- 비밀번호는 해시로 저장
- JWT 기반 인증
- 관리자 API는 서버에서 관리자 권한 확인
- 사용자별 데이터는 인증된 사용자 기준으로 처리
- API Key와 Secret은 환경변수로 관리
- `.env`, SQLite DB, `dist`, `node_modules`, 테스트 산출물은 Git 제외

## 문제 해결 경험

개발 과정에서 다음 문제를 해결했습니다.

- Render 배포 시 dev dependency 설치 문제
- AI 투자 인사이트 timeout 원인 분석
- AI 응답 JSON Schema 검증
- OpenAI API 호출 횟수 제한
- 한글 문자열 깨짐 수정
- 로그인/회원가입 모달 위치 문제 수정
- 포트폴리오 원화/달러 혼합 계산 문제 수정
- 커뮤니티 게시글/댓글 신고 UX 개선
- 관리자 기능 실사용 흐름 검증
- 홈, 시장, 뉴스, 커뮤니티 UI 재정리

## 프로젝트 성격

이 프로젝트는 학습용 데모를 넘어서 실제 웹 서비스에 가까운 흐름을 구현하는 데 집중했습니다. 단순히 화면을 만드는 것보다, 사용자가 가입하고 데이터를 저장하고 관리자가 운영할 수 있는 구조까지 포함했습니다.
