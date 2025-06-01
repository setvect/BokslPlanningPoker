export interface User {
  id: string;          // 소켓 ID를 사용자 ID로 사용
  name: string;        // 사용자가 입력한 이름
  originalName: string; // 중복 처리 전 원본 이름
  roomId: string;      // 현재 참여 중인 방 ID
  selectedCard?: string; // 선택한 카드 (없으면 undefined)
  isConnected: boolean; // 연결 상태
  joinedAt: Date;      // 방 입장 시간
  lastActivity: Date;  // 마지막 활동 시간
}

export interface CreateUserParams {
  id: string;
  name: string;
  roomId: string;
}

export interface UpdateUserParams {
  name?: string;
  selectedCard?: string;
  lastActivity?: Date;
}

// 사용자 관련 유틸리티 함수들
export class UserUtils {
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
  
  /**
   * 사용자 생성
   */
  static createUser(params: CreateUserParams): User {
    return {
      id: params.id,
      name: params.name,
      originalName: params.name,
      roomId: params.roomId,
      selectedCard: undefined,
      isConnected: true,
      joinedAt: new Date(),
      lastActivity: new Date()
    };
  }
  
  /**
   * 사용자 정보 업데이트
   */
  static updateUser(user: User, updates: UpdateUserParams): User {
    return {
      ...user,
      ...updates,
      lastActivity: updates.lastActivity || new Date()
    };
  }
} 