# 복슬 플래닝 포커 (Boksl Planning Poker)

🎯 **웹 기반 애자일 스프린트 플래닝 도구**

**거의 모든 설계 및 코딩을 [Cursor AI](https://www.cursor.com/)를 이용해 만들었음**

## 📋 프로젝트 개요

최소한의 기능을 가진 실시간 플래닝 포커 웹 애플리케이션입니다.
- 🚀 **간단한 설정**: 로그인 없이 바로 사용 가능
- 🔄 **실시간 동기화**: 웹소켓 기반 실시간 카드 선택 및 결과 공유
- 📱 **반응형 디자인**: 모바일, 태블릿, 데스크톱 모든 기기 지원

## ✨ 주요 기능

- **방 생성/입장**: 방 이름으로 간단하게 생성 및 입장
- **카드 선택**: 피보나치 수열 기반 포인트 카드 (0, 1/2, 1, 2, 3, 5, 8, 13, 20, 40, 60, 100, ?, 커피)
- **실시간 동기화**: 모든 참여자의 선택 상태 실시간 표시
- **자동 평균 계산**: 숫자 카드만으로 평균값 자동 계산
- **라운드 관리**: 새로운 스토리를 위한 카드 리셋

## 🛠 기술 스택

### 백엔드
- **Node.js** + **TypeScript**
- **Express.js** - 웹 서버 프레임워크
- **Socket.io** - 실시간 웹소켓 통신

### 프론트엔드
- **React 18** + **TypeScript**
- **Vite** - 빌드 도구
- **Tailwind CSS** - 스타일링
- **Socket.io-client** - 실시간 통신

### 배포
- **Docker** - 컨테이너화
- **fly.io** - 호스팅

## 🚀 빠른 시작

### 개발 환경 실행

```bash
# 저장소 클론
git clone <repository-url>
cd planning-poker

# Docker Compose로 전체 애플리케이션 실행
docker-compose up -dev

# 또는 개별 실행
# 백엔드 (터미널 1)
cd server
npm install
npm run dev

# 프론트엔드 (터미널 2)  
cd client
npm install
npm run dev
```

### 접속
- **프론트엔드**: http://localhost:5173
- **백엔드**: http://localhost:3001

## 📁 프로젝트 구조

```
planning-poker/
├── server/          # 백엔드 (Express + Socket.io)
├── client/          # 프론트엔드 (React + Vite)
├── shared/          # 공통 타입 및 상수
├── docs/            # 프로젝트 문서
├── Dockerfile       # 배포용 Docker 이미지
└── docker-compose.yml
```

## 📖 문서

- [기능 요구사항](./docs/기능요구사항.md)
- [기술 스택 상세](./docs/기술스택.md)

## 🔧 개발

### 스크립트

```bash
# 전체 프로젝트 빌드
npm run build

# 코드 품질 검사
npm run lint
npm run type-check

# 테스트
npm test
```

## 📝 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 🤝 지원

문제가 있거나 기능 제안이 있으시면 [Issues](../../issues)를 열어주세요.

---

⭐ 이 프로젝트가 도움이 되었다면 스타를 눌러주세요! 