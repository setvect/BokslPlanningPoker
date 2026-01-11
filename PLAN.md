# 타자 게임 구현 계획

## 개요
플래닝 포커 서비스에 온라인 타자 게임 기능을 추가합니다.
기존 코드베이스의 아키텍처 패턴을 그대로 활용하여 일관성을 유지합니다.

## 게임 상태 머신
```
WAITING → COUNTDOWN → PLAYING → ROUND_END → WAITING → COUNTDOWN → PLAYING → ...
```

## 구현 순서

### Phase 1: shared 패키지 (기반 작업)
1. `shared/types.ts` - 타자 게임 타입 정의
2. `shared/socket-events.ts` - Socket 이벤트 상수
3. `shared/constants.ts` - 게임 설정 상수
4. `shared/data/typing-sentences.json` - 문장 데이터

### Phase 2: 서버 구현
1. `server/src/models/TypingPlayer.ts` - 플레이어 모델
2. `server/src/models/TypingRoom.ts` - 방 모델
3. `server/src/models/TypingGame.ts` - 게임 로직
4. `server/src/socket/typing-handlers.ts` - Socket 핸들러
5. `server/src/index.ts` 수정 - 핸들러 등록

### Phase 3: 클라이언트 훅
1. `client/src/hooks/useTypingSocket.ts` - Socket 통신
2. `client/src/hooks/useTypingGame.ts` - 게임 상태 관리

### Phase 4: 클라이언트 컴포넌트
1. `client/src/components/typing/TypingInput.tsx` - 타이핑 입력
2. `client/src/components/typing/TypingSentenceDisplay.tsx` - 문장 표시
3. `client/src/components/typing/TypingPlayerProgress.tsx` - 참가자 진행 상황
4. `client/src/components/typing/TypingCountdown.tsx` - 카운트다운
5. `client/src/components/typing/TypingRanking.tsx` - 순위 표시
6. `client/src/components/typing/TypingGameRoom.tsx` - 게임방 전체 레이아웃
7. `client/src/components/typing/TypingMainSection.tsx` - 메인 화면 섹션
8. `client/src/components/typing/TypingRoomList.tsx` - 방 목록
9. `client/src/components/typing/TypingJoinRoom.tsx` - 방 참가

### Phase 5: 통합
1. `client/src/components/MainPage.tsx` 수정
2. `client/src/App.tsx` 라우팅 추가

### Phase 6: 검증
1. 타입 검사 (npm run type-check)
2. 린트 검사 (npm run lint)
3. 수동 테스트

## 주요 고려사항

### 한글 입력 처리
- IME 조합 중인 글자는 오타 체크에서 제외
- compositionstart/compositionend 이벤트 활용

### 복사/붙여넣기 방지
- onPaste 이벤트에서 preventDefault
- 서버에서 한 번에 3글자 이상 증가 감지

### 실시간 동기화
- 입력 전송 빈도 조절 (throttle)
- 다른 플레이어 진행 상황 브로드캐스트

### 중도 참가 처리
- 게임 중 참여 시 isSpectator: true
- 다음 라운드부터 자동 참가
