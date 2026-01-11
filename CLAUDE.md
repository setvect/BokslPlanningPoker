# CLAUDE.md

이 파일은 Claude Code (claude.ai/code)가 이 저장소의 코드를 작업할 때 참고할 가이드를 제공합니다.

## 프로젝트 개요

복슬 플래닝 포커는 애자일 스프린트 플래닝을 위한 실시간 웹 기반 플래닝 포커 애플리케이션입니다. 프론트엔드는 React + TypeScript, 백엔드는 Node.js + Express + Socket.io로 구축되었으며, 클라이언트와 서버 간 타입 안전성을 위해 공유 타입 패키지를 사용합니다.

## 개발 명령어

### 로컬 개발 환경 (WSL/Linux)

```bash
# 서버 개발 (터미널 1)
cd server
npm install
npm run dev

# 클라이언트 개발 (터미널 2)
cd client
npm install
npm run dev

# 타입 검사
cd client && npm run type-check
cd server && npm run type-check

# 린트 검사
cd client && npm run lint
cd server && npm run lint

# 프로덕션 빌드
cd client && npm run build
cd server && npm run build
```

### Docker 개발

```bash
# 개발 환경 실행 (핫 리로드 지원)
./scripts/dev.sh

# 프로덕션 빌드 및 실행
docker build -t boksl-planning-poker .
docker run -p 3000:3000 boksl-planning-poker

# Docker Compose 사용
docker-compose up
docker-compose down

# 로그 확인
docker-compose logs -f
```

## 아키텍처

### 모노레포 구조

프로젝트는 3개 패키지로 구성된 모노레포 패턴을 따릅니다:

- **`server/`**: 백엔드 서버 (Express + Socket.io)
- **`client/`**: 프론트엔드 앱 (React + Vite)
- **`shared/`**: 공유 타입, 상수, Socket.io 이벤트 정의

이 아키텍처는 클라이언트-서버 경계를 넘어 타입 안전성을 보장합니다. `shared/` 디렉토리는 클라이언트와 서버 모두에서 상대 경로 import로 직접 참조됩니다.

### 실시간 통신 패턴

Socket.io는 요청-응답-브로드캐스트 패턴으로 모든 실시간 기능을 제공합니다:

1. **클라이언트 요청**: 사용자 액션이 콜백과 함께 socket emit을 트리거
2. **서버 처리**: 서버가 검증하고 상태를 업데이트한 후 콜백 응답 전송
3. **서버 브로드캐스트**: 서버가 모든 방 참여자에게 업데이트 브로드캐스트

카드 선택의 예시 흐름:
```typescript
// 클라이언트: Optimistic update → 서버 요청
selectCard(card) → socket.emit('select_card', {roomId, card}, callback)
// 서버: 처리 → 콜백 → 브로드캐스트
→ 검증 → 방 상태 업데이트 → callback(success) → io.to(roomId).emit('user_update')
```

### 상태 관리 전략

**클라이언트 상태 (useGame 훅)**:
- 카드 선택 시 즉각적인 UI 피드백을 위해 **Optimistic Update** 사용
- 사용자 액션을 즉시 반영하는 로컬 상태 유지
- Socket.io 이벤트를 통해 서버와 동기화
- 서버 에러 시 롤백
- 재연결 복원력을 위해 localStorage에 카드 선택 정보 저장

**서버 상태 (인메모리)**:
- 데이터베이스 없음 - 모든 상태는 Map을 사용하여 메모리에 저장
- O(1) 사용자 조회를 위한 `Map<userId, User>`를 가진 `Room` 객체
- 비활성 방 자동 정리 (1시간 타임아웃)
- 클라이언트 전송 시 Map을 Array로 직렬화

### 주요 아키텍처 패턴

1. **공유 타입 정의**: 모든 Socket.io 이벤트 페이로드와 응답은 `shared/types.ts`에 타입이 정의되어 클라이언트와 서버 모두에서 사용됨

2. **이벤트 주도 아키텍처**: Socket.io 이벤트는 `shared/socket-events.ts`에 SCREAMING_SNAKE_CASE 네이밍으로 정의됨

3. **커스텀 React 훅**:
   - `useSocket`: Socket 연결 생명주기, 이벤트 리스너, 액션 메서드
   - `useGame`: 게임 상태 관리, 비즈니스 로직, localStorage 통합
   - `useTheme`: 시스템 선호도 감지와 함께 다크/라이트 모드

4. **모바일 최적화**:
   - Page Visibility API로 앱 백그라운드 전환 처리
   - 연결 복구를 위한 네트워크 상태 리스너
   - 불안정한 모바일 네트워크를 위한 확장된 핑 타임아웃
   - 설정 가능한 재연결 전략

## 중요 구현 세부사항

### 게임 상태 머신

```
SELECTING → REVEALED → [reset] → SELECTING
```

- **SELECTING**: 사용자가 카드를 선택 (다른 사람에게는 숨김)
- **REVEALED**: 모든 카드 공개, 평균값 계산 (숫자 카드만)
- SELECTING과 REVEALED 상태 모두에서 카드 변경 가능

### 카드 덱 및 계산

카드: `['0', '1/2', '1', '2', '3', '5', '8', '13', '20', '40', '60', '100', '?', '커피']`

평균값 계산:
- 숫자 카드만 포함 (`'?'`와 `'커피'` 제외)
- `'1/2'`는 `0.5`로 변환
- 결과는 소수점 2자리까지 반올림

### localStorage 통합

페이지 새로고침 시에도 카드 선택 정보가 유지됨:
- 키: `${STORAGE_KEYS.SELECTED_CARD}_${roomId}`
- 카드 선택 시 저장
- 방 재참여 시 복원
- 라운드 리셋 또는 방 나가기 시 삭제

### 사용자 이름 처리

중복 이름은 자동으로 번호가 부여됨: `복슬이` → `복슬이(2)` → `복슬이(3)`

구현 위치: [server/src/models/User.ts](server/src/models/User.ts)

### Socket 연결 관리

**재연결 전략**:
- 자동 재연결: 5회 시도
- 재연결 지연: 기본 2초, 최대 10초
- 전송 방식: WebSocket 우선, polling 폴백
- 모바일 최적화된 핑 간격 (25초/60초 타임아웃)

**모바일 복원력**:
- Visibility API로 앱 백그라운드/포그라운드 감지
- 네트워크 온라인/오프라인 이벤트 핸들러
- 가시성 변경 시 수동 재연결 트리거

## 파일 구성 규칙

- 모든 TypeScript 파일은 `.ts` 확장자와 함께 상대 경로 import 사용
- 서버 측 모델은 `server/src/models/` (Game, Room, User)
- Socket 핸들러는 `server/src/socket/handlers.ts`
- React 컴포넌트는 `client/src/components/`
- 커스텀 훅은 `client/src/hooks/`
- Socket 이벤트는 반드시 `shared/socket-events.ts`에 정의
- 타입은 반드시 `shared/types.ts`에 정의

## 코드 스타일 가이드라인

### .cursorrules에서 가져온 규칙

1. **파일 경로**: 파일 편집/생성 시 항상 전체 절대 경로 사용
2. **코드 블록**: 한 줄 구문도 명시적 블록 문법 사용:
   ```typescript
   // ✅ 좋음
   if (user) {
     return user.name;
   }

   // ❌ 피할 것
   if (user) return user.name;
   ```
3. **주석 및 에러**: 한국어로 작성
4. **Socket.io 패턴**: 모든 이벤트는 에러 처리와 함께 콜백 패턴 사용
5. **TypeScript**: `any` 타입 최소화, 공유 타입 정의 사용

### 엘론 머스크의 효율성 알고리즘

개발 전반에 적용 (.cursorrules에서):
1. 모든 요구 사항을 비판적으로 질문
2. 불필요한 부분 삭제
3. 남은 구성 요소 단순화 및 최적화
4. 사이클 타임 가속화
5. 자동화는 마지막 단계로

## 흔한 실수

1. **Map vs Array 직렬화**: 서버는 내부적으로 `Map<string, User>`를 사용하지만 Socket.io를 통해 전송 시 배열로 변환해야 함 (JSON은 Map을 지원하지 않음)

2. **Optimistic Update 경쟁 조건**: 클라이언트는 자신의 카드 선택에 대한 서버 에코를 무시해야 UI 깜빡임을 방지할 수 있음

3. **Socket 이벤트 정리**: socket 리스너 등록 시 `useEffect`에서 항상 cleanup 함수 반환

4. **재연결 상태**: socket 연결 해제 시 방 상태를 지우지 말 것 - 재연결로 세션 복원 가능하도록

5. **CORS 설정**: Socket.io CORS origins은 개발/프로덕션 환경에 따라 다름 ([server/src/index.ts:16-28](server/src/index.ts#L16-L28) 참고)

## 배포

이 프로젝트는 여러 전략으로 Docker를 사용하여 배포합니다:

- **개발**: `./scripts/dev.sh` (핫 리로드 활성화)
- **프로덕션 로컬**: `./scripts/build.sh` → `docker-compose up`
- **프로덕션 Docker Hub**: `./scripts/deploy-dockerhub.sh` (레지스트리에 푸시)
- **프로덕션 오프라인**: `./scripts/deploy-offline.sh` (이미지 파일 생성)
- **nginx + SSL**: `./scripts/setup-nginx-ssl.sh` (Let's Encrypt를 사용한 리버스 프록시)

프로덕션 빌드는 SPA 라우팅을 지원하며 `server/public/`에서 정적 클라이언트 파일을 제공합니다.

## 테스트 및 검증

현재 자동화된 테스트는 없습니다. 수동 테스트 워크플로:

1. 여러 브라우저 창/기기로 테스트
2. 카드 선택 동기화 확인
3. 네트워크 토글로 재연결 테스트
4. 모바일 동작 확인 (백그라운드/포그라운드 전환)
5. 다크 모드 테마 전환 확인
6. 다양한 카드 조합으로 평균값 계산 검증
7. 방 최대 인원 및 중복 이름 처리 테스트

## 핵심 파일 참조

- **Socket 이벤트 정의**: [shared/socket-events.ts](shared/socket-events.ts)
- **타입 정의**: [shared/types.ts](shared/types.ts)
- **서버 엔트리 포인트**: [server/src/index.ts](server/src/index.ts)
- **Socket 핸들러**: [server/src/socket/handlers.ts](server/src/socket/handlers.ts)
- **게임 로직**: [server/src/models/Game.ts](server/src/models/Game.ts)
- **클라이언트 Socket 훅**: [client/src/hooks/useSocket.ts](client/src/hooks/useSocket.ts)
- **클라이언트 Game 훅**: [client/src/hooks/useGame.ts](client/src/hooks/useGame.ts)
- **메인 React 앱**: [client/src/App.tsx](client/src/App.tsx)
