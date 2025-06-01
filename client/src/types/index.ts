// 플래닝 포커 카드 타입 (임시)
export const PLANNING_POKER_CARDS = [
  '0', '1/2', '1', '2', '3', '5', '8', '13', 
  '20', '40', '60', '100', '?', '커피'
] as const;

export type PlanningPokerCard = typeof PLANNING_POKER_CARDS[number];

// 게임 상태
export enum GameState {
  SELECTING = 'selecting',
  REVEALED = 'revealed',
  FINISHED = 'finished'
}

// 사용자 타입 (클라이언트용 간소화)
export interface User {
  id: string;
  name: string;
  selectedCard?: PlanningPokerCard;
  isConnected: boolean;
}

// 방 타입 (클라이언트용 간소화)
export interface Room {
  id: string;
  name: string;
  users: User[];
  gameState: GameState;
  maxUsers: number;
}

// 게임 결과
export interface GameResult {
  totalUsers: number;
  votedUsers: number;
  cards: { [userId: string]: PlanningPokerCard };
  average: number | null;
  validVotes: number;
}

// 컴포넌트 props 타입들
export interface MainPageProps {
  onCreateRoom: (roomName: string) => void;
  onJoinRoom: (roomId: string, roomName: string) => void;
}

export interface JoinRoomProps {
  roomId: string;
  roomName: string;
  onBack: () => void;
  onJoin: (userName: string) => void;
}

export interface GameRoomProps {
  roomId: string;
  roomName: string;
  userName: string;
  onLeave: () => void;
}

// 앱 상태 타입
export type AppState = 'main' | 'join' | 'game';

// 에러 타입
export interface ErrorInfo {
  code: string;
  message: string;
  details?: any;
}

// API 응답 타입
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
} 