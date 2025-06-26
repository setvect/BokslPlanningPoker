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
  UserUpdateEvent,
  GameUpdateEvent,
  RevealCountdownEvent,
  ApiResponse,
  Room
} from './types';

// Socket.io 이벤트 이름 상수 (실제 사용되는 것만)
export const SOCKET_EVENTS = {
  // 연결 관련
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  
  // 방 관련 (클라이언트 → 서버)
  CREATE_ROOM: 'create_room',
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  GET_ROOM_LIST: 'get_room_list',
  
  // 게임 관련 (클라이언트 → 서버)
  SELECT_CARD: 'select_card',
  REVEAL_CARDS: 'reveal_cards',
  RESET_ROUND: 'reset_round',
  
  // 사용자 관련 (클라이언트 → 서버)
  UPDATE_USER_NAME: 'update_user_name',
  UPDATE_ROOM_NAME: 'update_room_name',
  
  // 실시간 업데이트 (서버 → 클라이언트)
  ROOM_UPDATE: 'room_update',
  USER_UPDATE: 'user_update',
  GAME_UPDATE: 'game_update',
  CARDS_REVEALED: 'cards_revealed',
  ROUND_RESET: 'round_reset',
  REVEAL_COUNTDOWN: 'reveal_countdown',
  
  // 시스템 관련
  ERROR: 'error',
  PING: 'ping',
  PONG: 'pong',
} as const;

// 서버에서 클라이언트로 보내는 이벤트 타입 맵 (실제 사용되는 것만)
export interface ServerToClientEvents {
  // 방 관련 응답
  [SOCKET_EVENTS.ROOM_UPDATE]: (data: RoomUpdateEvent) => void;
  [SOCKET_EVENTS.USER_UPDATE]: (data: UserUpdateEvent) => void;
  [SOCKET_EVENTS.GAME_UPDATE]: (data: GameUpdateEvent) => void;
  [SOCKET_EVENTS.CARDS_REVEALED]: (data: any) => void;
  [SOCKET_EVENTS.ROUND_RESET]: (data: any) => void;
  [SOCKET_EVENTS.REVEAL_COUNTDOWN]: (data: RevealCountdownEvent) => void;
  
  // 시스템
  [SOCKET_EVENTS.ERROR]: (error: { code: string; message: string; details?: any }) => void;
  [SOCKET_EVENTS.PONG]: () => void;
}

// 클라이언트에서 서버로 보내는 이벤트 타입 맵 (실제 사용되는 것만)
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
  
  // 시스템
  [SOCKET_EVENTS.PING]: () => void;
}

 