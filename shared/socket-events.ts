import {
  JoinRoomPayload,
  CreateRoomPayload,
  SelectCardPayload,
  RevealCardsPayload,
  ResetRoundPayload,
  UpdateUserNamePayload,
  UpdateRoomNamePayload,
  JoinRoomResponse,
  CreateRoomResponse,
  CardSelectionResponse,
  RoomUpdateEvent,
  GameUpdateEvent,
  UserUpdateEvent,
  ApiResponse,
  Room,
  GameStats
} from './types';

// Socket.io 이벤트 이름 상수
export const SOCKET_EVENTS = {
  // 연결 관련
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  RECONNECT: 'reconnect',
  CONNECT_ERROR: 'connect_error',
  
  // 방 관련 (클라이언트 → 서버)
  CREATE_ROOM: 'create_room',
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  GET_ROOM_INFO: 'get_room_info',
  GET_ROOM_LIST: 'get_room_list',
  
  // 게임 관련 (클라이언트 → 서버)
  SELECT_CARD: 'select_card',
  REVEAL_CARDS: 'reveal_cards',
  RESET_ROUND: 'reset_round',
  
  // 사용자 관련 (클라이언트 → 서버)
  UPDATE_USER_NAME: 'update_user_name',
  UPDATE_ROOM_NAME: 'update_room_name',
  GET_USER_INFO: 'get_user_info',
  
  // 실시간 업데이트 (서버 → 클라이언트)
  ROOM_UPDATE: 'room_update',
  GAME_UPDATE: 'game_update',
  USER_UPDATE: 'user_update',
  CARDS_REVEALED: 'cards_revealed',
  ROUND_RESET: 'round_reset',
  REVEAL_COUNTDOWN: 'reveal_countdown',
  
  // 에러 및 상태 (서버 → 클라이언트)
  ERROR: 'error',
  ROOM_FULL: 'room_full',
  ROOM_NOT_FOUND: 'room_not_found',
  INVALID_CARD: 'invalid_card',
  
  // 시스템 관련
  PING: 'ping',
  PONG: 'pong',
  GET_STATS: 'get_stats',
  
  // 테스트 및 디버깅
  DEBUG_ROOM_STATE: 'debug_room_state',
  DEBUG_USER_STATE: 'debug_user_state'
} as const;

// 서버에서 클라이언트로 보내는 이벤트 타입 맵
export interface ServerToClientEvents {
  // 방 관련 응답
  [SOCKET_EVENTS.ROOM_UPDATE]: (data: RoomUpdateEvent) => void;
  [SOCKET_EVENTS.GAME_UPDATE]: (data: GameUpdateEvent) => void;
  [SOCKET_EVENTS.USER_UPDATE]: (data: UserUpdateEvent) => void;
  [SOCKET_EVENTS.CARDS_REVEALED]: (data: GameUpdateEvent) => void;
  [SOCKET_EVENTS.ROUND_RESET]: (data: GameUpdateEvent) => void;
  
  // 에러 및 상태
  [SOCKET_EVENTS.ERROR]: (error: { code: string; message: string; details?: any }) => void;
  [SOCKET_EVENTS.ROOM_FULL]: (data: { roomId: string; maxUsers: number }) => void;
  [SOCKET_EVENTS.ROOM_NOT_FOUND]: (data: { roomId: string }) => void;
  [SOCKET_EVENTS.INVALID_CARD]: (data: { card: string; validCards: string[] }) => void;
  
  // 시스템
  [SOCKET_EVENTS.PONG]: () => void;
  
  // 디버깅
  [SOCKET_EVENTS.DEBUG_ROOM_STATE]: (data: any) => void;
  [SOCKET_EVENTS.DEBUG_USER_STATE]: (data: any) => void;
}

// 클라이언트에서 서버로 보내는 이벤트 타입 맵
export interface ClientToServerEvents {
  // 방 관련
  [SOCKET_EVENTS.CREATE_ROOM]: (
    data: CreateRoomPayload, 
    callback: (response: CreateRoomResponse) => void
  ) => void;
  [SOCKET_EVENTS.JOIN_ROOM]: (
    data: JoinRoomPayload, 
    callback: (response: JoinRoomResponse) => void
  ) => void;
  [SOCKET_EVENTS.LEAVE_ROOM]: (
    data: { roomId: string }, 
    callback: (response: ApiResponse) => void
  ) => void;
  [SOCKET_EVENTS.GET_ROOM_INFO]: (
    data: { roomId: string }, 
    callback: (response: ApiResponse<Room>) => void
  ) => void;
  [SOCKET_EVENTS.GET_ROOM_LIST]: (
    callback: (response: ApiResponse<Room[]>) => void
  ) => void;
  
  // 게임 관련
  [SOCKET_EVENTS.SELECT_CARD]: (
    data: SelectCardPayload, 
    callback: (response: CardSelectionResponse) => void
  ) => void;
  [SOCKET_EVENTS.REVEAL_CARDS]: (
    data: RevealCardsPayload, 
    callback: (response: ApiResponse) => void
  ) => void;
  [SOCKET_EVENTS.RESET_ROUND]: (
    data: ResetRoundPayload, 
    callback: (response: ApiResponse) => void
  ) => void;
  
  // 사용자 관련
  [SOCKET_EVENTS.UPDATE_USER_NAME]: (
    data: UpdateUserNamePayload, 
    callback: (response: ApiResponse) => void
  ) => void;
  [SOCKET_EVENTS.UPDATE_ROOM_NAME]: (
    data: UpdateRoomNamePayload, 
    callback: (response: ApiResponse) => void
  ) => void;
  [SOCKET_EVENTS.GET_USER_INFO]: (
    callback: (response: ApiResponse) => void
  ) => void;
  
  // 시스템
  [SOCKET_EVENTS.PING]: () => void;
  [SOCKET_EVENTS.GET_STATS]: (
    callback: (response: ApiResponse<GameStats>) => void
  ) => void;
  
  // 디버깅
  [SOCKET_EVENTS.DEBUG_ROOM_STATE]: (data: { roomId: string }) => void;
  [SOCKET_EVENTS.DEBUG_USER_STATE]: () => void;
}

// 소켓 간 통신 데이터 (서버 내부용)
export interface InterServerEvents {
  [SOCKET_EVENTS.ROOM_UPDATE]: (data: RoomUpdateEvent) => void;
  [SOCKET_EVENTS.USER_UPDATE]: (data: UserUpdateEvent) => void;
}

// 소켓 데이터 (연결 시 저장되는 데이터)
export interface SocketData {
  userId?: string;
  roomId?: string;
  userName?: string;
  joinedAt?: string;
}

// TypeScript용 Socket.io 타입 정의
export type TypedSocket = {
  id: string;
  data: SocketData;
  emit: <T extends keyof ServerToClientEvents>(
    event: T,
    ...args: Parameters<ServerToClientEvents[T]>
  ) => boolean;
  on: <T extends keyof ClientToServerEvents>(
    event: T,
    listener: ClientToServerEvents[T]
  ) => void;
  join: (room: string) => void;
  leave: (room: string) => void;
  disconnect: (close?: boolean) => void;
};

// 이벤트 우선순위 정의 (선택사항)
export const EVENT_PRIORITY = {
  HIGH: ['disconnect', 'error', 'room_full', 'room_not_found'],
  MEDIUM: ['create_room', 'join_room', 'leave_room', 'select_card'],
  LOW: ['ping', 'get_stats', 'debug_room_state']
} as const; 