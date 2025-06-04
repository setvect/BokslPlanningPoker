import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_EVENTS } from '../../../shared/socket-events.ts';
import { CLIENT_CONFIG } from '../../../shared/constants.ts';
import type { 
  CreateRoomPayload, 
  JoinRoomPayload, 
  SelectCardPayload,
  CreateRoomResponse,
  JoinRoomResponse,
  CardSelectionResponse,
  RoomUpdateEvent,
  GameUpdateEvent,
  UserUpdateEvent,
  ApiResponse,
  Room
} from '../../../shared/types.ts';

interface UseSocketOptions {
  autoConnect?: boolean;
  url?: string;
}

interface SocketState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
}

export function useSocket(options: UseSocketOptions = {}) {
  // 환경에 따른 Socket URL 결정
  const getSocketUrl = () => {
    const isDevelopment = window.location.hostname === 'localhost';
    return isDevelopment ? CLIENT_CONFIG.DEVELOPMENT_SOCKET_URL : window.location.origin;
  };
  
  const { autoConnect = true, url = getSocketUrl() } = options;
  
  const socketRef = useRef<Socket | null>(null);
  const [socketState, setSocketState] = useState<SocketState>({
    connected: false,
    connecting: false,
    error: null
  });

  // Socket.io 연결 초기화
  useEffect(() => {
    if (!autoConnect) return;

    console.log('Socket.io 연결 초기화...');
    setSocketState(prev => ({ ...prev, connecting: true, error: null }));

    const socket = io(url, {
      transports: ['websocket', 'polling'],
      timeout: 5000,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000
    });

    socketRef.current = socket;

    // 연결 이벤트 핸들러
    socket.on('connect', () => {
      console.log('Socket.io 연결됨:', socket.id);
      setSocketState({
        connected: true,
        connecting: false,
        error: null
      });
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket.io 연결 해제됨:', reason);
      setSocketState({
        connected: false,
        connecting: false,
        error: `연결이 해제되었습니다: ${reason}`
      });
    });

    socket.on('connect_error', (error) => {
      console.error('Socket.io 연결 오류:', error);
      setSocketState({
        connected: false,
        connecting: false,
        error: `연결 오류: ${error.message}`
      });
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('Socket.io 재연결됨:', attemptNumber);
      setSocketState({
        connected: true,
        connecting: false,
        error: null
      });
    });

    socket.on('reconnect_error', (error) => {
      console.error('Socket.io 재연결 오류:', error);
      setSocketState(prev => ({
        ...prev,
        error: `재연결 실패: ${error.message}`
      }));
    });

    // 클린업
    return () => {
      console.log('Socket.io 연결 정리...');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [autoConnect, url]);

  // 수동 연결/해제
  const connect = () => {
    if (!socketRef.current) {
      console.log('Socket.io 수동 연결...');
      const socket = io(url);
      socketRef.current = socket;
    } else if (!socketRef.current.connected) {
      socketRef.current.connect();
    }
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  };

  // 방 생성
  const createRoom = (data: CreateRoomPayload): Promise<CreateRoomResponse> => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current?.connected) {
        reject(new Error('Socket이 연결되지 않았습니다'));
        return;
      }

      socketRef.current.emit(SOCKET_EVENTS.CREATE_ROOM, data, (response: CreateRoomResponse) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error?.message || '방 생성 실패'));
        }
      });
    });
  };

  // 방 참여
  const joinRoom = (data: JoinRoomPayload): Promise<JoinRoomResponse> => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current?.connected) {
        reject(new Error('Socket이 연결되지 않았습니다'));
        return;
      }

      socketRef.current.emit(SOCKET_EVENTS.JOIN_ROOM, data, (response: JoinRoomResponse) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error?.message || '방 참여 실패'));
        }
      });
    });
  };

  // 카드 선택
  const selectCard = (data: SelectCardPayload): Promise<CardSelectionResponse> => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current?.connected) {
        reject(new Error('Socket이 연결되지 않았습니다'));
        return;
      }

      socketRef.current.emit(SOCKET_EVENTS.SELECT_CARD, data, (response: CardSelectionResponse) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error?.message || '카드 선택 실패'));
        }
      });
    });
  };

  // 카드 공개
  const revealCards = (roomId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current?.connected) {
        reject(new Error('Socket이 연결되지 않았습니다'));
        return;
      }

      socketRef.current.emit(SOCKET_EVENTS.REVEAL_CARDS, { roomId }, (response: ApiResponse) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error || '카드 공개 실패'));
        }
      });
    });
  };

  // 라운드 초기화
  const resetRound = (roomId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current?.connected) {
        reject(new Error('Socket이 연결되지 않았습니다'));
        return;
      }

      socketRef.current.emit(SOCKET_EVENTS.RESET_ROUND, { roomId }, (response: ApiResponse) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error || '라운드 리셋 실패'));
        }
      });
    });
  };

  // 방 나가기
  const leaveRoom = (roomId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current?.connected) {
        reject(new Error('Socket이 연결되지 않았습니다'));
        return;
      }

      socketRef.current.emit(SOCKET_EVENTS.LEAVE_ROOM, { roomId }, (response: ApiResponse) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error || '방 나가기 실패'));
        }
      });
    });
  };

  // 사용자 이름 변경
  const updateUserName = (newName: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current?.connected) {
        reject(new Error('Socket이 연결되지 않았습니다'));
        return;
      }

      socketRef.current.emit(SOCKET_EVENTS.UPDATE_USER_NAME, { newName }, (response: ApiResponse) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error || '이름 변경 실패'));
        }
      });
    });
  };

  // 방 이름 변경
  const updateRoomName = (newName: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current?.connected) {
        reject(new Error('Socket이 연결되지 않았습니다'));
        return;
      }

      socketRef.current.emit(SOCKET_EVENTS.UPDATE_ROOM_NAME, { newName }, (response: ApiResponse) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error || '방 이름 변경 실패'));
        }
      });
    });
  };

  // 방 목록 조회
  const getRoomList = (): Promise<Room[]> => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current?.connected) {
        reject(new Error('Socket이 연결되지 않았습니다'));
        return;
      }

      socketRef.current.emit(SOCKET_EVENTS.GET_ROOM_LIST, (response: ApiResponse<Room[]>) => {
        if (response.success) {
          resolve(response.data || []);
        } else {
          reject(new Error(response.error || '방 목록 조회 실패'));
        }
      });
    });
  };

  // 이벤트 리스너 등록
  const onRoomUpdate = (callback: (data: RoomUpdateEvent) => void) => {
    if (socketRef.current) {
      socketRef.current.on(SOCKET_EVENTS.ROOM_UPDATE, callback);
      return () => socketRef.current?.off(SOCKET_EVENTS.ROOM_UPDATE, callback);
    }
    return () => {};
  };

  const onGameUpdate = (callback: (data: GameUpdateEvent) => void) => {
    if (socketRef.current) {
      socketRef.current.on(SOCKET_EVENTS.GAME_UPDATE, callback);
      return () => socketRef.current?.off(SOCKET_EVENTS.GAME_UPDATE, callback);
    }
    return () => {};
  };

  const onUserUpdate = (callback: (data: UserUpdateEvent) => void) => {
    if (socketRef.current) {
      socketRef.current.on(SOCKET_EVENTS.USER_UPDATE, callback);
      return () => socketRef.current?.off(SOCKET_EVENTS.USER_UPDATE, callback);
    }
    return () => {};
  };

  const onCardsRevealed = (callback: (data: GameUpdateEvent) => void) => {
    if (socketRef.current) {
      socketRef.current.on(SOCKET_EVENTS.CARDS_REVEALED, callback);
      return () => socketRef.current?.off(SOCKET_EVENTS.CARDS_REVEALED, callback);
    }
    return () => {};
  };

  const onRoundReset = (callback: (data: GameUpdateEvent) => void) => {
    if (socketRef.current) {
      socketRef.current.on(SOCKET_EVENTS.ROUND_RESET, callback);
      return () => socketRef.current?.off(SOCKET_EVENTS.ROUND_RESET, callback);
    }
    return () => {};
  };

  const onError = (callback: (error: { code: string; message: string; details?: any }) => void) => {
    if (socketRef.current) {
      socketRef.current.on(SOCKET_EVENTS.ERROR, callback);
      return () => socketRef.current?.off(SOCKET_EVENTS.ERROR, callback);
    }
    return () => {};
  };

  return {
    // 상태
    socketState,
    isConnected: socketState.connected,
    isConnecting: socketState.connecting,
    error: socketState.error,
    
    // 연결 제어
    connect,
    disconnect,
    
    // 방 관련 액션
    createRoom,
    joinRoom,
    leaveRoom,
    
    // 게임 관련 액션
    selectCard,
    revealCards,
    resetRound,
    
    // 사용자 관련 액션
    updateUserName,
    updateRoomName,
    
    // 방 목록 조회
    getRoomList,
    
    // 이벤트 리스너
    onRoomUpdate,
    onGameUpdate,
    onUserUpdate,
    onCardsRevealed,
    onRoundReset,
    onError,
    
    // 직접 소켓 접근 (고급 사용)
    socket: socketRef.current
  };
} 