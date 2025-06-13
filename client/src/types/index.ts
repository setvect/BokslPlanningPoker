// shared 타입들을 재export (코드 간소화)
export type {
  PlanningPokerCard,
  User,
  Room,
  GameState,
  GameResult,
  ErrorInfo,
  ApiResponse
} from '../../../shared/types';

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

// 테마 타입
export type Theme = 'light' | 'dark'; 