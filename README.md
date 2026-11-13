# 개발 내용에 대한 푸시는 develop 브랜치에 합니다.

# 잠시 정차합니다

2026 간지톤 프론트엔드입니다. React로 화면을 만들고, 대기실의 2D 공간만 Phaser로 그립니다.

## 준비

Node.js와 npm이 필요합니다.

## 실행

```bash
npm install
npm run dev
```

개발 서버는 http://localhost:8080 입니다.

| 명령 | 하는 일 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run build` | `dist/`에 프로덕션 빌드 |
| `npm run lint` | ESLint 검사 |

## 페이지

| 경로 | 화면 |
|---|---|
| `/` | 온보딩 |
| `/waiting-room` | 대기실. Phaser가 여기에만 붙습니다 |
| `/collection` | 털실 |
| `/my-sheep` | 마이 양 |

주소로 직접 들어가거나 새로고침해도 같은 화면이 열립니다.

## 폴더

```text
src/pages/          페이지
src/components/     공통, 온보딩, 대기실, 털실 UI
src/game/           Phaser 씬, EventBus
src/PhaserGame.jsx  React와 Phaser 연결
public/assets/      캐릭터, 배경, 아이템 이미지
```

React와 Phaser는 `src/game/EventBus.js`로 이벤트를 주고받습니다. 대기실 페이지는 `useRef`를 `PhaserGame`에 넘깁니다.