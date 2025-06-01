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
    
    // 방이 비었으면 삭제
    if (room.users.size === 0) {
      this.rooms.delete(roomId);
      return { room: null, user };
    }
    
    return { room, user };
  }
  
  // 카드 선택
  selectCard(socketId: string, card: string): { room: Room, user: User } {
    const roomId = this.userRoomMap.get(socketId);
    if (!roomId) throw new Error(ERROR_MESSAGES[ERROR_CODES.USER_NOT_IN_ROOM]);
    
    const room = this.rooms.get(roomId);
    if (!room) throw new Error(ERROR_MESSAGES[ERROR_CODES.ROOM_NOT_FOUND]);
    
    const user = Array.from(room.users.values()).find(u => u.socketId === socketId);
    if (!user) throw new Error(ERROR_MESSAGES[ERROR_CODES.USER_NOT_FOUND]);
    
    if (room.gameState !== GameState.SELECTING) {
      throw new Error(ERROR_MESSAGES[ERROR_CODES.GAME_NOT_IN_PROGRESS]);
    }
    
    if (!GAME_CONFIG.CARDS.includes(card as any)) {
      throw new Error(ERROR_MESSAGES[ERROR_CODES.INVALID_CARD]);
    }
    
    user.selectedCard = card as any;
    user.lastActivity = new Date().toISOString();
    room.lastActivity = new Date().toISOString();
    
    return { room, user };
  }
  
  // 카드 공개
  revealCards(socketId: string): { room: Room, result: GameResult } {
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
  
  // 방 정보 조회
  getRoom(roomId: string): Room | null {
    return this.rooms.get(roomId) || null;
  }
  
  // 사용자가 속한 방 조회
  getUserRoom(socketId: string): Room | null {
    const roomId = this.userRoomMap.get(socketId);
    return roomId ? this.rooms.get(roomId) || null : null;
  }
  
  // 게임 결과 계산
  private calculateGameResult(room: Room): GameResult {
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
    
    // 방 생성
    socket.on(SOCKET_EVENTS.CREATE_ROOM, (data: CreateRoomPayload, callback: (response: CreateRoomResponse) => void) => {
      try {
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
        
        // 소켓을 방에 참여
        socket.join(room.id);
        
        const serializedRoom = gameStore.serializeRoom(room);
        const serializedUser = { ...user };
        delete (serializedUser as any).socketId;
        
        callback({
          success: true,
          room: serializedRoom,
          user: serializedUser
        });
        
        console.log(`방 생성됨: ${room.id} by ${user.name}`);
      } catch (error) {
        console.error('방 생성 실패:', error);
        callback({
          success: false,
          error: { code: ERROR_CODES.INTERNAL_ERROR, message: (error as Error).message }
        });
      }
    });
    
    // 방 참여
    socket.on(SOCKET_EVENTS.JOIN_ROOM, (data: JoinRoomPayload, callback: (response: JoinRoomResponse) => void) => {
      try {
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
        
        const room = gameStore.joinRoom(data.roomId, user);
        
        // 소켓을 방에 참여
        socket.join(room.id);
        
        const serializedRoom = gameStore.serializeRoom(room);
        const serializedUser = { ...user };
        delete (serializedUser as any).socketId;
        
        callback({
          success: true,
          room: serializedRoom,
          user: serializedUser
        });
        
        // 다른 사용자들에게 새 사용자 참여 알림
        socket.to(room.id).emit(SOCKET_EVENTS.ROOM_UPDATE, {
          room: serializedRoom,
          type: 'user_joined',
          user: serializedUser
        } as RoomUpdateEvent);
        
        console.log(`사용자 참여: ${user.name} -> 방 ${room.id}`);
      } catch (error) {
        console.error('방 참여 실패:', error);
        callback({
          success: false,
          error: { code: ERROR_CODES.ROOM_NOT_FOUND, message: (error as Error).message }
        });
      }
    });
    
    // 카드 선택
    socket.on(SOCKET_EVENTS.SELECT_CARD, (data: SelectCardPayload, callback: (response: CardSelectionResponse) => void) => {
      try {
        const { room, user } = gameStore.selectCard(socket.id, data.card);
        
        const serializedRoom = gameStore.serializeRoom(room);
        const serializedUser = { ...user };
        delete (serializedUser as any).socketId;
        
        callback({
          success: true,
          user: serializedUser
        });
        
        // 방의 모든 사용자에게 업데이트 브로드캐스트
        io.to(room.id).emit(SOCKET_EVENTS.USER_UPDATE, {
          roomId: room.id,
          user: serializedUser,
          action: 'card_selected'
        } as UserUpdateEvent);
        
        console.log(`카드 선택: ${user.name} -> ${data.card}`);
      } catch (error) {
        console.error('카드 선택 실패:', error);
        callback({
          success: false,
          error: { code: ERROR_CODES.INVALID_CARD, message: (error as Error).message }
        });
      }
    });
    
    // 카드 공개
    socket.on(SOCKET_EVENTS.REVEAL_CARDS, (data: RevealCardsPayload, callback: (response: ApiResponse) => void) => {
      try {
        const { room, result } = gameStore.revealCards(socket.id);
        
        callback({ success: true });
        
        // 방의 모든 사용자에게 카드 공개 알림
        io.to(room.id).emit(SOCKET_EVENTS.CARDS_REVEALED, {
          roomId: room.id,
          gameState: room.gameState,
          result
        } as GameUpdateEvent);
        
        console.log(`카드 공개됨: 방 ${room.id}, 평균: ${result.average}`);
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