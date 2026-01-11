import { TypingPlayerInternal, TypingPlayerUtils } from './TypingPlayer';
import { TypingGameState, TypingSentence } from '../../../shared/types';
import { TYPING_GAME_CONFIG } from '../../../shared/constants';

// 타자 게임 방 인터페이스 (서버 내부용)
export interface TypingRoomInternal {
  id: string;                               // 방 고유 ID
  name: string;                             // 방 이름
  players: Map<string, TypingPlayerInternal>; // 참가자 목록 (key: player.id)
  gameState: TypingGameState;               // 현재 게임 상태
  createdAt: Date;                          // 방 생성 시간
  lastActivity: Date;                       // 마지막 활동 시간
  maxPlayers: number;                       // 최대 참가자 수

  // 게임 진행 정보
  currentSentence: TypingSentence | null;   // 현재 문장
  roundNumber: number;                      // 현재 라운드 번호
  countdownRemaining: number | null;        // 카운트다운 남은 시간
  roundStartedAt: Date | null;              // 라운드 시작 시간
  firstFinisherId: string | null;           // 1등 완료자 ID
  firstFinishedAt: Date | null;             // 1등 완료 시간
  lastSentenceId: string | null;            // 이전 문장 ID (연속 방지)

  // 타이머 참조
  countdownTimer: NodeJS.Timeout | null;
  roundEndTimer: NodeJS.Timeout | null;
  nextRoundTimer: NodeJS.Timeout | null;
}

export interface CreateTypingRoomParams {
  id: string;
  name: string;
  maxPlayers?: number;
}

// 타자 게임 방 유틸리티 함수들
export class TypingRoomUtils {
  /**
   * 새 방 생성
   */
  static createRoom(params: CreateTypingRoomParams): TypingRoomInternal {
    return {
      id: params.id,
      name: params.name,
      players: new Map(),
      gameState: TypingGameState.WAITING,
      createdAt: new Date(),
      lastActivity: new Date(),
      maxPlayers: params.maxPlayers || TYPING_GAME_CONFIG.MAX_PLAYERS_PER_ROOM,
      currentSentence: null,
      roundNumber: 0,
      countdownRemaining: null,
      roundStartedAt: null,
      firstFinisherId: null,
      firstFinishedAt: null,
      lastSentenceId: null,
      countdownTimer: null,
      roundEndTimer: null,
      nextRoundTimer: null,
    };
  }

  /**
   * 방에 참가자 추가
   */
  static addPlayer(room: TypingRoomInternal, player: TypingPlayerInternal): boolean {
    if (room.players.size >= room.maxPlayers) {
      return false; // 방이 가득참
    }

    room.players.set(player.id, player);
    room.lastActivity = new Date();
    return true;
  }

  /**
   * 방에서 참가자 제거
   */
  static removePlayer(room: TypingRoomInternal, playerId: string): TypingPlayerInternal | null {
    const player = room.players.get(playerId);
    if (player) {
      room.players.delete(playerId);
      room.lastActivity = new Date();
    }
    return player || null;
  }

  /**
   * 새 라운드를 위해 방 상태 초기화
   */
  static resetForNewRound(room: TypingRoomInternal, sentence: TypingSentence): void {
    room.currentSentence = sentence;
    room.roundNumber++;
    room.roundStartedAt = null;
    room.firstFinisherId = null;
    room.firstFinishedAt = null;
    room.lastSentenceId = sentence.id;

    // 모든 참가자 상태 초기화
    room.players.forEach(player => {
      TypingPlayerUtils.resetForNewRound(player);
    });
  }

  /**
   * 라운드 시작
   */
  static startRound(room: TypingRoomInternal): void {
    room.gameState = TypingGameState.PLAYING;
    room.roundStartedAt = new Date();
    room.countdownRemaining = null;
  }

  /**
   * 모든 타이머 정리
   */
  static clearTimers(room: TypingRoomInternal): void {
    if (room.countdownTimer) {
      clearInterval(room.countdownTimer);
      room.countdownTimer = null;
    }
    if (room.roundEndTimer) {
      clearTimeout(room.roundEndTimer);
      room.roundEndTimer = null;
    }
    if (room.nextRoundTimer) {
      clearTimeout(room.nextRoundTimer);
      room.nextRoundTimer = null;
    }
  }

  /**
   * 순위 계산
   */
  static calculateRankings(room: TypingRoomInternal): void {
    // 완료한 참가자들을 완료 시간 순으로 정렬
    const finishedPlayers = Array.from(room.players.values())
      .filter(p => p.isFinished && !p.isSpectator)
      .sort((a, b) => {
        if (!a.finishedAt || !b.finishedAt) {
          return 0;
        }
        return a.finishedAt.getTime() - b.finishedAt.getTime();
      });

    // 순위 부여
    let rank = 1;
    finishedPlayers.forEach(player => {
      player.rank = rank++;
    });

    // 미완료자는 진행률 순으로 정렬
    const unfinishedPlayers = Array.from(room.players.values())
      .filter(p => !p.isFinished && !p.isSpectator)
      .sort((a, b) => b.progress - a.progress);

    unfinishedPlayers.forEach(player => {
      player.rank = rank++;
    });
  }

  /**
   * 1등 완료 처리
   */
  static setFirstFinisher(room: TypingRoomInternal, playerId: string): void {
    room.firstFinisherId = playerId;
    room.firstFinishedAt = new Date();
  }

  /**
   * 현재 완료한 참가자 수
   */
  static getFinishedCount(room: TypingRoomInternal): number {
    let count = 0;
    room.players.forEach(player => {
      if (player.isFinished && !player.isSpectator) {
        count++;
      }
    });
    return count;
  }

  /**
   * 다음 순위 번호 반환
   */
  static getNextRank(room: TypingRoomInternal): number {
    return TypingRoomUtils.getFinishedCount(room) + 1;
  }

  /**
   * 방이 비활성 상태인지 확인
   */
  static isInactive(room: TypingRoomInternal, timeoutMinutes: number = TYPING_GAME_CONFIG.ROOM_INACTIVE_TIMEOUT): boolean {
    const now = new Date();
    const diffInMinutes = (now.getTime() - room.lastActivity.getTime()) / (1000 * 60);
    return diffInMinutes > timeoutMinutes;
  }

  /**
   * 직렬화 (클라이언트 전송용)
   * Map을 Array로 변환하고 Date를 ISO string으로 변환
   */
  static serialize(room: TypingRoomInternal): {
    id: string;
    name: string;
    players: ReturnType<typeof TypingPlayerUtils.serialize>[];
    gameState: TypingGameState;
    createdAt: string;
    lastActivity: string;
    maxPlayers: number;
    currentSentence: TypingSentence | null;
    roundNumber: number;
    countdownRemaining: number | null;
    roundStartedAt: string | null;
    firstFinisherId: string | null;
    firstFinishedAt: string | null;
    lastSentenceId: string | null;
  } {
    return {
      id: room.id,
      name: room.name,
      players: Array.from(room.players.values()).map(TypingPlayerUtils.serialize),
      gameState: room.gameState,
      createdAt: room.createdAt.toISOString(),
      lastActivity: room.lastActivity.toISOString(),
      maxPlayers: room.maxPlayers,
      currentSentence: room.currentSentence,
      roundNumber: room.roundNumber,
      countdownRemaining: room.countdownRemaining,
      roundStartedAt: room.roundStartedAt?.toISOString() || null,
      firstFinisherId: room.firstFinisherId,
      firstFinishedAt: room.firstFinishedAt?.toISOString() || null,
      lastSentenceId: room.lastSentenceId,
    };
  }
}
