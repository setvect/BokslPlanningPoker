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
} as const;

// 클라이언트용 기본 설정 (실제 사용되는 것만)
export const CLIENT_CONFIG = {
  DEVELOPMENT_SOCKET_URL: 'http://localhost:3001',
  PRODUCTION_SOCKET_URL: '', // 클라이언트에서 빈 문자열이면 현재 origin 사용
} as const;

 