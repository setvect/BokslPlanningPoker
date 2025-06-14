import { Socket, Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { 
  SOCKET_EVENTS,
  CreateRoomPayload,
  JoinRoomPayload,
  SelectCardPayload,
  RevealCardsPayload,
  ResetRoundPayload,
  UpdateUserNamePayload,
  UpdateRoomNamePayload,
  CreateRoomResponse,
  JoinRoomResponse,
  CardSelectionResponse,
  ApiResponse,
  User as SharedUser,
  Room as SharedRoom,
  GameState,
  GameResult,
  RoomUpdateEvent,
  GameUpdateEvent,
  UserUpdateEvent,
  GAME_CONFIG,
  ERROR_CODES,
  ERROR_MESSAGES,
  Utils
} from '../../../shared';

// 서버용 타입 (shared와 호환되도록)
interface User extends SharedUser {
  socketId: string;
}

interface Room extends Omit<SharedRoom, 'users'> {
  users: Map<string, User>;
  emptyTimestamp?: string; // 방이 빈 시간 (새로고침 대응용)
  revealTimer?: NodeJS.Timeout; // 카드 오픈 타이머
  isRevealCountdownActive?: boolean; // 카운트다운 진행 중 여부
}

// 메모리 기반 데이터 저장소
class GameStore {
  private rooms = new Map<string, Room>();
  private userRoomMap = new Map<string, string>(); // socketId -> roomId
  
  // 방 생성
  createRoom(roomName: string, creator: User): Room {
    if (this.rooms.size >= GAME_CONFIG.MAX_ROOMS) {
      throw new Error(ERROR_MESSAGES[ERROR_CODES.ROOM_LIMIT_REACHED]);
    }
    
    const roomId = this.generateRoomId();
    const now = new Date().toISOString();
    
    const room: Room = {
      id: roomId,
      name: roomName,
      users: new Map([[creator.id, creator]]),
      gameState: GameState.SELECTING,
      createdAt: now,
      lastActivity: now,
      maxUsers: GAME_CONFIG.MAX_USERS_PER_ROOM
    };
    
    this.rooms.set(roomId, room);
    this.userRoomMap.set(creator.socketId, roomId);
    
    return room;
  }
  
  // 방 참여
  joinRoom(roomId: string, user: User): Room {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error(ERROR_MESSAGES[ERROR_CODES.ROOM_NOT_FOUND]);
    }
    
    if (room.users.size >= room.maxUsers) {
      throw new Error(ERROR_MESSAGES[ERROR_CODES.ROOM_FULL]);
    }
    
    // 이름 중복 처리
    const existingNames = Array.from(room.users.values()).map(u => u.name);
    user.name = Utils.generateUniqueName(user.originalName, existingNames);
    
    room.users.set(user.id, user);
    this.userRoomMap.set(user.socketId, roomId);
    room.lastActivity = new Date().toISOString();
    
    // 방이 빈 상태에서 사용자가 들어오면 emptyTimestamp 초기화
    if (room.emptyTimestamp) {
      delete room.emptyTimestamp;
      console.log(`🔍 빈 방에 사용자 입장: ${roomId}, 삭제 타이머 취소`);
    }
    
    return room;
  }
  
  // 방 나가기
  leaveRoom(socketId: string): { room: Room | null, user: User | null } {
    const roomId = this.userRoomMap.get(socketId);
    if (!roomId) return { room: null, user: null };
    
    const room = this.rooms.get(roomId);
    if (!room) return { room: null, user: null };
    
    const user = Array.from(room.users.values()).find(u => u.socketId === socketId);
    if (!user) return { room: null, user: null };
    
    room.users.delete(user.id);
    this.userRoomMap.delete(socketId);
    room.lastActivity = new Date().toISOString();
    
    // 방이 비었을 때 즉시 삭제하지 않고 타이머 설정 (새로고침 대응)
    if (room.users.size === 0) {
      console.log(`🔍 방이 비었음: ${roomId}, 3분 후 삭제 예정`);
      room.emptyTimestamp = new Date().toISOString();
      
      // 3분 후 방 삭제 (다른 사용자가 들어오지 않으면)
      setTimeout(() => {
        const currentRoom = this.rooms.get(roomId);
        if (currentRoom && currentRoom.users.size === 0) {
          console.log(`🗑️ 빈 방 자동 삭제: ${roomId}`);
          this.rooms.delete(roomId);
        }
      }, 3 * 60 * 1000); // 3분
      
      return { room, user };
    }
    
    // 방에 사용자가 남아있으면 emptyTimestamp 초기화
    if (room.emptyTimestamp) {
      delete room.emptyTimestamp;
      console.log(`🔍 방에 사용자 복귀: ${roomId}, 삭제 타이머 취소`);
    }
    
    return { room, user };
  }
  
  // 카드 선택
  selectCard(socketId: string, card: string): { room: Room, user: User, result?: GameResult } {
    const roomId = this.userRoomMap.get(socketId);
    if (!roomId) throw new Error(ERROR_MESSAGES[ERROR_CODES.USER_NOT_IN_ROOM]);
    
    const room = this.rooms.get(roomId);
    if (!room) throw new Error(ERROR_MESSAGES[ERROR_CODES.ROOM_NOT_FOUND]);
    
    const user = Array.from(room.users.values()).find(u => u.socketId === socketId);
    if (!user) throw new Error(ERROR_MESSAGES[ERROR_CODES.USER_NOT_FOUND]);
    
    // SELECTING과 REVEALED 상태에서 모두 카드 선택 허용
    if (room.gameState !== GameState.SELECTING && room.gameState !== GameState.REVEALED) {
      throw new Error(ERROR_MESSAGES[ERROR_CODES.GAME_NOT_IN_PROGRESS]);
    }
    
    if (!GAME_CONFIG.CARDS.includes(card as any)) {
      throw new Error(ERROR_MESSAGES[ERROR_CODES.INVALID_CARD]);
    }
    
    user.selectedCard = card as any;
    user.lastActivity = new Date().toISOString();
    room.lastActivity = new Date().toISOString();
    
    // 카드가 공개된 상태라면 즉시 결과 재계산
    let result: GameResult | undefined;
    if (room.gameState === GameState.REVEALED) {
      result = this.calculateGameResult(room);
    }
    
    return { room, user, result };
  }
  
  // 카드 공개 (3초 카운트다운 시작)
  startRevealCountdown(socketId: string, io: any): { room: Room } {
    const roomId = this.userRoomMap.get(socketId);
    if (!roomId) throw new Error(ERROR_MESSAGES[ERROR_CODES.USER_NOT_IN_ROOM]);
    
    const room = this.rooms.get(roomId);
    if (!room) throw new Error(ERROR_MESSAGES[ERROR_CODES.ROOM_NOT_FOUND]);
    
    if (room.gameState !== GameState.SELECTING) {
      throw new Error(ERROR_MESSAGES[ERROR_CODES.CARDS_ALREADY_REVEALED]);
    }
    
    if (room.isRevealCountdownActive) {
      throw new Error('카드 공개가 이미 진행 중입니다');
    }
    
    // 카운트다운 시작
    room.isRevealCountdownActive = true;
    room.lastActivity = new Date().toISOString();
    
    console.log(`🕒 카드 공개 카운트다운 시작: 방 ${room.id}`);
    
    let countdown = 3; // 3초 카운트다운
    
    // 카운트다운 시작 이벤트 전송
    io.to(room.id).emit(SOCKET_EVENTS.REVEAL_COUNTDOWN, {
      roomId: room.id,
      remainingTime: countdown,
      isStarted: true
    });
    
    const countdownInterval = setInterval(() => {
      countdown--;
      
      if (countdown > 0) {
        // 카운트다운 업데이트
        io.to(room.id).emit(SOCKET_EVENTS.REVEAL_COUNTDOWN, {
          roomId: room.id,
          remainingTime: countdown,
          isStarted: true
        });
        console.log(`⏰ 카드 공개 카운트다운: ${countdown}초 남음`);
      } else {
        // 카운트다운 완료 - 카드 공개
        clearInterval(countdownInterval);
        
        if (room.revealTimer) {
          clearTimeout(room.revealTimer);
        }
        
        room.gameState = GameState.REVEALED;
        room.isRevealCountdownActive = false;
        room.lastActivity = new Date().toISOString();
        
        const result = this.calculateGameResult(room);
        
        // 카드 공개 이벤트 전송
        io.to(room.id).emit(SOCKET_EVENTS.CARDS_REVEALED, {
          roomId: room.id,
          gameState: room.gameState,
          result
        });
        
        console.log(`✅ 카드 공개 완료: 방 ${room.id}, 평균: ${result.average}`);
      }
    }, 1000); // 1초마다 실행
    
    return { room };
  }
  
  // 즉시 카드 공개 (기존 메서드 - 내부적으로만 사용)
  revealCardsImmediately(socketId: string): { room: Room, result: GameResult } {
    const roomId = this.userRoomMap.get(socketId);
    if (!roomId) throw new Error(ERROR_MESSAGES[ERROR_CODES.USER_NOT_IN_ROOM]);
    
    const room = this.rooms.get(roomId);
    if (!room) throw new Error(ERROR_MESSAGES[ERROR_CODES.ROOM_NOT_FOUND]);
    
    if (room.gameState !== GameState.SELECTING) {
      throw new Error(ERROR_MESSAGES[ERROR_CODES.CARDS_ALREADY_REVEALED]);
    }
    
    room.gameState = GameState.REVEALED;
    room.lastActivity = new Date().toISOString();
    
    const result = this.calculateGameResult(room);
    return { room, result };
  }
  
  // 라운드 초기화
  resetRound(socketId: string): Room {
    const roomId = this.userRoomMap.get(socketId);
    if (!roomId) throw new Error(ERROR_MESSAGES[ERROR_CODES.USER_NOT_IN_ROOM]);
    
    const room = this.rooms.get(roomId);
    if (!room) throw new Error(ERROR_MESSAGES[ERROR_CODES.ROOM_NOT_FOUND]);
    
    // 진행 중인 카운트다운 정리
    if (room.revealTimer) {
      clearTimeout(room.revealTimer);
      room.revealTimer = undefined;
    }
    room.isRevealCountdownActive = false;
    
    room.gameState = GameState.SELECTING;
    room.lastActivity = new Date().toISOString();
    
    // 모든 사용자 카드 선택 초기화
    for (const user of room.users.values()) {
      delete user.selectedCard;
    }
    
    return room;
  }
  
  // 사용자 이름 변경
  updateUserName(socketId: string, newName: string): { room: Room, user: User } {
    const roomId = this.userRoomMap.get(socketId);
    if (!roomId) throw new Error(ERROR_MESSAGES[ERROR_CODES.USER_NOT_IN_ROOM]);
    
    const room = this.rooms.get(roomId);
    if (!room) throw new Error(ERROR_MESSAGES[ERROR_CODES.ROOM_NOT_FOUND]);
    
    const user = Array.from(room.users.values()).find(u => u.socketId === socketId);
    if (!user) throw new Error(ERROR_MESSAGES[ERROR_CODES.USER_NOT_FOUND]);
    
    if (!Utils.validateUserName(newName)) {
      throw new Error(ERROR_MESSAGES[ERROR_CODES.INVALID_USER_NAME]);
    }
    
    // 이름 중복 처리
    const existingNames = Array.from(room.users.values())
      .filter(u => u.id !== user.id)
      .map(u => u.name);
    
    user.originalName = newName;
    user.name = Utils.generateUniqueName(newName, existingNames);
    user.lastActivity = new Date().toISOString();
    room.lastActivity = new Date().toISOString();
    
    return { room, user };
  }
  
  // 방 이름 변경
  updateRoomName(socketId: string, newName: string): Room {
    const roomId = this.userRoomMap.get(socketId);
    if (!roomId) throw new Error(ERROR_MESSAGES[ERROR_CODES.USER_NOT_IN_ROOM]);
    
    const room = this.rooms.get(roomId);
    if (!room) throw new Error(ERROR_MESSAGES[ERROR_CODES.ROOM_NOT_FOUND]);
    
    if (!Utils.validateRoomName(newName)) {
      throw new Error(ERROR_MESSAGES[ERROR_CODES.INVALID_ROOM_NAME]);
    }
    
    room.name = newName;
    room.lastActivity = new Date().toISOString();
    
    return room;
  }
  
  // 방 정보 조회
  getRoom(roomId: string): Room | null {
    return this.rooms.get(roomId) || null;
  }
  
  // 사용자가 속한 방 조회
  getUserRoom(socketId: string): Room | null {
    const roomId = this.userRoomMap.get(socketId);
    return roomId ? this.rooms.get(roomId) || null : null;
  }
  
  // 활성 방 목록 조회 (모든 방 포함)
  getActiveRooms(): SharedRoom[] {
    const activeRooms: SharedRoom[] = [];
    
    for (const room of this.rooms.values()) {
      // 참여자가 0명인 방도 목록에 포함
      activeRooms.push(this.serializeRoom(room));
    }
    
    // 생성 시간 기준으로 정렬 (최신순)
    return activeRooms.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
  
  // 게임 결과 계산
  calculateGameResult(room: Room): GameResult {
    const users = Array.from(room.users.values());
    const cards: { [userId: string]: any } = {};
    const selectedCards: string[] = [];
    
    for (const user of users) {
      if (user.selectedCard) {
        cards[user.id] = user.selectedCard;
        selectedCards.push(user.selectedCard);
      }
    }
    
    const average = Utils.calculateAverage(selectedCards);
    const validVotes = selectedCards.filter(card => Utils.isNumericCard(card)).length;
    
    return {
      totalUsers: users.length,
      votedUsers: selectedCards.length,
      cards,
      average,
      validVotes
    };
  }
  
  // 방 ID 생성
  private generateRoomId(): string {
    let roomId: string;
    do {
      roomId = Math.random().toString(36).substr(2, 6).toUpperCase();
    } while (this.rooms.has(roomId));
    return roomId;
  }
  
  // Room을 직렬화 가능한 형태로 변환
  serializeRoom(room: Room): SharedRoom {
    return {
      ...room,
      users: Array.from(room.users.values()).map(user => ({
        id: user.id,
        name: user.name,
        originalName: user.originalName,
        roomId: user.roomId,
        selectedCard: user.selectedCard,
        isConnected: user.isConnected,
        joinedAt: user.joinedAt,
        lastActivity: user.lastActivity
      }))
    };
  }
}

// 글로벌 게임 스토어 인스턴스
const gameStore = new GameStore();

// Socket.io 이벤트 핸들러 등록
export function setupSocketHandlers(io: Server) {
  io.on(SOCKET_EVENTS.CONNECTION, (socket: Socket) => {
    console.log(`사용자 연결됨: ${socket.id}`);
    
    // 핑/퐁 이벤트 처리 (모바일 연결 안정성을 위한 하트비트)
    socket.on('ping', () => {
      console.log(`🏓 Ping 수신: ${socket.id}`);
      socket.emit('pong');
    });
    
    // 방 생성
    socket.on(SOCKET_EVENTS.CREATE_ROOM, (data: CreateRoomPayload, callback: (response: CreateRoomResponse) => void) => {
      try {
        console.log(`🔍 방 생성 시도: ${data.userName} -> 방이름 "${data.roomName}"`);
        
        if (!Utils.validateRoomName(data.roomName)) {
          return callback({
            success: false,
            error: { code: ERROR_CODES.INVALID_ROOM_NAME, message: ERROR_MESSAGES[ERROR_CODES.INVALID_ROOM_NAME] }
          });
        }
        
        if (!Utils.validateUserName(data.userName)) {
          return callback({
            success: false,
            error: { code: ERROR_CODES.INVALID_USER_NAME, message: ERROR_MESSAGES[ERROR_CODES.INVALID_USER_NAME] }
          });
        }
        
        const user: User = {
          id: uuidv4(),
          name: data.userName,
          originalName: data.userName,
          roomId: '',
          isConnected: true,
          joinedAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
          socketId: socket.id
        };
        
        const room = gameStore.createRoom(data.roomName, user);
        user.roomId = room.id;
        
        console.log(`🔍 방 생성 후 상태: 방 ${room.id} 사용자 수: ${room.users.size}`);
        
        // 소켓을 방에 참여
        socket.join(room.id);
        console.log(`🔍 소켓 방 참여: ${socket.id} -> 방 ${room.id}`);
        
        const serializedRoom = gameStore.serializeRoom(room);
        const serializedUser = { ...user };
        delete (serializedUser as any).socketId;
        
        console.log(`🔍 직렬화된 방 정보: 사용자 수 ${serializedRoom.users.length}`);
        
        callback({
          success: true,
          room: serializedRoom,
          user: serializedUser
        });
        
        console.log(`✅ 방 생성 완료: ${room.id} by ${user.name}`);
      } catch (error) {
        console.error('❌ 방 생성 실패:', error);
        callback({
          success: false,
          error: { code: ERROR_CODES.INTERNAL_ERROR, message: (error as Error).message }
        });
      }
    });
    
    // 방 참여
    socket.on(SOCKET_EVENTS.JOIN_ROOM, (data: JoinRoomPayload, callback: (response: JoinRoomResponse) => void) => {
      try {
        console.log(`🔍 방 참여 시도: ${data.userName} -> 방 ${data.roomId}`);
        
        if (!Utils.validateUserName(data.userName)) {
          return callback({
            success: false,
            error: { code: ERROR_CODES.INVALID_USER_NAME, message: ERROR_MESSAGES[ERROR_CODES.INVALID_USER_NAME] }
          });
        }
        
        const user: User = {
          id: uuidv4(),
          name: data.userName,
          originalName: data.userName,
          roomId: data.roomId,
          isConnected: true,
          joinedAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
          socketId: socket.id
        };
        
        console.log(`🔍 방 참여 전 방 상태 확인: 방 ${data.roomId} 사용자 수: ${gameStore.getRoom(data.roomId)?.users.size || 0}`);
        
        const room = gameStore.joinRoom(data.roomId, user);
        
        console.log(`🔍 방 참여 후 방 상태: 방 ${room.id} 사용자 수: ${room.users.size}`);
        
        // 소켓을 방에 참여
        socket.join(room.id);
        console.log(`🔍 소켓 방 참여: ${socket.id} -> 방 ${room.id}`);
        
        const serializedRoom = gameStore.serializeRoom(room);
        const serializedUser = { ...user };
        delete (serializedUser as any).socketId;
        
        console.log(`🔍 직렬화된 방 정보: 사용자 수 ${serializedRoom.users.length}`);
        
        callback({
          success: true,
          room: serializedRoom,
          user: serializedUser
        });
        
        // 다른 사용자들에게 새 사용자 참여 알림
        const roomUpdateEvent = {
          room: serializedRoom,
          type: 'user_joined',
          user: serializedUser
        } as RoomUpdateEvent;
        
        console.log(`🔍 브로드캐스트 전송: ROOM_UPDATE to room ${room.id}`, roomUpdateEvent);
        socket.to(room.id).emit(SOCKET_EVENTS.ROOM_UPDATE, roomUpdateEvent);
        
        // 카드가 공개된 상태라면 새로운 사용자에게 현재 게임 결과 전송
        if (room.gameState === GameState.REVEALED) {
          const currentResult = gameStore.calculateGameResult(room);
          socket.emit(SOCKET_EVENTS.CARDS_REVEALED, {
            roomId: room.id,
            gameState: room.gameState,
            result: currentResult
          } as GameUpdateEvent);
          
          console.log(`🔍 새 사용자에게 현재 게임 결과 전송: ${user.name}, 평균: ${currentResult.average}`);
        }
        
        console.log(`✅ 사용자 참여 완료: ${user.name} -> 방 ${room.id}`);
      } catch (error) {
        console.error('❌ 방 참여 실패:', error);
        callback({
          success: false,
          error: { code: ERROR_CODES.ROOM_NOT_FOUND, message: (error as Error).message }
        });
      }
    });
    
    // 카드 선택
    socket.on(SOCKET_EVENTS.SELECT_CARD, (data: SelectCardPayload, callback: (response: CardSelectionResponse) => void) => {
      try {
        const { room, user, result } = gameStore.selectCard(socket.id, data.card);
        
        const serializedRoom = gameStore.serializeRoom(room);
        const serializedUser = { ...user };
        delete (serializedUser as any).socketId;
        
        callback({
          success: true,
          user: serializedUser,
          result: result
        });
        
        // 방의 모든 사용자에게 업데이트 브로드캐스트
        io.to(room.id).emit(SOCKET_EVENTS.USER_UPDATE, {
          roomId: room.id,
          user: serializedUser,
          action: 'card_selected'
        } as UserUpdateEvent);
        
        // 카드가 공개된 상태에서 변경했다면 게임 결과도 브로드캐스트
        if (room.gameState === GameState.REVEALED && result) {
          io.to(room.id).emit(SOCKET_EVENTS.CARDS_REVEALED, {
            roomId: room.id,
            gameState: room.gameState,
            result
          } as GameUpdateEvent);
          
          console.log(`🔄 카드 변경으로 실시간 결과 업데이트: ${user.name} -> ${data.card}, 평균: ${result.average}`);
        } else {
          console.log(`카드 선택: ${user.name} -> ${data.card}`);
        }
      } catch (error) {
        console.error('카드 선택 실패:', error);
        callback({
          success: false,
          error: { code: ERROR_CODES.INVALID_CARD, message: (error as Error).message }
        });
      }
    });
    
    // 카드 공개 (3초 카운트다운 시작)
    socket.on(SOCKET_EVENTS.REVEAL_CARDS, (data: RevealCardsPayload, callback: (response: ApiResponse) => void) => {
      try {
        const { room } = gameStore.startRevealCountdown(socket.id, io);
        
        callback({ success: true });
        
        console.log(`카드 공개 카운트다운 시작: 방 ${room.id}`);
      } catch (error) {
        console.error('카드 공개 실패:', error);
        callback({
          success: false,
          error: (error as Error).message
        });
      }
    });
    
    // 라운드 초기화
    socket.on(SOCKET_EVENTS.RESET_ROUND, (data: ResetRoundPayload, callback: (response: ApiResponse) => void) => {
      try {
        const room = gameStore.resetRound(socket.id);
        
        callback({ success: true });
        
        // 방의 모든 사용자에게 라운드 리셋 알림
        io.to(room.id).emit(SOCKET_EVENTS.ROUND_RESET, {
          roomId: room.id,
          gameState: room.gameState
        } as GameUpdateEvent);
        
        console.log(`라운드 리셋: 방 ${room.id}`);
      } catch (error) {
        console.error('라운드 리셋 실패:', error);
        callback({
          success: false,
          error: (error as Error).message
        });
      }
    });
    
    // 사용자 이름 변경
    socket.on(SOCKET_EVENTS.UPDATE_USER_NAME, (data: UpdateUserNamePayload, callback: (response: ApiResponse) => void) => {
      try {
        const { room, user } = gameStore.updateUserName(socket.id, data.newName);
        
        callback({ success: true });
        
        const serializedRoom = gameStore.serializeRoom(room);
        const serializedUser = { ...user };
        delete (serializedUser as any).socketId;
        
        // 방의 모든 사용자에게 이름 변경 알림
        io.to(room.id).emit(SOCKET_EVENTS.ROOM_UPDATE, {
          room: serializedRoom,
          type: 'user_updated',
          user: serializedUser
        } as RoomUpdateEvent);
        
        console.log(`이름 변경: ${user.originalName} -> ${user.name}`);
      } catch (error) {
        console.error('이름 변경 실패:', error);
        callback({
          success: false,
          error: (error as Error).message
        });
      }
    });
    
    // 방 이름 변경
    socket.on(SOCKET_EVENTS.UPDATE_ROOM_NAME, (data: UpdateRoomNamePayload, callback: (response: ApiResponse) => void) => {
      try {
        const room = gameStore.updateRoomName(socket.id, data.newName);
        
        callback({ success: true });
        
        const serializedRoom = gameStore.serializeRoom(room);
        
        // 방의 모든 사용자에게 방 이름 변경 알림
        io.to(room.id).emit(SOCKET_EVENTS.ROOM_UPDATE, {
          room: serializedRoom,
          type: 'game_state_changed'
        } as RoomUpdateEvent);
        
        console.log(`방 이름 변경: ${room.id} -> ${room.name}`);
      } catch (error) {
        console.error('방 이름 변경 실패:', error);
        callback({
          success: false,
          error: (error as Error).message
        });
      }
    });
    
    // 방 나가기
    socket.on(SOCKET_EVENTS.LEAVE_ROOM, (data: { roomId: string }, callback: (response: ApiResponse) => void) => {
      try {
        const { room, user } = gameStore.leaveRoom(socket.id);
        
        if (room && user) {
          socket.leave(room.id);
          
          const serializedRoom = gameStore.serializeRoom(room);
          const serializedUser = { ...user };
          delete (serializedUser as any).socketId;
          
          // 다른 사용자들에게 사용자 나감 알림
          socket.to(room.id).emit(SOCKET_EVENTS.ROOM_UPDATE, {
            room: serializedRoom,
            type: 'user_left',
            user: serializedUser
          } as RoomUpdateEvent);
          
          console.log(`사용자 나감: ${user.name} <- 방 ${room.id}`);
        }
        
        callback({ success: true });
      } catch (error) {
        console.error('방 나가기 실패:', error);
        callback({
          success: false,
          error: (error as Error).message
        });
      }
    });
    
    // 방 목록 조회
    socket.on(SOCKET_EVENTS.GET_ROOM_LIST, (callback: (response: ApiResponse<SharedRoom[]>) => void) => {
      try {
        const activeRooms = gameStore.getActiveRooms();
        
        callback({
          success: true,
          data: activeRooms
        });
        
        console.log(`방 목록 조회: ${activeRooms.length}개 방 반환`);
      } catch (error) {
        console.error('방 목록 조회 실패:', error);
        callback({
          success: false,
          error: (error as Error).message
        });
      }
    });
    
    // 연결 해제
    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      console.log(`사용자 연결 해제됨: ${socket.id}`);
      
      try {
        const { room, user } = gameStore.leaveRoom(socket.id);
        
        if (room && user) {
          const serializedRoom = gameStore.serializeRoom(room);
          const serializedUser = { ...user };
          delete (serializedUser as any).socketId;
          
          // 다른 사용자들에게 사용자 나감 알림
          socket.to(room.id).emit(SOCKET_EVENTS.ROOM_UPDATE, {
            room: serializedRoom,
            type: 'user_left',
            user: serializedUser
          } as RoomUpdateEvent);
          
          console.log(`연결 해제로 사용자 제거: ${user.name} <- 방 ${room.id}`);
        }
      } catch (error) {
        console.error('연결 해제 처리 실패:', error);
      }
    });
  });
} 