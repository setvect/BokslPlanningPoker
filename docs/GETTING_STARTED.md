# 시작하기

복슬 플래닝 포커를 로컬 환경에서 개발하고 빌드하는 방법을 안내합니다.

## 📋 사전 준비

- **Node.js** 18.x 이상
- **npm** 9.x 이상
- (선택사항) **Docker** - 컨테이너화된 환경 사용 시

## 🚀 로컬 개발 환경 설정

### 1. 저장소 클론

```bash
git clone https://github.com/yourusername/BokslPlanningPoker.git
cd BokslPlanningPoker
```

### 2. 의존성 설치

```bash
# 서버 의존성
cd server
npm install
cd ..

# 클라이언트 의존성
cd client
npm install
cd ..
```

### 3. 개발 서버 실행

두 개의 터미널을 열어 각각 서버와 클라이언트를 실행합니다.

```bash
# 터미널 1: 서버 (포트 3001)
cd server
npm run dev
```

```bash
# 터미널 2: 클라이언트 (포트 5173)
cd client
npm run dev
```

### 4. 브라우저에서 확인

클라이언트 개발 서버가 시작되면 다음 주소로 접속합니다:
```
http://localhost:5173
```

## 🔧 개발 도구

### 타입 검사

```bash
# 클라이언트 타입 검사
cd client
npm run type-check

# 서버 타입 검사
cd server
npm run type-check
```

### 코드 품질 검사 (ESLint)

```bash
# 클라이언트 린트
cd client
npm run lint

# 서버 린트
cd server
npm run lint
```

### 코드 포맷팅 (Prettier)

```bash
# 클라이언트 포맷팅
cd client
npm run format

# 서버 포맷팅
cd server
npm run format
```

## 📦 프로덕션 빌드

### 클라이언트 빌드

```bash
cd client
npm run build
```

빌드된 파일은 `client/dist/` 디렉토리에 생성됩니다.

### 서버 빌드

```bash
cd server
npm run build
```

빌드된 파일은 `server/dist/` 디렉토리에 생성됩니다.

### 전체 빌드 (한 번에)

```bash
# 클라이언트와 서버 모두 빌드
(cd client && npm run build) && (cd server && npm run build)
```

## 🏃 프로덕션 모드 실행

```bash
# 클라이언트 빌드
cd client
npm run build
cd ..

# 서버 빌드 및 실행
cd server
npm run build
npm start
```

서버는 포트 3000에서 실행되며, 정적 파일(클라이언트)도 함께 제공합니다:
```
http://localhost:3000
```

## 📁 프로젝트 구조

```
BokslPlanningPoker/
├── server/                    # 백엔드 애플리케이션
│   ├── src/
│   │   ├── index.ts          # 서버 엔트리포인트
│   │   ├── socket/           # Socket.io 이벤트 핸들러
│   │   ├── models/           # 데이터 모델 (Room, User, Game)
│   │   └── utils/            # 유틸리티 함수
│   ├── package.json
│   └── tsconfig.json
├── client/                   # 프론트엔드 애플리케이션
│   ├── src/
│   │   ├── App.tsx          # 메인 React 컴포넌트
│   │   ├── components/      # UI 컴포넌트
│   │   ├── hooks/           # 커스텀 훅 (useSocket, useGame, useTheme)
│   │   └── styles/          # 글로벌 스타일
│   ├── package.json
│   ├── vite.config.ts       # Vite 설정
│   └── tailwind.config.js   # Tailwind CSS 설정
└── shared/                  # 공유 타입 및 상수
    ├── types.ts             # 공통 타입 정의
    ├── socket-events.ts     # Socket.io 이벤트 정의
    └── constants.ts         # 게임 설정 상수
```

## 🐛 문제 해결

### 포트가 이미 사용 중인 경우

**서버 포트 변경 (기본: 3001)**
```bash
# server/src/index.ts 파일에서 포트 수정
const PORT = process.env.PORT || 3001;
```

**클라이언트 포트 변경 (기본: 5173)**
```bash
# client/vite.config.ts 파일에서 포트 수정
server: {
  port: 5173,
}
```

### Socket.io 연결 오류

클라이언트가 서버에 연결할 수 없는 경우:

1. 서버가 정상적으로 실행 중인지 확인
2. `client/src/hooks/useSocket.ts`에서 서버 URL 확인:
```typescript
const socket = io('http://localhost:3001');
```

### 타입 오류

shared 타입이 인식되지 않는 경우:
```bash
# 루트 디렉토리에서 shared 폴더 확인
ls -la shared/

# TypeScript 설정 확인
cat server/tsconfig.json
cat client/tsconfig.json
```

## 💡 개발 팁

### Hot Reload 활용

- 서버: `nodemon`을 통해 파일 변경 시 자동 재시작
- 클라이언트: Vite의 HMR(Hot Module Replacement)로 즉시 반영

### 브라우저 개발자 도구

Socket.io 연결 상태 확인:
1. F12 또는 Cmd+Option+I로 개발자 도구 열기
2. Console 탭에서 연결 로그 확인
3. Network 탭 → WS 필터로 WebSocket 연결 확인

### 멀티 브라우저 테스트

실시간 동기화를 테스트하려면:
1. 여러 브라우저 창 또는 시크릿 모드 사용
2. 같은 방에 입장하여 카드 선택 동기화 확인
3. 모바일 기기에서도 테스트 (동일 네트워크에서 로컬 IP 사용)

## 📚 다음 단계

- [Docker 가이드](DOCKER.md) - Docker를 사용한 개발 및 배포
- [배포 가이드](DEPLOYMENT.md) - 프로덕션 환경 배포
- [아키텍처](ARCHITECTURE.md) - 프로젝트 구조 및 설계 이해
