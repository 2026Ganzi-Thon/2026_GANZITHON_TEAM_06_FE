# AGENTS.md

이 문서는 AI 코딩 에이전트가 이 레포(프론트엔드)에서 작업할 때 따라야 할 규칙입니다.

## 프로젝트 개요
- 잠시 정차합니다 (2026 간지톤 프론트엔드). React로 화면을 만들고, 대기실의 2D 공간만 Phaser로 그린다.
- 해커톤 프로젝트이며 개발 기간이 짧으므로, 과한 추상화보다 동작하는 단순한 구현을 우선한다.

## 기술 스택
- JavaScript(ES Modules), React 19, Phaser 4, React Router 7, Vite 6, ESLint 9
- React는 UI, Phaser는 게임 캔버스/씬 로직을 담당한다. 두 영역의 책임을 섞지 않는다.
- React ↔ Phaser 통신은 `src/game/EventBus.js`로만 한다.
- 새 라이브러리는 사용자 확인 없이 추가하지 않는다.

## 명령어
- 설치: `npm install`
- 개발 서버: `npm run dev` (http://localhost:8080)
- 빌드: `npm run build`
- 린트: `npm run lint`

## 코드 품질 — PR 올리기 전 필수
```bash
npm run lint             # ESLint 검사
npx eslint . --fix       # ESLint 자동 수정
npm run build            # 빌드가 깨지지 않는지 확인
```
- 타입체크(`tsc`)와 Prettier는 이 프로젝트에 없다. 포맷은 `.editorconfig`를 따른다.
- lint 경고/에러를 `eslint-disable`로 덮지 않는다. 불가피하면 이유를 주석으로 남긴다.

## 페이지
| 경로 | 화면 |
|---|---|
| `/` | 온보딩 |
| `/waiting-room` | 대기실 (Phaser는 여기에만 붙는다) |
| `/collection` | 털실 |
| `/my-sheep` | 마이 양 |
| `/my-sheep/piece/:pieceId` | 조각 상세 |

## 폴더 구조
```text
src/
├─ main.jsx, App.jsx    # 진입점, 라우팅
├─ PhaserGame.jsx       # React ↔ Phaser 연결 컴포넌트
├─ pages/               # 라우트 단위 페이지
├─ components/          # React UI (common/, onboarding/, waitingRoom/, yarn/)
├─ data/                # 화면에서 쓰는 정적 데이터 (API 도입 전까지의 목록 등)
└─ game/                # Phaser 영역
   ├─ main.js           # 게임 설정
   ├─ EventBus.js       # React ↔ Phaser 이벤트
   ├─ scenes/           # Boot, Preloader, MainMenu, Game, GameOver
   └─ objects/          # 게임 오브젝트
public/                 # 정적 파일, assets/ (캐릭터·배경·아이템 이미지)
├─ style.css            # 공통 스타일 (CSS 변수, 버튼 등)
└─ my-sheep.css         # 마이 양 화면 전용 스타일 (화면별 CSS 파일은 이처럼 둔다)
vite/                   # Vite 설정 (dev / prod)
```
- 새 파일은 위 구조의 역할에 맞는 위치에 만든다.

**폴더 선택 기준**
- 한 화면에서만 쓰는 컴포넌트 → 해당 화면 폴더 (`components/onboarding/`, `components/waitingRoom/`, `components/yarn/`)
- 두 화면 이상에서 함께 쓰면 → `components/common/`
- `pages/`에는 라우트 단위 페이지만 둔다. 재사용 UI는 `components/`로 뺀다.
- Phaser 씬/오브젝트 코드는 `game/`에만 두고, `components/`나 `pages/`에 섞지 않는다.

## 작업 흐름
ISSUE 생성 → `feat/{ISSUE_NUMBER}` 브랜치 생성 → 작업 → PR 템플릿대로 PR 생성 → 코드리뷰(CodeRabbit + 팀원 리뷰) → 병합 → PR 종료
- 브랜치명은 `feat/{ISSUE_NUMBER}` 형식을 따른다.
- PR은 레포의 PR 템플릿을 채워서 작성한다.
- 개발 내용의 푸시/병합 대상은 `develop` 브랜치다. `main`에 직접 push하지 않는다.

## 커밋 메시지
형식: `{ISSUE_NUMBER} {Type}: 한국어 설명`
- Type: `feat`(새 기능), `fix`(버그 수정), `refactor`(기능 변경 없는 개선), `style`(UI/스타일), `chore`(빌드/설정/의존성), `docs`(문서)
- 설명은 한국어로 최대한 구체적으로 쓴다.

## 코드 컨벤션
- 상수: `UPPER_SNAKE_CASE` (예: `VALID_COLLEGE_KEYS`)
- 그 외 변수/함수: `lowerCamelCase` (예: `coerceCollegeKey`)
- React 컴포넌트와 파일명: `PascalCase`
- 들여쓰기·포맷은 `.editorconfig`와 `eslint.config.js`를 따른다.

### 언어
**코드는 영어, UI 라벨과 주석은 한국어.**
```jsx
// 대기실 진입 시 Phaser 씬을 시작합니다.
const handleEnter = () => { ... };

<h1>대기실</h1>
```

### Import / Export
- 별도 alias가 없으므로 상대경로(`../components/...`)를 쓴다.
- import 순서: 외부 패키지 → 내부 파일, 그 사이에 빈 줄.
- 페이지와 React 컴포넌트는 `export default`, 그 외 유틸/상수/`EventBus`는 named export. (기존 코드 방식을 따른다.)

### 컴포넌트 구조
파일 안에서 이 순서를 지킨다: import → 컴포넌트(훅 → 이벤트 핸들러 → 렌더).
```jsx
import { useState } from 'react';

import PageLinks from '../components/common/PageLinks';

export default function WaitingRoomPage()
{
    const [isReady, setIsReady] = useState(false);

    const handleReady = () => setIsReady(true);

    return <main>...</main>;
}
```

### 스타일
- 공통 스타일(CSS 변수, 공용 버튼 등)은 `public/style.css`에 둔다.
- 한 화면에서만 쓰는 스타일은 `public/{화면}.css`로 분리하고(예: `my-sheep.css`), `index.html`에서 `style.css` **다음에** `<link>`로 불러온다. `style.css`의 `:root` 변수를 쓰고, 클래스에는 화면 접두사를 붙여(`my-sheep-…`) 다른 화면과 충돌하지 않게 한다.
- 새 화면 CSS 파일을 만들면 `index.html`의 `<link>`도 함께 추가한다. 화면 하나의 스타일이 `style.css`에 길게 쌓이지 않게 한다.
- 정적 값을 인라인 `style={{}}`로 쓰지 않는다.
- 런타임에 정해지는 값(좌표, 동적 색상)만 인라인으로 쓴다.
- 색상·간격은 같은 값을 반복해서 쓰지 말고 CSS 변수로 둔다. 매직 넘버를 흩뿌리지 않는다.

### 라우팅
- 라우트는 `src/App.jsx`에서만 선언한다. 이동은 `<Link>` 또는 `useNavigate()`를 쓴다.
- 새 페이지는 `pages/`에 만들고 `App.jsx`에 `<Route>`를 추가한다.
- Phaser는 `/waiting-room`에만 붙는다. 다른 페이지에서 `PhaserGame`을 마운트하지 않는다.

### React ↔ Phaser
- 통신은 `EventBus`로만 한다. 씬에서 React 상태를 직접 바꾸거나 React에서 씬 내부를 직접 건드리지 않는다.
- `EventBus.on`으로 구독했다면 `useEffect` cleanup에서 반드시 `EventBus.off`로 해제한다.

### API 연동
- 아직 API 계층이 없다. 도입 시 `fetch`를 컴포넌트에 흩뿌리지 말고 한 곳(`src/services/` 등)에 모으고, 먼저 팀과 위치를 정한다.
- `async`/`await`를 쓰고 `.then()` 체이닝은 쓰지 않는다.
- 환경 변수는 `VITE_` 접두사만 클라이언트에 노출된다. **비밀키는 넣지 않는다.**

### 로딩 · 에러 상태
- 데이터를 기다리는 화면에는 로딩과 에러 상태를 항상 같이 만든다.
- 이미 있는 에러 처리와 fallback을 지우지 않는다.

### 접근성
- 클릭 가능한 요소는 `div`가 아니라 `button`/`a`를 쓴다.
- 아이콘/이미지만 있는 버튼은 `aria-label`로 뜻을 알려준다. 이미지에는 `alt`를 쓴다.

## 하지 말아야 할 것
- `.env` 등 비밀 값을 커밋하지 않는다.
- `package.json` 의존성을 상의 없이 추가·변경·삭제하지 않는다.
- `vite/` 설정과 `.github/`(템플릿·워크플로)를 임의로 수정하지 않는다.
- 요청 범위를 벗어난 대규모 리팩터링이나 파일 이동을 하지 않는다.
- 작업 후 위 "코드 품질" 명령이 통과하는지 확인한다.
