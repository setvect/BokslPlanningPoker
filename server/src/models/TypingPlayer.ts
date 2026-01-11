// 타자 게임 참가자 인터페이스 (서버 내부용)
export interface TypingPlayerInternal {
  id: string;              // 고유 ID
  socketId: string;        // 소켓 ID
  name: string;            // 사용자가 입력한 이름
  originalName: string;    // 중복 처리 전 원본 이름
  roomId: string;          // 현재 참여 중인 방 ID
  isConnected: boolean;    // 연결 상태
  joinedAt: Date;          // 방 입장 시간
  lastActivity: Date;      // 마지막 활동 시간

  // 타자 게임 전용
  currentInput: string;    // 현재 입력 중인 텍스트
  progress: number;        // 진행률 (0-100)
  isFinished: boolean;     // 완료 여부
  finishedAt: Date | null; // 완료 시간
  rank: number | null;     // 순위
  isSpectator: boolean;    // 관전자 여부 (중도 참가 시)
}

export interface CreateTypingPlayerParams {
  id: string;
  socketId: string;
  name: string;
  roomId: string;
  isSpectator?: boolean;
}

// 타자 게임 참가자 유틸리티 함수들
export class TypingPlayerUtils {
  /**
   * 참가자 생성
   */
  static createPlayer(params: CreateTypingPlayerParams): TypingPlayerInternal {
    return {
      id: params.id,
      socketId: params.socketId,
      name: params.name,
      originalName: params.name,
      roomId: params.roomId,
      isConnected: true,
      joinedAt: new Date(),
      lastActivity: new Date(),
      currentInput: '',
      progress: 0,
      isFinished: false,
      finishedAt: null,
      rank: null,
      isSpectator: params.isSpectator || false,
    };
  }

  /**
   * 새 라운드를 위해 참가자 상태 초기화
   */
  static resetForNewRound(player: TypingPlayerInternal): void {
    player.currentInput = '';
    player.progress = 0;
    player.isFinished = false;
    player.finishedAt = null;
    player.rank = null;
    // 관전자는 다음 라운드부터 참여 가능
    player.isSpectator = false;
  }

  /**
   * 입력 업데이트
   */
  static updateInput(player: TypingPlayerInternal, input: string, progress: number): void {
    player.currentInput = input;
    player.progress = progress;
    player.lastActivity = new Date();
  }

  /**
   * 완료 처리
   */
  static markFinished(player: TypingPlayerInternal, rank: number): void {
    player.isFinished = true;
    player.finishedAt = new Date();
    player.rank = rank;
    player.progress = 100;
  }

  /**
   * 직렬화 (클라이언트 전송용)
   * socketId를 제외하고 Date를 ISO string으로 변환
   */
  static serialize(player: TypingPlayerInternal): {
    id: string;
    name: string;
    originalName: string;
    roomId: string;
    isConnected: boolean;
    joinedAt: string;
    lastActivity: string;
    currentInput: string;
    progress: number;
    isFinished: boolean;
    finishedAt: string | null;
    rank: number | null;
    isSpectator: boolean;
  } {
    return {
      id: player.id,
      name: player.name,
      originalName: player.originalName,
      roomId: player.roomId,
      isConnected: player.isConnected,
      joinedAt: player.joinedAt.toISOString(),
      lastActivity: player.lastActivity.toISOString(),
      currentInput: player.currentInput,
      progress: player.progress,
      isFinished: player.isFinished,
      finishedAt: player.finishedAt?.toISOString() || null,
      rank: player.rank,
      isSpectator: player.isSpectator,
    };
  }

  /**
   * 중복된 이름에 번호를 추가하여 고유한 이름 생성
   */
  static generateUniqueName(originalName: string, existingNames: string[]): string {
    let uniqueName = originalName;
    let counter = 2;

    while (existingNames.includes(uniqueName)) {
      uniqueName = `${originalName}(${counter})`;
      counter++;
    }

    return uniqueName;
  }
}
