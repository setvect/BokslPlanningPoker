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

### 스크린샷
- 메인화면
![pic1.png](docs/images/pic1.png)

- 카드 선택
![pic2.png](docs/images/pic2.png)

- 결과 보기
![pic3.png](docs/images/pic3.png)

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

## 🚀 빠른 시작

### 로컬 개발 환경

```bash
# 의존성 설치 및 개발 서버 실행
# 서버 (터미널 1)
cd server
npm install
npm run dev

# 클라이언트 (터미널 2)
cd client
npm install
npm run dev
```

### Docker로 실행

```bash
# Docker Compose 사용
docker-compose up

# 또는 Docker 빌드 후 실행
docker build -t boksl-planning-poker .
docker run -p 3000:3000 boksl-planning-poker
```

## 📖 문서

- 📘 **[시작하기](docs/GETTING_STARTED.md)** - 로컬 개발 환경 설정 및 빌드 가이드
- 🐳 **[Docker 가이드](docs/DOCKER.md)** - Docker 설정, 빌드, 배포 방법
- 🚀 **[배포 가이드](docs/DEPLOYMENT.md)** - nginx + SSL 설정 및 프로덕션 배포
- 🏗️ **[아키텍처](docs/ARCHITECTURE.md)** - 프로젝트 구조 및 설계 문서

## 📁 프로젝트 구조

```
BokslPlanningPoker/
├── server/          # 백엔드 (Express + Socket.io)
├── client/          # 프론트엔드 (React + Vite)
├── shared/          # 공통 타입 및 상수
├── scripts/         # 빌드 및 배포 스크립트
├── docs/            # 프로젝트 문서
├── Dockerfile       # Docker 빌드 설정
└── docker-compose.yml  # Docker Compose 설정
```

## 🤝 지원

문제가 있거나 기능 제안이 있으시면 [Issues](../../issues)를 열어주세요.

---

⭐ 이 프로젝트가 도움이 되었다면 스타를 눌러주세요!
