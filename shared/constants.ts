import { PLANNING_POKER_CARDS } from './types';

// 게임 설정 상수
export const GAME_CONFIG = {
  // 방 관련
  MAX_ROOMS: 10,
  MAX_USERS_PER_ROOM: 20,
  MIN_USERS_FOR_GAME: 1,
  
  // 시간 제한 (분 단위)
  ROOM_INACTIVE_TIMEOUT: 60, // 1시간
  ROOM_CLEANUP_INTERVAL: 5,   // 5분마다 정리
  USER_DISCONNECT_TIMEOUT: 30, // 30초 후 사용자 제거
  
  // 재연결 설정
  RECONNECT_ATTEMPTS: 3,
  RECONNECT_DELAY: 1000, // 1초
  
  // 입력 제한
  MAX_ROOM_NAME_LENGTH: 50,
  MAX_USER_NAME_LENGTH: 20,
  MIN_ROOM_NAME_LENGTH: 1,
  MIN_USER_NAME_LENGTH: 1,
  
  // 카드 관련
  CARDS: PLANNING_POKER_CARDS,
  NUMERIC_CARDS: ['0', '1/2', '1', '2', '3', '5', '8', '13', '20', '40', '60', '100'],
  SPECIAL_CARDS: ['?', '커피'],
} as const;

// 에러 코드 상수 (실제 사용되는 것만)
export const ERROR_CODES = {
  // 일반적인 에러
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  
  // 방 관련 에러
  ROOM_NOT_FOUND: 'ROOM_NOT_FOUND',
  ROOM_FULL: 'ROOM_FULL',
  ROOM_LIMIT_REACHED: 'ROOM_LIMIT_REACHED',
  INVALID_ROOM_NAME: 'INVALID_ROOM_NAME',
  
  // 사용자 관련 에러
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  INVALID_USER_NAME: 'INVALID_USER_NAME',
  USER_NOT_IN_ROOM: 'USER_NOT_IN_ROOM',
  
  // 게임 관련 에러
  INVALID_CARD: 'INVALID_CARD',
  GAME_NOT_IN_PROGRESS: 'GAME_NOT_IN_PROGRESS',
  CARDS_ALREADY_REVEALED: 'CARDS_ALREADY_REVEALED',
} as const;

// 에러 메시지 (한국어)
export const ERROR_MESSAGES = {
  [ERROR_CODES.INTERNAL_ERROR]: '서버 내부 오류가 발생했습니다.',
  
  [ERROR_CODES.ROOM_NOT_FOUND]: '방을 찾을 수 없습니다.',
  [ERROR_CODES.ROOM_FULL]: '방이 가득찼습니다.',
  [ERROR_CODES.ROOM_LIMIT_REACHED]: '최대 방 개수에 도달했습니다.',
  [ERROR_CODES.INVALID_ROOM_NAME]: '올바르지 않은 방 이름입니다.',
  
  [ERROR_CODES.USER_NOT_FOUND]: '사용자를 찾을 수 없습니다.',
  [ERROR_CODES.INVALID_USER_NAME]: '올바르지 않은 사용자 이름입니다.',
  [ERROR_CODES.USER_NOT_IN_ROOM]: '사용자가 방에 없습니다.',
  
  [ERROR_CODES.INVALID_CARD]: '올바르지 않은 카드입니다.',
  [ERROR_CODES.GAME_NOT_IN_PROGRESS]: '게임이 진행 중이 아닙니다.',
  [ERROR_CODES.CARDS_ALREADY_REVEALED]: '카드가 이미 공개되었습니다.',
} as const;

// 로컬 스토리지 키 (실제 사용되는 것만)
export const STORAGE_KEYS = {
  USER_NAME: 'planning_poker_user_name',
  SELECTED_CARD: 'planning_poker_selected_card',
} as const;

// 클라이언트용 기본 설정 (실제 사용되는 것만)
export const CLIENT_CONFIG = {
  DEVELOPMENT_SOCKET_URL: 'http://localhost:3001',
  PRODUCTION_SOCKET_URL: '', // 클라이언트에서 빈 문자열이면 현재 origin 사용
} as const;

// ======================================
// 타자 게임 설정 상수
// ======================================

export const TYPING_GAME_CONFIG = {
  // 방 관련
  MAX_PLAYERS_PER_ROOM: 20,
  MIN_PLAYERS_FOR_GAME: 1,      // 혼자 연습 가능

  // 시간 설정 (초 단위)
  COUNTDOWN_SECONDS: 3,          // 게임 시작 카운트다운
  FIRST_FINISH_COUNTDOWN: 5,     // 1등 완료 후 대기 시간
  NEXT_ROUND_DELAY: 3,           // 라운드 종료 후 다음 라운드 대기

  // 문장 관련
  MAX_SENTENCE_LENGTH: 50,       // 문장 최대 길이

  // 방 정리
  ROOM_INACTIVE_TIMEOUT: 60,     // 비활성 방 타임아웃 (분)

  // 진행 상황 업데이트 간격 (ms)
  PROGRESS_BROADCAST_INTERVAL: 100,

  // 복사 붙여넣기 감지 기준
  PASTE_DETECTION_THRESHOLD: 3,  // 한 번에 3글자 이상 증가 시 붙여넣기로 판단
} as const;

// 타자 게임 에러 코드
export const TYPING_ERROR_CODES = {
  ROOM_NOT_FOUND: 'TYPING_ROOM_NOT_FOUND',
  ROOM_FULL: 'TYPING_ROOM_FULL',
  GAME_IN_PROGRESS: 'TYPING_GAME_IN_PROGRESS',
  GAME_NOT_STARTED: 'TYPING_GAME_NOT_STARTED',
  NOT_ENOUGH_PLAYERS: 'TYPING_NOT_ENOUGH_PLAYERS',
  INVALID_INPUT: 'TYPING_INVALID_INPUT',
  PASTE_DETECTED: 'TYPING_PASTE_DETECTED',
  PLAYER_NOT_FOUND: 'TYPING_PLAYER_NOT_FOUND',
  ALREADY_FINISHED: 'TYPING_ALREADY_FINISHED',
  HAS_ERRORS: 'TYPING_HAS_ERRORS',
  IS_SPECTATOR: 'TYPING_IS_SPECTATOR',
} as const;

// 타자 게임 에러 메시지 (한국어)
export const TYPING_ERROR_MESSAGES: Record<string, string> = {
  [TYPING_ERROR_CODES.ROOM_NOT_FOUND]: '타자 게임 방을 찾을 수 없습니다.',
  [TYPING_ERROR_CODES.ROOM_FULL]: '방이 가득 찼습니다.',
  [TYPING_ERROR_CODES.GAME_IN_PROGRESS]: '게임이 진행 중입니다. 다음 라운드부터 참여 가능합니다.',
  [TYPING_ERROR_CODES.GAME_NOT_STARTED]: '게임이 시작되지 않았습니다.',
  [TYPING_ERROR_CODES.NOT_ENOUGH_PLAYERS]: '게임을 시작하려면 최소 1명이 필요합니다.',
  [TYPING_ERROR_CODES.INVALID_INPUT]: '올바르지 않은 입력입니다.',
  [TYPING_ERROR_CODES.PASTE_DETECTED]: '복사/붙여넣기는 허용되지 않습니다.',
  [TYPING_ERROR_CODES.PLAYER_NOT_FOUND]: '플레이어를 찾을 수 없습니다.',
  [TYPING_ERROR_CODES.ALREADY_FINISHED]: '이미 완료했습니다.',
  [TYPING_ERROR_CODES.HAS_ERRORS]: '오타가 있습니다. 수정 후 다시 시도해주세요.',
  [TYPING_ERROR_CODES.IS_SPECTATOR]: '관전 중입니다. 다음 라운드부터 참여 가능합니다.',
} as const;

// 타자 게임 로컬 스토리지 키
export const TYPING_STORAGE_KEYS = {
  USER_NAME: 'typing_game_user_name',
  CURRENT_ROOM: 'typing_game_current_room',
} as const;

// 복사 방지용 특수 문자 (띄어쓰기 대신 표시)
export const TYPING_SPECIAL_CHARS = ['·', '•', '‧', '∙', '⋅'] as const;

 