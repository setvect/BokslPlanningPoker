import { Socket, Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import {
  SOCKET_EVENTS,
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
  TypingRoundEndEvent,
  TypingGameState,
  ApiResponse,
  TYPING_GAME_CONFIG,
  TYPING_ERROR_CODES,
  TYPING_ERROR_MESSAGES,
  Utils
} from '../../../shared';
import { TypingRoomInternal, TypingRoomUtils } from '../models/TypingRoom';
import { TypingPlayerInternal, TypingPlayerUtils } from '../models/TypingPlayer';
import { TypingGame } from '../models/TypingGame';

// 타자 게임 스토어
class TypingGameStore {
  private rooms = new Map<string, TypingRoomInternal>();
  private playerRoomMap = new Map<string, string>(); // socketId -> roomId

  // 방 생성
  createRoom(roomName: string, creator: TypingPlayerInternal): TypingRoomInternal {
    const roomId = this.generateRoomId();

    const room = TypingRoomUtils.createRoom({
      id: roomId,
      name: roomName,
    });

    TypingRoomUtils.addPlayer(room, creator);
    this.rooms.set(roomId, room);
    this.playerRoomMap.set(creator.socketId, roomId);
    creator.roomId = roomId;

    return room;
  }

  // 방 참여
  joinRoom(roomId: string, player: TypingPlayerInternal): { room: TypingRoomInternal; isSpectator: boolean } {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error(TYPING_ERROR_MESSAGES[TYPING_ERROR_CODES.ROOM_NOT_FOUND]);
    }

    if (room.players.size >= room.maxPlayers) {
      throw new Error(TYPING_ERROR_MESSAGES[TYPING_ERROR_CODES.ROOM_FULL]);
    }

    // 게임 진행 중이면 관전자로 참여
    const isSpectator = room.gameState === TypingGameState.PLAYING ||
                        room.gameState === TypingGameState.COUNTDOWN;
    player.isSpectator = isSpectator;

    // 이름 중복 처리
    const existingNames = Array.from(room.players.values()).map(p => p.name);
    player.name = TypingPlayerUtils.generateUniqueName(player.originalName, existingNames);

    TypingRoomUtils.addPlayer(room, player);
    this.playerRoomMap.set(player.socketId, roomId);
    player.roomId = roomId;

    return { room, isSpectator };
  }

  // 방 나가기
  leaveRoom(socketId: string): { room: TypingRoomInternal | null; player: TypingPlayerInternal | null } {
    const roomId = this.playerRoomMap.get(socketId);
    if (!roomId) {
      return { room: null, player: null };
    }

    const room = this.rooms.get(roomId);
    if (!room) {
      return { room: null, player: null };
    }

    const player = Array.from(room.players.values()).find(p => p.socketId === socketId);
    if (!player) {
      return { room: null, player: null };
    }

    TypingRoomUtils.removePlayer(room, player.id);
    this.playerRoomMap.delete(socketId);

    // 방이 비었으면 타이머 정리 후 삭제
    if (room.players.size === 0) {
      TypingRoomUtils.clearTimers(room);
      this.rooms.delete(roomId);
    }

    return { room, player };
  }

  // 방 조회
  getRoom(roomId: string): TypingRoomInternal | undefined {
    return this.rooms.get(roomId);
  }

  // 소켓 ID로 방 조회
  getRoomBySocketId(socketId: string): TypingRoomInternal | undefined {
    const roomId = this.playerRoomMap.get(socketId);
    return roomId ? this.rooms.get(roomId) : undefined;
  }

  // 소켓 ID로 플레이어 조회
  getPlayerBySocketId(socketId: string): TypingPlayerInternal | undefined {
    const room = this.getRoomBySocketId(socketId);
    if (!room) {
      return undefined;
    }
    return Array.from(room.players.values()).find(p => p.socketId === socketId);
  }

  // 활성 방 목록
  getActiveRooms(): TypingRoomListItem[] {
    const rooms: TypingRoomListItem[] = [];

    for (const room of this.rooms.values()) {
      rooms.push({
        id: room.id,
        name: room.name,
        playerCount: room.players.size,
        maxPlayers: room.maxPlayers,
        gameState: room.gameState,
        roundNumber: room.roundNumber,
      });
    }

    // 생성 시간 기준으로 정렬 (최신순)
    return rooms.sort((a, b) => {
      const roomA = this.rooms.get(a.id);
      const roomB = this.rooms.get(b.id);
      if (!roomA || !roomB) {
        return 0;
      }
      return roomB.createdAt.getTime() - roomA.createdAt.getTime();
    });
  }

  // 방 ID 생성
  private generateRoomId(): string {
    let roomId: string;
    do {
      roomId = 'T' + Math.random().toString(36).substr(2, 5).toUpperCase();
    } while (this.rooms.has(roomId));
    return roomId;
  }
}

// 글로벌 타자 게임 스토어 인스턴스
const typingStore = new TypingGameStore();

// 다음 라운드 시작 함수
function startNextRound(room: TypingRoomInternal, io: Server) {
  // WAITING 상태로 전환 (3초 대기)
  room.gameState = TypingGameState.WAITING;
  room.countdownRemaining = TYPING_GAME_CONFIG.NEXT_ROUND_DELAY;

  io.to(room.id).emit(SOCKET_EVENTS.TYPING_COUNTDOWN, {
    roomId: room.id,
    count: room.countdownRemaining,
    type: 'next_round',
  } as TypingCountdownEvent);

  // WAITING 카운트다운
  const waitingInterval = setInterval(() => {
    room.countdownRemaining!--;

    if (room.countdownRemaining! > 0) {
      io.to(room.id).emit(SOCKET_EVENTS.TYPING_COUNTDOWN, {
        roomId: room.id,
        count: room.countdownRemaining,
        type: 'next_round',
      } as TypingCountdownEvent);
    } else {
      clearInterval(waitingInterval);
      // 게임 시작 카운트다운으로 전환
      startGameCountdown(room, io);
    }
  }, 1000);

  room.countdownTimer = waitingInterval;
}

// 게임 시작 카운트다운 함수
function startGameCountdown(room: TypingRoomInternal, io: Server) {
  // 문장 선택 및 라운드 초기화
  const sentence = TypingGame.getRandomSentence(room.lastSentenceId);
  TypingRoomUtils.resetForNewRound(room, sentence);

  // COUNTDOWN 상태로 전환
  room.gameState = TypingGameState.COUNTDOWN;
  room.countdownRemaining = TYPING_GAME_CONFIG.COUNTDOWN_SECONDS;

  io.to(room.id).emit(SOCKET_EVENTS.TYPING_COUNTDOWN, {
    roomId: room.id,
    count: room.countdownRemaining,
    type: 'game_start',
  } as TypingCountdownEvent);

  // 카운트다운
  const countdownInterval = setInterval(() => {
    room.countdownRemaining!--;

    if (room.countdownRemaining! > 0) {
      io.to(room.id).emit(SOCKET_EVENTS.TYPING_COUNTDOWN, {
        roomId: room.id,
        count: room.countdownRemaining,
        type: 'game_start',
      } as TypingCountdownEvent);
    } else {
      clearInterval(countdownInterval);

      // 게임 시작
      TypingRoomUtils.startRound(room);

      io.to(room.id).emit(SOCKET_EVENTS.TYPING_ROUND_START, {
        roomId: room.id,
        sentence: room.currentSentence,
        roundNumber: room.roundNumber,
        startedAt: room.roundStartedAt?.toISOString() || new Date().toISOString(),
      } as TypingRoundStartEvent);

      console.log(`🎮 타자 게임 라운드 ${room.roundNumber} 시작: 방 ${room.id}`);
    }
  }, 1000);

  room.countdownTimer = countdownInterval;
}

// Socket.io 타자 게임 이벤트 핸들러 등록
export function setupTypingHandlers(io: Server) {
  io.on(SOCKET_EVENTS.CONNECTION, (socket: Socket) => {
    // 타자 게임 방 생성
    socket.on(SOCKET_EVENTS.TYPING_CREATE_ROOM, (data: CreateTypingRoomPayload, callback: (response: CreateTypingRoomResponse) => void) => {
      try {
        console.log(`🎮 타자 게임 방 생성 시도: ${data.playerName} -> 방이름 "${data.roomName}"`);

        if (!Utils.validateRoomName(data.roomName)) {
          return callback({
            success: false,
            error: { code: TYPING_ERROR_CODES.ROOM_NOT_FOUND, message: '올바르지 않은 방 이름입니다.' },
          });
        }

        if (!Utils.validateUserName(data.playerName)) {
          return callback({
            success: false,
            error: { code: TYPING_ERROR_CODES.PLAYER_NOT_FOUND, message: '올바르지 않은 사용자 이름입니다.' },
          });
        }

        const player = TypingPlayerUtils.createPlayer({
          id: uuidv4(),
          socketId: socket.id,
          name: data.playerName,
          roomId: '',
        });

        const room = typingStore.createRoom(data.roomName, player);

        // 소켓을 방에 참여
        socket.join(room.id);

        callback({
          success: true,
          data: {
            room: TypingRoomUtils.serialize(room),
            playerId: player.id,
          },
        });

        console.log(`✅ 타자 게임 방 생성 완료: ${room.id} by ${player.name}`);
      } catch (error) {
        console.error('❌ 타자 게임 방 생성 실패:', error);
        callback({
          success: false,
          error: { code: TYPING_ERROR_CODES.ROOM_NOT_FOUND, message: (error as Error).message },
        });
      }
    });

    // 타자 게임 방 참여
    socket.on(SOCKET_EVENTS.TYPING_JOIN_ROOM, (data: JoinTypingRoomPayload, callback: (response: JoinTypingRoomResponse) => void) => {
      try {
        console.log(`🎮 타자 게임 방 참여 시도: ${data.playerName} -> 방 ${data.roomId}`);

        if (!Utils.validateUserName(data.playerName)) {
          return callback({
            success: false,
            error: { code: TYPING_ERROR_CODES.PLAYER_NOT_FOUND, message: '올바르지 않은 사용자 이름입니다.' },
          });
        }

        const player = TypingPlayerUtils.createPlayer({
          id: uuidv4(),
          socketId: socket.id,
          name: data.playerName,
          roomId: data.roomId,
        });

        const { room, isSpectator } = typingStore.joinRoom(data.roomId, player);

        // 소켓을 방에 참여
        socket.join(room.id);

        const serializedRoom = TypingRoomUtils.serialize(room);

        callback({
          success: true,
          data: {
            room: serializedRoom,
            playerId: player.id,
            isSpectator,
          },
        });

        // 다른 사용자들에게 새 사용자 참여 알림
        socket.to(room.id).emit(SOCKET_EVENTS.TYPING_ROOM_UPDATE, {
          room: serializedRoom,
          type: 'player_joined',
          player: TypingPlayerUtils.serialize(player),
        } as TypingRoomUpdateEvent);

        console.log(`✅ 타자 게임 방 참여 완료: ${player.name} -> 방 ${room.id} (관전: ${isSpectator})`);
      } catch (error) {
        console.error('❌ 타자 게임 방 참여 실패:', error);
        callback({
          success: false,
          error: { code: TYPING_ERROR_CODES.ROOM_NOT_FOUND, message: (error as Error).message },
        });
      }
    });

    // 타자 게임 방 나가기
    socket.on(SOCKET_EVENTS.TYPING_LEAVE_ROOM, (data: LeaveTypingRoomPayload, callback: (response: ApiResponse) => void) => {
      try {
        const { room, player } = typingStore.leaveRoom(socket.id);

        if (room && player) {
          socket.leave(room.id);

          const serializedRoom = TypingRoomUtils.serialize(room);
          const serializedPlayer = TypingPlayerUtils.serialize(player);

          // 다른 사용자들에게 사용자 나감 알림
          socket.to(room.id).emit(SOCKET_EVENTS.TYPING_ROOM_UPDATE, {
            room: serializedRoom,
            type: 'player_left',
            player: serializedPlayer,
          } as TypingRoomUpdateEvent);

          console.log(`👋 타자 게임 방 나감: ${player.name} <- 방 ${room.id}`);
        }

        callback({ success: true });
      } catch (error) {
        console.error('❌ 타자 게임 방 나가기 실패:', error);
        callback({
          success: false,
          error: (error as Error).message,
        });
      }
    });

    // 타자 게임 방 목록 조회
    socket.on(SOCKET_EVENTS.TYPING_GET_ROOM_LIST, (callback: (response: ApiResponse<TypingRoomListItem[]>) => void) => {
      try {
        const rooms = typingStore.getActiveRooms();

        callback({
          success: true,
          data: rooms,
        });

        console.log(`📋 타자 게임 방 목록 조회: ${rooms.length}개 방 반환`);
      } catch (error) {
        console.error('❌ 타자 게임 방 목록 조회 실패:', error);
        callback({
          success: false,
          error: (error as Error).message,
        });
      }
    });

    // 타자 게임 시작
    socket.on(SOCKET_EVENTS.TYPING_START_GAME, (data: StartTypingGamePayload, callback: (response: StartTypingGameResponse) => void) => {
      try {
        const room = typingStore.getRoomBySocketId(socket.id);
        if (!room) {
          throw new Error(TYPING_ERROR_MESSAGES[TYPING_ERROR_CODES.ROOM_NOT_FOUND]);
        }

        if (room.gameState !== TypingGameState.WAITING) {
          throw new Error(TYPING_ERROR_MESSAGES[TYPING_ERROR_CODES.GAME_IN_PROGRESS]);
        }

        if (room.players.size < TYPING_GAME_CONFIG.MIN_PLAYERS_FOR_GAME) {
          throw new Error(TYPING_ERROR_MESSAGES[TYPING_ERROR_CODES.NOT_ENOUGH_PLAYERS]);
        }

        callback({ success: true });

        // 게임 시작 카운트다운 시작
        startGameCountdown(room, io);

        console.log(`🎮 타자 게임 시작: 방 ${room.id}`);
      } catch (error) {
        console.error('❌ 타자 게임 시작 실패:', error);
        callback({
          success: false,
          error: { code: TYPING_ERROR_CODES.GAME_NOT_STARTED, message: (error as Error).message },
        });
      }
    });

    // 타이핑 입력
    socket.on(SOCKET_EVENTS.TYPING_INPUT, (data: TypingInputPayload, callback: (response: TypingInputResponse) => void) => {
      try {
        const room = typingStore.getRoomBySocketId(socket.id);
        if (!room) {
          throw new Error(TYPING_ERROR_MESSAGES[TYPING_ERROR_CODES.ROOM_NOT_FOUND]);
        }

        const player = typingStore.getPlayerBySocketId(socket.id);
        if (!player) {
          throw new Error(TYPING_ERROR_MESSAGES[TYPING_ERROR_CODES.PLAYER_NOT_FOUND]);
        }

        if (player.isSpectator) {
          throw new Error(TYPING_ERROR_MESSAGES[TYPING_ERROR_CODES.IS_SPECTATOR]);
        }

        if (player.isFinished) {
          throw new Error(TYPING_ERROR_MESSAGES[TYPING_ERROR_CODES.ALREADY_FINISHED]);
        }

        // 붙여넣기 감지
        if (TypingGame.detectPaste(player.currentInput, data.input)) {
          return callback({
            success: false,
            error: { code: TYPING_ERROR_CODES.PASTE_DETECTED, message: TYPING_ERROR_MESSAGES[TYPING_ERROR_CODES.PASTE_DETECTED] },
          });
        }

        const game = new TypingGame(room);
        const result = game.processInput(player.id, data.input);

        if (!result) {
          throw new Error(TYPING_ERROR_MESSAGES[TYPING_ERROR_CODES.INVALID_INPUT]);
        }

        callback({
          success: true,
          isFinished: false,
        });

        // 다른 플레이어들에게 진행 상황 브로드캐스트
        socket.to(room.id).emit(SOCKET_EVENTS.TYPING_PROGRESS, {
          roomId: room.id,
          playerId: player.id,
          playerName: player.name,
          currentInput: player.currentInput,
          progress: player.progress,
          isFinished: false,
        } as TypingProgressEvent);
      } catch (error) {
        callback({
          success: false,
          error: { code: TYPING_ERROR_CODES.INVALID_INPUT, message: (error as Error).message },
        });
      }
    });

    // 타이핑 완료 (Enter 키)
    socket.on(SOCKET_EVENTS.TYPING_SUBMIT, (data: TypingSubmitPayload, callback: (response: TypingSubmitResponse) => void) => {
      try {
        const room = typingStore.getRoomBySocketId(socket.id);
        if (!room) {
          throw new Error(TYPING_ERROR_MESSAGES[TYPING_ERROR_CODES.ROOM_NOT_FOUND]);
        }

        const player = typingStore.getPlayerBySocketId(socket.id);
        if (!player) {
          throw new Error(TYPING_ERROR_MESSAGES[TYPING_ERROR_CODES.PLAYER_NOT_FOUND]);
        }

        if (player.isSpectator) {
          throw new Error(TYPING_ERROR_MESSAGES[TYPING_ERROR_CODES.IS_SPECTATOR]);
        }

        if (player.isFinished) {
          throw new Error(TYPING_ERROR_MESSAGES[TYPING_ERROR_CODES.ALREADY_FINISHED]);
        }

        const game = new TypingGame(room);

        // 오타 확인
        if (game.hasErrors(player.id, player.currentInput)) {
          return callback({
            success: false,
            error: { code: TYPING_ERROR_CODES.HAS_ERRORS, message: TYPING_ERROR_MESSAGES[TYPING_ERROR_CODES.HAS_ERRORS] },
          });
        }

        // 완료 처리
        const finishResult = game.markPlayerFinished(player.id);
        if (!finishResult) {
          throw new Error(TYPING_ERROR_MESSAGES[TYPING_ERROR_CODES.ALREADY_FINISHED]);
        }

        callback({
          success: true,
          data: {
            rank: finishResult.rank,
            timeMs: finishResult.timeMs,
          },
        });

        // 다른 플레이어들에게 완료 알림
        io.to(room.id).emit(SOCKET_EVENTS.TYPING_PLAYER_FINISH, {
          roomId: room.id,
          playerId: player.id,
          playerName: player.name,
          rank: finishResult.rank,
          timeMs: finishResult.timeMs,
        } as TypingPlayerFinishEvent);

        // 1등이면 5초 카운트다운 시작
        if (finishResult.isFirstFinisher) {
          io.to(room.id).emit(SOCKET_EVENTS.TYPING_FIRST_FINISH, {
            roomId: room.id,
            playerId: player.id,
            playerName: player.name,
            timeMs: finishResult.timeMs,
            countdownSeconds: TYPING_GAME_CONFIG.FIRST_FINISH_COUNTDOWN,
          } as TypingFirstFinishEvent);

          console.log(`🏆 1등 완료: ${player.name} (${finishResult.timeMs}ms)`);

          // 5초 후 라운드 종료
          room.roundEndTimer = setTimeout(() => {
            // 라운드 종료
            room.gameState = TypingGameState.ROUND_END;
            const roundResult = game.calculateRoundResult();

            io.to(room.id).emit(SOCKET_EVENTS.TYPING_ROUND_END, {
              roomId: room.id,
              result: roundResult,
              nextRoundIn: TYPING_GAME_CONFIG.NEXT_ROUND_DELAY,
            } as TypingRoundEndEvent);

            console.log(`🏁 라운드 ${room.roundNumber} 종료: 방 ${room.id}`);

            // 3초 후 다음 라운드 시작
            room.nextRoundTimer = setTimeout(() => {
              startNextRound(room, io);
            }, TYPING_GAME_CONFIG.NEXT_ROUND_DELAY * 1000);
          }, TYPING_GAME_CONFIG.FIRST_FINISH_COUNTDOWN * 1000);
        }

        console.log(`✅ 타이핑 완료: ${player.name} - ${finishResult.rank}등 (${finishResult.timeMs}ms)`);
      } catch (error) {
        console.error('❌ 타이핑 완료 실패:', error);
        callback({
          success: false,
          error: { code: TYPING_ERROR_CODES.INVALID_INPUT, message: (error as Error).message },
        });
      }
    });

    // 연결 해제 시 타자 게임 방에서 제거
    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      try {
        const { room, player } = typingStore.leaveRoom(socket.id);

        if (room && player) {
          const serializedRoom = TypingRoomUtils.serialize(room);
          const serializedPlayer = TypingPlayerUtils.serialize(player);

          // 다른 사용자들에게 사용자 나감 알림
          socket.to(room.id).emit(SOCKET_EVENTS.TYPING_ROOM_UPDATE, {
            room: serializedRoom,
            type: 'player_left',
            player: serializedPlayer,
          } as TypingRoomUpdateEvent);

          console.log(`🔌 연결 해제로 타자 게임 방 제거: ${player.name} <- 방 ${room.id}`);
        }
      } catch (error) {
        console.error('❌ 타자 게임 연결 해제 처리 실패:', error);
      }
    });
  });
}
