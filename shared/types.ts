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

// 방 정보 (간단한 버전)
export interface RoomInfo {
  id: string;
  name: string;
  userCount: number;
  maxUsers: number;
  gameState: GameState;
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

export interface GameUpdateEvent {
  roomId: string;
  gameState: GameState;
  result?: GameResult;
}

export interface UserUpdateEvent {
  roomId: string;
  user: User;
  action: 'joined' | 'left' | 'updated' | 'card_selected';
}

export interface RevealCountdownEvent {
  roomId: string;
  remainingTime: number; // 남은 시간 (초)
  isStarted: boolean;    // 카운트다운 시작 여부
}

// 통계 타입
export interface GameStats {
  totalRooms: number;
  totalUsers: number;
  activeRooms: number;
  averageUsersPerRoom: number;
} 