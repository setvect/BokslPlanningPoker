# 복슬 플래닝 포커 (Boksl Planning Poker)

🎯 **웹 기반 애자일 스프린트 플래닝 도구**

**거의 모든 설계 및 코딩을 [Cursor AI](https://www.cursor.com/)를 이용해 만들었음**

## 📋 프로젝트 개요

최소한의 기능을 가진 실시간 플래닝 포커 웹 애플리케이션입니다.
- 🚀 **간단한 설정**: 로그인 없이 바로 사용 가능
- 🔄 **실시간 동기화**: 웹소켓 기반 실시간 카드 선택 및 결과 공유
- 📱 **반응형 디자인**: 모바일, 태블릿, 데스크톱 모든 기기 지원
- 🌓 **다크모드 지원**: 라이트/다크 테마 자동 전환 및 수동 토글

## ✨ 주요 기능

- **방 생성/입장**: 방 이름으로 간단하게 생성 및 입장
- **카드 선택**: 피보나치 수열 기반 포인트 카드 (0, 1/2, 1, 2, 3, 5, 8, 13, 20, 40, 60, 100, ?, 커피)
- **실시간 동기화**: 모든 참여자의 선택 상태 실시간 표시
- **자동 평균 계산**: 숫자 카드만으로 평균값 자동 계산
- **라운드 관리**: 새로운 스토리를 위한 카드 리셋
- **테마 지원**: 라이트/다크 모드 지원 및 시스템 설정 자동 감지
- **바둑판식 레이아웃**: 참여자가 많아도 깔끔한 카드 배치
- **접근성**: 키보드 네비게이션, 스크린 리더 지원

## 🛠 기술 스택

### 백엔드
- **Node.js** + **TypeScript**
- **Express.js** - 웹 서버 프레임워크
- **Socket.io** - 실시간 웹소켓 통신

### 프론트엔드
- **React 18** + **TypeScript**
- **Vite** - 빌드 도구
- **Tailwind CSS** - 스타일링 (다크모드 지원)
- **Socket.io-client** - 실시간 통신

### 배포
- **Docker** - 컨테이너화
- **fly.io** - 호스팅

## 🚀 빠른 시작

### Docker Compose로 실행 (권장)

```powershell
# 1. 프로젝트 클론
git clone https://github.com/setvect/BokslPlanningPoker.git
Set-Location BokslPlanningPoker

# 2. Docker Compose로 실행
docker-compose up --build

# 3. 브라우저에서 접속
# - 클라이언트: http://localhost:5173
# - 서버 API: http://localhost:3001

# 4. 백그라운드에서 실행하려면
docker-compose up -d --build

# 5. 중지
docker-compose down
```

### 로컬 개발 환경

```powershell
# 1. 의존성 설치
# 서버
Set-Location server
npm install
Set-Location ..

# 클라이언트  
Set-Location client
npm install
Set-Location ..

# 2. 개발 서버 실행
# 서버 (터미널 1)
Set-Location server
npm run dev

# 클라이언트 (터미널 2)
Set-Location client  
npm run dev
```

### 프로덕션 빌드

```powershell
# 클라이언트 빌드
Set-Location client
npm run build

# 서버 빌드
Set-Location server
npm run build

# 프로덕션 서버 실행
npm start
```

## 📁 프로젝트 구조

```
BokslPlanningPoker/
├── server/          # 백엔드 (Express + Socket.io)
│   ├── src/
│   │   ├── index.ts       # 서버 엔트리포인트
│   │   ├── socket/        # Socket.io 이벤트 핸들러
│   │   ├── models/        # 데이터 모델 (User, Room, Game)
│   │   └── utils/         # 유틸리티 함수
│   └── package.json
├── client/          # 프론트엔드 (React + Vite)
│   ├── src/
│   │   ├── App.tsx        # 메인 애플리케이션
│   │   ├── components/    # React 컴포넌트
│   │   ├── hooks/         # 커스텀 훅 (useSocket, useGame, useTheme)
│   │   ├── types/         # 클라이언트 타입
│   │   └── styles/        # 글로벌 스타일 (다크모드 포함)
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js # 다크모드 설정 포함
├── shared/          # 공통 타입 및 상수
│   ├── types.ts           # 데이터 타입 정의
│   ├── socket-events.ts   # Socket.io 이벤트 정의
│   ├── constants.ts       # 게임 설정 상수
│   └── index.ts           # 통합 export
├── docs/            # 프로젝트 문서
├── Dockerfile       # 배포용 Docker 이미지
└── docker-compose.yml
```

## 📖 문서

- [기능 요구사항](./docs/기능요구사항.md)
- [기술 스택 상세](./docs/기술스택.md)
- [구현 단계](./docs/구현단계.md)

## 🔧 개발

### 빌드 스크립트

**Unix/Linux/MacOS:**
```bash
# 클라이언트 빌드
cd client && npm run build

# 서버 빌드
cd server && npm run build

# 타입 검사
cd client && npm run type-check
cd server && npm run type-check

# 코드 품질 검사 (ESLint)
cd client && npm run lint
cd server && npm run lint
```

**Windows PowerShell:**
```powershell
# 클라이언트 빌드
cd client
npm run build
cd ..

# 서버 빌드
cd server
npm run build
cd ..

# 타입 검사
cd client
npm run type-check
cd ..
cd server
npm run type-check
cd ..

# 코드 품질 검사 (ESLint)
cd client
npm run lint
cd ..
cd server
npm run lint
cd ..
```

## 🐳 Docker 이미지 빌드

### 개별 프로젝트 빌드

**Windows PowerShell:**
```powershell
# 클라이언트 빌드
cd client
npm install
npm run build
cd ..

# 서버 빌드
cd server
npm install
npm run build
cd ..
```

### Docker 이미지 빌드

```powershell
# Docker Desktop 상태 확인
docker --version
docker info

# 프로덕션 이미지 빌드 (루트 디렉토리에서)
docker build -t planning-poker:latest .

# 또는 버전 태그 포함
docker build -t planning-poker:1.0.0 .
```

### Docker Compose 사용

```powershell
# 개발 환경 실행
docker-compose up

# 백그라운드에서 실행
docker-compose up -d

# 프로덕션 프로파일 실행
docker-compose --profile production up

# 컨테이너 중지
docker-compose down
```

### 빌드된 이미지 실행

```powershell
# 이미지 실행
docker run -p 3001:3001 planning-poker:latest

# 백그라운드에서 실행
docker run -d -p 3001:3001 --name planning-poker-app planning-poker:latest

# 실행 중인 컨테이너 확인
docker ps

# 컨테이너 중지 및 삭제
docker stop planning-poker-app
docker rm planning-poker-app
```

### 이미지 관리

```powershell
# 이미지 목록 확인
docker images

# 이미지 삭제
docker rmi planning-poker:latest

# 사용하지 않는 이미지 정리
docker image prune
```

### 주요 기능

- **실시간 통신**: Socket.io를 통한 양방향 실시간 데이터 동기화
- **반응형 UI**: 모바일부터 데스크톱까지 최적화된 사용자 경험
- **다크모드**: 시스템 설정 자동 감지 및 수동 토글 지원
- **접근성**: WCAG 가이드라인 준수, 키보드 네비게이션 지원
- **커스텀 스크롤바**: 테마에 맞는 스크롤바 스타일링

## 📝 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 🤝 지원

문제가 있거나 기능 제안이 있으시면 [Issues](../../issues)를 열어주세요.

---

⭐ 이 프로젝트가 도움이 되었다면 스타를 눌러주세요! 