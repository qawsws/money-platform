# MoneyPlatform

React + Vite 기반 투자 정보 웹사이트입니다. 시장 정보는 mock API로 제공하며, 회원가입과 로그인은 로컬 SQLite DB에 저장됩니다.

## 실행 방법

```bash
npm install
npm run dev
```

`npm run dev`는 Vite 웹 서버와 SQLite 인증 API 서버를 함께 실행합니다.

프로덕션 빌드와 검증 명령:

```bash
npm run lint
npm run build
npm run test:e2e
```

## 회원가입과 로그인

회원가입에서 입력한 아이디와 비밀번호로 로그인할 수 있습니다. 비밀번호는 해시 처리되며 평문으로 저장되지 않습니다.

로컬 개발 DB 파일은 `data/money-platform.sqlite`에 생성됩니다.

## 실제 API 연결

`.env.example`을 참고해 `.env`에 API 서버 주소를 지정할 수 있습니다.

```bash
VITE_API_BASE=https://api.example.com
```

값을 비워 두면 개발 환경에서 MSW mock API를 사용합니다.

## 주요 구조

- `src/components`: 화면 섹션과 공통 UI
- `src/pages`: 상세 화면과 즐겨찾기 화면
- `src/context`: 인증 및 검색 상태
- `src/store`: 사용자별 즐겨찾기 상태
- `src/services`: API 호출 함수
- `src/mocks`: 개발 환경용 MSW 핸들러
- `tests`: Playwright E2E 테스트
