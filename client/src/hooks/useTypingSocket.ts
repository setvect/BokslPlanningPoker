import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_EVENTS } from '../../../shared/socket-events.ts';
import type {
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
  ApiResponse,
} from '../../../shared/types.ts';

interface UseTypingSocketOptions {
  autoConnect?: boolean;
  url?: string;
}

interface SocketState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
}

export function useTypingSocket(options: UseTypingSocketOptions = {}) {
  // 환경에 따른 Socket URL 결정
  const getSocketUrl = () => {
    const isDevelopment = window.location.hostname === 'localhost';

    if (isDevelopment) {
      return `http://${window.location.hostname}:${window.location.port}`;
    } else {
      return window.location.origin;
    }
  };

  const { autoConnect = true, url = getSocketUrl() } = options;

  const socketRef = useRef<Socket | null>(null);
  const [socketState, setSocketState] = useState<SocketState>({
    connected: false,
    connecting: false,
    error: null,
  });

  // Socket.io 연결 초기화
  useEffect(() => {
    if (!autoConnect) {
      return;
    }

    console.log('타자 게임 Socket.io 연결 초기화...');
    setSocketState(prev => ({ ...prev, connecting: true, error: null }));

    const socket = io(url, {
      transports: ['websocket', 'polling'],
      timeout: 5000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      randomizationFactor: 0.5,
    });

    socketRef.current = socket;

    // 연결 이벤트 핸들러
    socket.on('connect', () => {
      console.log('타자 게임 Socket.io 연결됨:', socket.id);
      setSocketState({
        connected: true,
        connecting: false,
        error: null,
      });
    });

    socket.on('disconnect', (reason) => {
      console.log('타자 게임 Socket.io 연결 해제됨:', reason);
      setSocketState({
        connected: false,
        connecting: false,
        error: `연결이 해제되었습니다: ${reason}`,
      });
    });

    socket.on('connect_error', (error) => {
      console.error('타자 게임 Socket.io 연결 오류:', error);
      setSocketState({
        connected: false,
        connecting: false,
        error: `연결 오류: ${error.message}`,
      });
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('타자 게임 Socket.io 재연결됨:', attemptNumber);
      setSocketState({
        connected: true,
        connecting: false,
        error: null,
      });
    });

    socket.on('pong', () => {
      console.log('🏓 타자 게임 Pong 수신 - 연결 상태 양호');
    });

    // 클린업
    return () => {
      console.log('타자 게임 Socket.io 연결 정리...');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [autoConnect, url]);

  // Page Visibility API 및 네트워크 상태 처리
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (socketRef.current && !socketRef.current.connected) {
          socketRef.current.connect();
        } else if (socketRef.current?.connected) {
          socketRef.current.emit('ping');
        }
      }
    };

    const handleOnline = () => {
      if (socketRef.current && !socketRef.current.connected) {
        socketRef.current.connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // 수동 연결/해제
  const connect = () => {
    if (!socketRef.current) {
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
  const createRoom = (data: CreateTypingRoomPayload): Promise<CreateTypingRoomResponse> => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current?.connected) {
        reject(new Error('Socket이 연결되지 않았습니다'));
        return;
      }

      socketRef.current.emit(SOCKET_EVENTS.TYPING_CREATE_ROOM, data, (response: CreateTypingRoomResponse) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error?.message || '방 생성 실패'));
        }
      });
    });
  };

  // 방 참여
  const joinRoom = (data: JoinTypingRoomPayload): Promise<JoinTypingRoomResponse> => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current?.connected) {
        reject(new Error('Socket이 연결되지 않았습니다'));
        return;
      }

      socketRef.current.emit(SOCKET_EVENTS.TYPING_JOIN_ROOM, data, (response: JoinTypingRoomResponse) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error?.message || '방 참여 실패'));
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

      socketRef.current.emit(SOCKET_EVENTS.TYPING_LEAVE_ROOM, { roomId }, (response: ApiResponse) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error || '방 나가기 실패'));
        }
      });
    });
  };

  // 방 목록 조회
  const getRoomList = (): Promise<TypingRoomListItem[]> => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current?.connected) {
        reject(new Error('Socket이 연결되지 않았습니다'));
        return;
      }

      socketRef.current.emit(SOCKET_EVENTS.TYPING_GET_ROOM_LIST, (response: ApiResponse<TypingRoomListItem[]>) => {
        if (response.success) {
          resolve(response.data || []);
        } else {
          reject(new Error(response.error || '방 목록 조회 실패'));
        }
      });
    });
  };

  // 게임 시작
  const startGame = (roomId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current?.connected) {
        reject(new Error('Socket이 연결되지 않았습니다'));
        return;
      }

      socketRef.current.emit(SOCKET_EVENTS.TYPING_START_GAME, { roomId }, (response: StartTypingGameResponse) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error?.message || '게임 시작 실패'));
        }
      });
    });
  };

  // 타이핑 입력 전송
  const sendInput = (data: TypingInputPayload): Promise<TypingInputResponse> => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current?.connected) {
        reject(new Error('Socket이 연결되지 않았습니다'));
        return;
      }

      socketRef.current.emit(SOCKET_EVENTS.TYPING_INPUT, data, (response: TypingInputResponse) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(response.error || new Error('입력 전송 실패'));
        }
      });
    });
  };

  // 타이핑 완료 (Enter)
  const submitTyping = (roomId: string): Promise<TypingSubmitResponse> => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current?.connected) {
        reject(new Error('Socket이 연결되지 않았습니다'));
        return;
      }

      socketRef.current.emit(SOCKET_EVENTS.TYPING_SUBMIT, { roomId }, (response: TypingSubmitResponse) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(response.error || new Error('완료 처리 실패'));
        }
      });
    });
  };

  // 이벤트 리스너들
  const onRoomUpdate = (callback: (data: TypingRoomUpdateEvent) => void) => {
    if (socketRef.current) {
      socketRef.current.on(SOCKET_EVENTS.TYPING_ROOM_UPDATE, callback);
      return () => socketRef.current?.off(SOCKET_EVENTS.TYPING_ROOM_UPDATE, callback);
    }
    return () => {};
  };

  const onCountdown = (callback: (data: TypingCountdownEvent) => void) => {
    if (socketRef.current) {
      socketRef.current.on(SOCKET_EVENTS.TYPING_COUNTDOWN, callback);
      return () => socketRef.current?.off(SOCKET_EVENTS.TYPING_COUNTDOWN, callback);
    }
    return () => {};
  };

  const onRoundStart = (callback: (data: TypingRoundStartEvent) => void) => {
    if (socketRef.current) {
      socketRef.current.on(SOCKET_EVENTS.TYPING_ROUND_START, callback);
      return () => socketRef.current?.off(SOCKET_EVENTS.TYPING_ROUND_START, callback);
    }
    return () => {};
  };

  const onProgress = (callback: (data: TypingProgressEvent) => void) => {
    if (socketRef.current) {
      socketRef.current.on(SOCKET_EVENTS.TYPING_PROGRESS, callback);
      return () => socketRef.current?.off(SOCKET_EVENTS.TYPING_PROGRESS, callback);
    }
    return () => {};
  };

  const onFirstFinish = (callback: (data: TypingFirstFinishEvent) => void) => {
    if (socketRef.current) {
      socketRef.current.on(SOCKET_EVENTS.TYPING_FIRST_FINISH, callback);
      return () => socketRef.current?.off(SOCKET_EVENTS.TYPING_FIRST_FINISH, callback);
    }
    return () => {};
  };

  const onPlayerFinish = (callback: (data: TypingPlayerFinishEvent) => void) => {
    if (socketRef.current) {
      socketRef.current.on(SOCKET_EVENTS.TYPING_PLAYER_FINISH, callback);
      return () => socketRef.current?.off(SOCKET_EVENTS.TYPING_PLAYER_FINISH, callback);
    }
    return () => {};
  };

  const onRoundEnd = (callback: (data: TypingRoundEndEvent) => void) => {
    if (socketRef.current) {
      socketRef.current.on(SOCKET_EVENTS.TYPING_ROUND_END, callback);
      return () => socketRef.current?.off(SOCKET_EVENTS.TYPING_ROUND_END, callback);
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
    getRoomList,

    // 게임 관련 액션
    startGame,
    sendInput,
    submitTyping,

    // 이벤트 리스너
    onRoomUpdate,
    onCountdown,
    onRoundStart,
    onProgress,
    onFirstFinish,
    onPlayerFinish,
    onRoundEnd,
    onError,

    // 직접 소켓 접근
    socket: socketRef.current,
  };
}
