import { User } from './User';

export interface Room {
  id: string;               // 방 고유 ID
  name: string;             // 방 이름
  users: Map<string, User>; // 사용자 목록 (key: user.id)
  gameState: GameState;     // 현재 게임 상태
  createdAt: Date;          // 방 생성 시간
  lastActivity: Date;       // 마지막 활동 시간
  maxUsers: number;         // 최대 사용자 수 (기본 20명)
}

export enum GameState {
  SELECTING = 'selecting',  // 카드 선택 중
  REVEALED = 'revealed',    // 카드 공개됨
  FINISHED = 'finished'     // 라운드 완료
}

export interface CreateRoomParams {
  id: string;
  name: string;
  maxUsers?: number;
}

export interface GameResult {
  totalUsers: number;        // 전체 참여자 수
  votedUsers: number;        // 투표한 참여자 수
  cards: { [userId: string]: string }; // 사용자별 선택한 카드
  average: number | null;    // 평균값 (숫자 카드만)
  validVotes: number;        // 유효한 투표 수 (숫자 카드만)
}

// 방 관련 유틸리티 함수들
export class RoomUtils {
  /**
   * 새 방 생성
   */
  static createRoom(params: CreateRoomParams): Room {
    return {
      id: params.id,
      name: params.name,
      users: new Map(),
      gameState: GameState.SELECTING,
      createdAt: new Date(),
      lastActivity: new Date(),
      maxUsers: params.maxUsers || 20
    };
  }
  
  /**
   * 방에 사용자 추가
   */
  static addUser(room: Room, user: User): boolean {
    if (room.users.size >= room.maxUsers) {
      return false; // 방이 가득참
    }
    
    room.users.set(user.id, user);
    room.lastActivity = new Date();
    return true;
  }
  
  /**
   * 방에서 사용자 제거
   */
  static removeUser(room: Room, userId: string): boolean {
    const removed = room.users.delete(userId);
    if (removed) {
      room.lastActivity = new Date();
    }
    return removed;
  }
  
  /**
   * 모든 사용자가 카드를 선택했는지 확인
   */
  static allUsersSelected(room: Room): boolean {
    if (room.users.size === 0) return false;
    
    for (const user of room.users.values()) {
      if (!user.selectedCard) {
        return false;
      }
    }
    return true;
  }
  
  /**
   * 게임 결과 계산
   */
  static calculateGameResult(room: Room): GameResult {
    const users = Array.from(room.users.values());
    const cards: { [userId: string]: string } = {};
    
    // 사용자별 선택한 카드 수집
    users.forEach(user => {
      if (user.selectedCard) {
        cards[user.id] = user.selectedCard;
      }
    });
    
    // 숫자 카드만 필터링하여 평균 계산
    const numericCards = Object.values(cards)
      .map(card => {
        // 숫자로 변환 가능한 카드만 선택
        if (card === '1/2') return 0.5;
        if (card === '?') return null;
        if (card === '커피') return null;
        
        const num = parseFloat(card);
        return isNaN(num) ? null : num;
      })
      .filter((num): num is number => num !== null);
    
    const average = numericCards.length > 0 
      ? numericCards.reduce((sum, num) => sum + num, 0) / numericCards.length 
      : null;
    
    return {
      totalUsers: users.length,
      votedUsers: Object.keys(cards).length,
      cards,
      average: average ? Math.round(average * 100) / 100 : null, // 소수점 2자리까지
      validVotes: numericCards.length
    };
  }
  
  /**
   * 라운드 초기화 (모든 사용자의 선택한 카드 제거)
   */
  static resetRound(room: Room): void {
    room.users.forEach(user => {
      user.selectedCard = undefined;
      user.lastActivity = new Date();
    });
    
    room.gameState = GameState.SELECTING;
    room.lastActivity = new Date();
  }
  
  /**
   * 카드 공개
   */
  static revealCards(room: Room): void {
    room.gameState = GameState.REVEALED;
    room.lastActivity = new Date();
  }
  
  /**
   * 방이 비활성 상태인지 확인 (1시간 동안 활동 없음)
   */
  static isInactive(room: Room, timeoutMinutes: number = 60): boolean {
    const now = new Date();
    const diffInMinutes = (now.getTime() - room.lastActivity.getTime()) / (1000 * 60);
    return diffInMinutes > timeoutMinutes;
  }
} 