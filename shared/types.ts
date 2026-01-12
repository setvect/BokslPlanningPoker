// 플래닝 포커 카드 타입
export const PLANNING_POKER_CARDS = [
  '0', '1/2', '1', '2', '3', '5', '8', '13', 
  '20', '40', '60', '100', '?', '커피'
] as const;

export type PlanningPokerCard = typeof PLANNING_POKER_CARDS[number];

// 사용자 타입
export interface User {
  id: string;
  name: string;
  originalName: string;
  roomId: string;
  selectedCard?: PlanningPokerCard;
  isConnected: boolean;
  joinedAt: string; // ISO string으로 직렬화
  lastActivity: string; // ISO string으로 직렬화
}

// 방 타입
export interface Room {
  id: string;
  name: string;
  users: User[]; // Map 대신 배열로 직렬화
  gameState: GameState;
  createdAt: string;
  lastActivity: string;
  maxUsers: number;
}

// 게임 상태
export enum GameState {
  SELECTING = 'selecting',
  REVEALED = 'revealed',
  FINISHED = 'finished'
}

// 게임 결과
export interface GameResult {
  totalUsers: number;
  votedUsers: number;
  cards: { [userId: string]: PlanningPokerCard };
  average: number | null;
  validVotes: number;
}

// API 응답 타입
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 에러 타입
export interface ErrorInfo {
  code: string;
  message: string;
  details?: any;
}

// Socket.io 이벤트 페이로드 타입들
export interface JoinRoomPayload {
  roomId: string;
  userName: string;
}

export interface CreateRoomPayload {
  roomName: string;
  userName: string;
  maxUsers?: number;
}

export interface SelectCardPayload {
  roomId: string;
  card: PlanningPokerCard;
}

export interface RevealCardsPayload {
  roomId: string;
}

export interface ResetRoundPayload {
  roomId: string;
}

export interface UpdateUserNamePayload {
  roomId: string;
  newName: string;
}

export interface UpdateRoomNamePayload {
  newName: string;
}

// Socket.io 이벤트 응답 타입들
export interface JoinRoomResponse {
  success: boolean;
  room?: Room;
  user?: User;
  error?: ErrorInfo;
}

export interface CreateRoomResponse {
  success: boolean;
  room?: Room;
  user?: User;
  error?: ErrorInfo;
}

export interface CardSelectionResponse {
  success: boolean;
  user?: User;
  result?: GameResult;
  error?: ErrorInfo;
}

// 실시간 업데이트 이벤트 타입들
export interface RoomUpdateEvent {
  room: Room;
  type: 'user_joined' | 'user_left' | 'user_updated' | 'game_state_changed';
  user?: User;
}

export interface UserUpdateEvent {
  roomId: string;
  user: User;
  action: 'joined' | 'left' | 'updated' | 'card_selected';
}

export interface GameUpdateEvent {
  roomId: string;
  gameState: GameState;
  result?: GameResult;
}

// 카운트다운 이벤트 타입 (실제 사용되는 것만)
export interface RevealCountdownEvent {
  roomId: string;
  remainingTime: number;
  isStarted: boolean;
}

// ======================================
// 타자 게임 타입 정의
// ======================================

// 타자 게임 상태
export enum TypingGameState {
  WAITING = 'waiting',      // 대기 중 (참가자 모집 또는 라운드 간 휴식)
  COUNTDOWN = 'countdown',  // 카운트다운
  PLAYING = 'playing',      // 게임 진행 중
  ROUND_END = 'round_end'   // 라운드 종료
}

// 타자 문장
export interface TypingSentence {
  id: string;
  text: string;                         // 원본 문장
  displayText: string;                  // 특수문자가 포함된 표시용 문장
  language: 'ko' | 'en' | 'mixed';      // 언어
  length: number;                       // 문자 수
}

// 타자 게임 참가자
export interface TypingPlayer {
  id: string;
  name: string;
  originalName: string;
  roomId: string;
  isConnected: boolean;
  joinedAt: string;
  lastActivity: string;

  // 타자 게임 전용
  currentInput: string;        // 현재 입력 중인 텍스트
  progress: number;            // 진행률 (0-100)
  isFinished: boolean;         // 완료 여부
  finishedAt: string | null;   // 완료 시간 (ISO string)
  rank: number | null;         // 순위
  isSpectator: boolean;        // 관전자 여부 (중도 참가 시)
}

// 타자 게임방
export interface TypingRoom {
  id: string;
  name: string;
  players: TypingPlayer[];      // 참가자 목록
  gameState: TypingGameState;
  createdAt: string;
  lastActivity: string;
  maxPlayers: number;

  // 게임 진행 정보
  currentSentence: TypingSentence | null;
  roundNumber: number;
  countdownRemaining: number | null;
  roundStartedAt: string | null;
  firstFinisherId: string | null;
  firstFinishedAt: string | null;
  lastSentenceId: string | null;  // 연속 문장 방지용
}

// 라운드 결과
export interface TypingRoundResult {
  roundNumber: number;
  sentence: TypingSentence;
  rankings: TypingPlayerRanking[];
  startedAt: string;
  endedAt: string;
}

// 참가자별 순위 정보
export interface TypingPlayerRanking {
  playerId: string;
  playerName: string;
  rank: number;
  finishedAt: string | null;
  timeMs: number | null;         // 완료까지 걸린 시간 (ms)
  isFinished: boolean;
}

// ======================================
// 타자 게임 Socket.io 페이로드 타입
// ======================================

// 타자 게임 방 생성
export interface CreateTypingRoomPayload {
  roomName: string;
  playerName: string;
}

export interface CreateTypingRoomResponse {
  success: boolean;
  data?: {
    room: TypingRoom;
    playerId: string;
  };
  error?: ErrorInfo;
}

// 타자 게임 방 참여
export interface JoinTypingRoomPayload {
  roomId: string;
  playerName: string;
}

export interface JoinTypingRoomResponse {
  success: boolean;
  data?: {
    room: TypingRoom;
    playerId: string;
    isSpectator: boolean;
  };
  error?: ErrorInfo;
}

// 타자 게임 방 나가기
export interface LeaveTypingRoomPayload {
  roomId: string;
}

// 게임 시작
export interface StartTypingGamePayload {
  roomId: string;
}

export interface StartTypingGameResponse {
  success: boolean;
  error?: ErrorInfo;
}

// 타이핑 입력 업데이트
export interface TypingInputPayload {
  roomId: string;
  input: string;
}

export interface TypingInputResponse {
  success: boolean;
  isFinished?: boolean;
  error?: ErrorInfo;
}

// 타이핑 완료 (Enter 키)
export interface TypingSubmitPayload {
  roomId: string;
}

export interface TypingSubmitResponse {
  success: boolean;
  data?: {
    rank: number;
    timeMs: number;
  };
  error?: ErrorInfo;
}

// ======================================
// 타자 게임 실시간 업데이트 이벤트 타입
// ======================================

// 타자 게임 방 목록
export interface TypingRoomListItem {
  id: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
  gameState: TypingGameState;
  roundNumber: number;
}

// 타자 게임 방 업데이트
export interface TypingRoomUpdateEvent {
  room: TypingRoom;
  type: 'player_joined' | 'player_left' | 'player_updated' | 'game_state_changed';
  player?: TypingPlayer;
}

// 타자 게임 카운트다운
export interface TypingCountdownEvent {
  roomId: string;
  count: number;
  type: 'game_start' | 'finish' | 'next_round';
}

// 라운드 시작 (문장 제시)
export interface TypingRoundStartEvent {
  roomId: string;
  sentence: TypingSentence;
  roundNumber: number;
  startedAt: string;
}

// 다른 플레이어 진행 상황
export interface TypingProgressEvent {
  roomId: string;
  playerId: string;
  playerName: string;
  currentInput: string;
  progress: number;
  isFinished: boolean;
}

// 1등 완료
export interface TypingFirstFinishEvent {
  roomId: string;
  playerId: string;
  playerName: string;
  timeMs: number;
  countdownSeconds: number;
}

// 플레이어 완료
export interface TypingPlayerFinishEvent {
  roomId: string;
  playerId: string;
  playerName: string;
  rank: number;
  timeMs: number;
}

// 라운드 종료
export interface TypingRoundEndEvent {
  roomId: string;
  result: TypingRoundResult;
  nextRoundIn: number;
} 