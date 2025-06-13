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
  RevealCountdownEvent,
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
    
    if (isDevelopment) {
      // 개발 환경: 현재 페이지와 같은 포트 사용
      return `http://${window.location.hostname}:${window.location.port}`;
    } else {
      // 프로덕션 환경: 현재 origin 사용
      return window.location.origin;
    }
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
      reconnectionAttempts: 5,      // 3 → 5로 증가 (모바일 환경 고려)
      reconnectionDelay: 2000,      // 1000 → 2000으로 조정
      reconnectionDelayMax: 10000,  // 최대 재연결 지연 시간
      randomizationFactor: 0.5      // 재연결 지연 시간 랜덤화
      // 핑 설정은 서버에서 제어 (pingTimeout, pingInterval)
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

    // 핑/퐁 이벤트 처리 (서버 응답 확인용)
    socket.on('pong', () => {
      console.log('🏓 Pong 수신 - 연결 상태 양호');
    });

    // 클린업
    return () => {
      console.log('Socket.io 연결 정리...');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [autoConnect, url]);

  // Page Visibility API를 활용한 모바일 대기모드 대응
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // 포그라운드로 복귀했을 때
        console.log('📱 포그라운드 복귀 감지');
        
        if (socketRef.current && !socketRef.current.connected) {
          console.log('🔄 연결이 끊어진 상태, 재연결 시도...');
          socketRef.current.connect();
        } else if (socketRef.current?.connected) {
          // 연결 상태 확인을 위한 핑 전송
          console.log('🏓 연결 상태 확인용 핑 전송');
          socketRef.current.emit('ping');
        }
      } else {
        // 백그라운드로 이동했을 때
        console.log('📱 백그라운드 이동 감지');
      }
    };

    // 네트워크 상태 변화 감지 (모바일 네트워크 전환 대응)
    const handleOnline = () => {
      console.log('🌐 네트워크 연결 복구됨');
      if (socketRef.current && !socketRef.current.connected) {
        console.log('🔄 네트워크 복구로 인한 재연결 시도...');
        socketRef.current.connect();
      }
    };

    const handleOffline = () => {
      console.log('🌐 네트워크 연결 끊어짐');
    };

    // 이벤트 리스너 등록
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 클린업
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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

  const onRevealCountdown = (callback: (data: RevealCountdownEvent) => void) => {
    if (socketRef.current) {
      socketRef.current.on(SOCKET_EVENTS.REVEAL_COUNTDOWN, callback);
      return () => socketRef.current?.off(SOCKET_EVENTS.REVEAL_COUNTDOWN, callback);
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
    onRevealCountdown,
    onError,
    
    // 직접 소켓 접근 (고급 사용)
    socket: socketRef.current
  };
} 