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
  Room,
  // 타자 게임 타입
  CreateTypingRoomPayload,
  CreateTypingRoomResponse,
  JoinTypingRoomPayload,
  JoinTypingRoomResponse,
  LeaveTypingRoomPayload,
  StartTypingGamePayload,
  StartTypingGameResponse,
  TypingInputPayload,
  TypingInputResponse,
  TypingSubmitPayload,
  TypingSubmitResponse,
  TypingRoomListItem,
  TypingRoomUpdateEvent,
  TypingCountdownEvent,
  TypingRoundStartEvent,
  TypingProgressEvent,
  TypingFirstFinishEvent,
  TypingPlayerFinishEvent,
  TypingRoundEndEvent
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

  // ======================================
  // 타자 게임 이벤트
  // ======================================

  // 타자 게임 방 관련 (클라이언트 → 서버)
  TYPING_CREATE_ROOM: 'typing_create_room',
  TYPING_JOIN_ROOM: 'typing_join_room',
  TYPING_LEAVE_ROOM: 'typing_leave_room',
  TYPING_GET_ROOM_LIST: 'typing_get_room_list',

  // 타자 게임 관련 (클라이언트 → 서버)
  TYPING_START_GAME: 'typing_start_game',
  TYPING_INPUT: 'typing_input',
  TYPING_SUBMIT: 'typing_submit',

  // 타자 게임 실시간 업데이트 (서버 → 클라이언트)
  TYPING_ROOM_UPDATE: 'typing_room_update',
  TYPING_COUNTDOWN: 'typing_countdown',
  TYPING_ROUND_START: 'typing_round_start',
  TYPING_PROGRESS: 'typing_progress',
  TYPING_FIRST_FINISH: 'typing_first_finish',
  TYPING_PLAYER_FINISH: 'typing_player_finish',
  TYPING_ROUND_END: 'typing_round_end',
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

  // 타자 게임 이벤트
  [SOCKET_EVENTS.TYPING_ROOM_UPDATE]: (data: TypingRoomUpdateEvent) => void;
  [SOCKET_EVENTS.TYPING_COUNTDOWN]: (data: TypingCountdownEvent) => void;
  [SOCKET_EVENTS.TYPING_ROUND_START]: (data: TypingRoundStartEvent) => void;
  [SOCKET_EVENTS.TYPING_PROGRESS]: (data: TypingProgressEvent) => void;
  [SOCKET_EVENTS.TYPING_FIRST_FINISH]: (data: TypingFirstFinishEvent) => void;
  [SOCKET_EVENTS.TYPING_PLAYER_FINISH]: (data: TypingPlayerFinishEvent) => void;
  [SOCKET_EVENTS.TYPING_ROUND_END]: (data: TypingRoundEndEvent) => void;
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

  // 타자 게임 이벤트
  [SOCKET_EVENTS.TYPING_CREATE_ROOM]: (
    data: CreateTypingRoomPayload,
    callback: (response: CreateTypingRoomResponse) => void
  ) => void;
  [SOCKET_EVENTS.TYPING_JOIN_ROOM]: (
    data: JoinTypingRoomPayload,
    callback: (response: JoinTypingRoomResponse) => void
  ) => void;
  [SOCKET_EVENTS.TYPING_LEAVE_ROOM]: (
    data: LeaveTypingRoomPayload,
    callback: (response: ApiResponse) => void
  ) => void;
  [SOCKET_EVENTS.TYPING_GET_ROOM_LIST]: (
    callback: (response: ApiResponse<TypingRoomListItem[]>) => void
  ) => void;
  [SOCKET_EVENTS.TYPING_START_GAME]: (
    data: StartTypingGamePayload,
    callback: (response: StartTypingGameResponse) => void
  ) => void;
  [SOCKET_EVENTS.TYPING_INPUT]: (
    data: TypingInputPayload,
    callback: (response: TypingInputResponse) => void
  ) => void;
  [SOCKET_EVENTS.TYPING_SUBMIT]: (
    data: TypingSubmitPayload,
    callback: (response: TypingSubmitResponse) => void
  ) => void;
}

 