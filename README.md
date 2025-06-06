# 복슬 플래닝 포커 (Boksl Planning Poker)

🎯 **웹 기반 애자일 스프린트 플래닝 도구**

**거의 모든 설계 및 코딩을 [Cursor AI](https://www.cursor.com/)를 이용해 만들었음**

## 1. 📋 프로젝트 개요

최소한의 기능을 가진 실시간 플래닝 포커 웹 애플리케이션입니다.
- 🚀 **간단한 설정**: 로그인 없이 바로 사용 가능
- 🔄 **실시간 동기화**: 웹소켓 기반 실시간 카드 선택 및 결과 공유
- 📱 **반응형 디자인**: 모바일, 태블릿, 데스크톱 모든 기기 지원
- 🌓 **다크모드 지원**: 라이트/다크 테마 자동 전환 및 수동 토글

## 2. ✨ 주요 기능

- **방 생성/입장**: 방 이름으로 간단하게 생성 및 입장
- **카드 선택**: 피보나치 수열 기반 포인트 카드 (0, 1/2, 1, 2, 3, 5, 8, 13, 20, 40, 60, 100, ?, 커피)
- **실시간 동기화**: 모든 참여자의 선택 상태 실시간 표시
- **자동 평균 계산**: 숫자 카드만으로 평균값 자동 계산
- **라운드 관리**: 새로운 스토리를 위한 카드 리셋
- **테마 지원**: 라이트/다크 모드 지원 및 시스템 설정 자동 감지
- **바둑판식 레이아웃**: 참여자가 많아도 깔끔한 카드 배치
- **접근성**: 키보드 네비게이션, 스크린 리더 지원

## 3. 🛠 기술 스택

### 3.1. 백엔드
- **Node.js** + **TypeScript**
- **Express.js** - 웹 서버 프레임워크
- **Socket.io** - 실시간 웹소켓 통신

### 3.2. 프론트엔드
- **React 18** + **TypeScript**
- **Vite** - 빌드 도구
- **Tailwind CSS** - 스타일링 (다크모드 지원)
- **Socket.io-client** - 실시간 통신

### 3.3. 개발 환경
- **WSL2 Ubuntu** - 윈도우에서 Linux 개발 환경
- **Docker** - 컨테이너화 (WSL2 백엔드)
- **VSCode Remote-WSL** - 통합 개발 환경

### 3.4. 배포
- **Docker** - 컨테이너화
- **fly.io** - 호스팅

## 4. 🚀 빠른 시작


### 4.1. 로컬 개발 환경 (WSL)

```bash
# 1. 의존성 설치
# 서버
cd server
npm install
cd ..

# 클라이언트  
cd client
npm install
cd ..

# 2. 개발 서버 실행
# 서버 (터미널 1)
cd server
npm run dev

# 클라이언트 (터미널 2)
cd client
npm run dev
```

### 4.2. 프로덕션 빌드

```bash
# 클라이언트 빌드
cd client
npm run build
cd ..

# 서버 빌드
cd server
npm run build

# 프로덕션 서버 실행
npm start
```

### 4.3. Docker를 이용한 빌드 및 실행

```bash
# 🐳 Docker 프로덕션 빌드
docker build -t boksl-planning-poker .

# 또는 빌드 스크립트 사용
./scripts/build.sh

# 🚀 Docker 컨테이너 실행
docker run -p 3000:3000 boksl-planning-poker

# 💡 포트 변경이 필요한 경우
docker run -p 8080:3000 boksl-planning-poker

# 📦 Docker Compose를 이용한 실행
docker-compose up

# 🛠️  Docker 개발 환경 (별도 스크립트)
./scripts/dev.sh

# 🔍 컨테이너 상태 확인
docker-compose ps

# 📜 로그 확인
docker-compose logs -f

# 🧹 정리
docker-compose down
```

### 4.4. 개발 도구 및 스크립트

```bash
# 타입 검사
cd client && npm run type-check && cd ..
cd server && npm run type-check && cd ..

# 코드 품질 검사 (ESLint)
cd client && npm run lint && cd ..
cd server && npm run lint && cd ..

# 전체 프로젝트 빌드 (한 번에)
(cd client && npm run build) && (cd server && npm run build)

# 전체 설치 및 빌드 (처음 설정 시)
(cd client && npm install && npm run build) && (cd server && npm install && npm run build)
```

## 5. 📁 프로젝트 구조

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
├── scripts/         # 빌드 및 배포 스크립트
│   ├── build.sh           # Docker 빌드 스크립트
│   ├── dev.sh             # 개발 환경 실행 스크립트
│   └── check-docker.sh    # Docker 환경 확인 스크립트
├── docs/            # 프로젝트 문서
├── Dockerfile       # Docker 빌드 설정
├── docker-compose.yml     # Docker Compose 설정
├── healthcheck.js   # 컨테이너 헬스체크
└── .dockerignore    # Docker 빌드 제외 파일
```

## 6. 🐳 Docker 배포

### 6.0. Docker 설정 (WSL2 환경)

**WSL2에서 Docker 명령어가 인식되지 않는 경우:**

1. **Docker Desktop WSL 통합 활성화 (권장)**
   ```
   1. Windows에서 Docker Desktop 실행
   2. Settings → Resources → WSL Integration
   3. ✅ Enable integration with my default WSL distro
   4. ✅ 사용 중인 WSL 배포판 (Ubuntu 등) 체크
   5. 🔄 Apply & Restart
   ```

2. **WSL 재시작 후 확인**
   ```bash
   # 새 터미널에서 확인
   docker --version
   docker-compose --version
   
   # Docker 환경 확인 스크립트 실행
   ./scripts/check-docker.sh
   ```

3. **대안: WSL 내 직접 설치**
   ```bash
   # Docker Engine 설치
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER
   newgrp docker
   ```

### 6.1. 프로덕션 배포

```bash
# 1. Docker 이미지 빌드
docker build -t boksl-planning-poker .

# 2. 컨테이너 실행
docker run -d \
  --name planning-poker \
  -p 3000:3000 \
  --restart unless-stopped \
  boksl-planning-poker

# 3. 또는 Docker Compose 사용
docker-compose up -d
```

### 6.2. 개발 환경

```bash
# 개발 환경 실행 (핫 리로드 지원)
./scripts/dev.sh

# 수동 실행
docker-compose --profile dev up --build
```

### 6.3. 모니터링

```bash
# 컨테이너 상태 확인
docker ps

# 로그 확인
docker logs planning-poker

# 컨테이너 접속
docker exec -it planning-poker sh

# 리소스 사용량 확인
docker stats planning-poker
```

## 7. 📖 문서

- [기능 요구사항](./docs/기능요구사항.md)
- [기술 스택 상세](./docs/기술스택.md)
- [구현 단계](./docs/구현단계.md)

## 8. 📝 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 9. 🤝 지원

문제가 있거나 기능 제안이 있으시면 [Issues](../../issues)를 열어주세요.

---

⭐ 이 프로젝트가 도움이 되었다면 스타를 눌러주세요! 