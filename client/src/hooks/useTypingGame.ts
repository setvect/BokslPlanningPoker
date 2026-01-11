import { useState, useEffect, useCallback, useRef } from 'react';
import { useTypingSocket } from './useTypingSocket';
import type {
  TypingRoom,
  TypingPlayer,
  TypingSentence,
  TypingRoundResult,
  TypingPlayerRanking,
} from '../../../shared/types';
import { TypingGameState } from '../../../shared/types';
import { TYPING_GAME_CONFIG, TYPING_STORAGE_KEYS } from '../../../shared/constants';

interface UseTypingGameOptions {
  autoConnect?: boolean;
}

interface GameState {
  // 방 정보
  room: TypingRoom | null;
  roomId: string | null;

  // 현재 사용자 정보
  playerId: string | null;
  playerName: string | null;
  isHost: boolean;
  isSpectator: boolean;

  // 게임 상태
  gameState: TypingGameState;
  sentence: TypingSentence | null;
  roundNumber: number;
  countdown: number | null;

  // 입력 상태
  input: string;
  progress: number;
  errorPositions: number[];
  isFinished: boolean;
  rank: number | null;

  // 다른 플레이어 진행 상황
  playerProgress: Map<string, { progress: number; isFinished: boolean; rank: number | null }>;

  // 라운드 결과
  roundResult: TypingRoundResult | null;
  rankings: TypingPlayerRanking[];

  // UI 상태
  loading: boolean;
  error: string | null;
}

const initialGameState: GameState = {
  room: null,
  roomId: null,
  playerId: null,
  playerName: null,
  isHost: false,
  isSpectator: false,
  gameState: TypingGameState.WAITING,
  sentence: null,
  roundNumber: 0,
  countdown: null,
  input: '',
  progress: 0,
  errorPositions: [],
  isFinished: false,
  rank: null,
  playerProgress: new Map(),
  roundResult: null,
  rankings: [],
  loading: false,
  error: null,
};

export function useTypingGame(options: UseTypingGameOptions = {}) {
  const { autoConnect = true } = options;

  const socket = useTypingSocket({ autoConnect });
  const [state, setState] = useState<GameState>(initialGameState);

  // 이전 입력값 저장 (붙여넣기 감지용)
  const previousInputRef = useRef<string>('');

  // localStorage 키 생성
  const getStorageKey = (roomId: string) => `${TYPING_STORAGE_KEYS.CURRENT_ROOM}_${roomId}`;

  // localStorage에 방 정보 저장
  const saveRoomInfo = useCallback((roomId: string, playerId: string, playerName: string) => {
    try {
      localStorage.setItem(getStorageKey(roomId), JSON.stringify({ playerId, playerName }));
    } catch (e) {
      console.error('방 정보 저장 실패:', e);
    }
  }, []);

  // localStorage에서 방 정보 로드
  const loadRoomInfo = useCallback((roomId: string): { playerId: string; playerName: string } | null => {
    try {
      const data = localStorage.getItem(getStorageKey(roomId));
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('방 정보 로드 실패:', e);
    }
    return null;
  }, []);

  // localStorage에서 방 정보 삭제
  const clearRoomInfo = useCallback((roomId: string) => {
    try {
      localStorage.removeItem(getStorageKey(roomId));
    } catch (e) {
      console.error('방 정보 삭제 실패:', e);
    }
  }, []);

  // 붙여넣기 감지
  const detectPaste = useCallback((previousInput: string, newInput: string): boolean => {
    return newInput.length - previousInput.length > TYPING_GAME_CONFIG.PASTE_DETECTION_THRESHOLD;
  }, []);

  // 진행률 및 오타 위치 계산 (클라이언트 측)
  const calculateProgress = useCallback((input: string, target: string): {
    progress: number;
    errorPositions: number[];
  } => {
    const errorPositions: number[] = [];
    let correctChars = 0;

    for (let i = 0; i < input.length && i < target.length; i++) {
      if (input[i] === target[i]) {
        correctChars++;
      } else {
        // 한글 조합 중인지 확인 (초성/중성/종성 범위)
        const isKoreanComposing = isKoreanJamo(input[i]);
        if (!isKoreanComposing) {
          errorPositions.push(i);
        }
      }
    }

    // 입력이 타겟보다 길면 초과 부분도 오타로 처리
    for (let i = target.length; i < input.length; i++) {
      errorPositions.push(i);
    }

    const progress = target.length > 0
      ? Math.min(100, Math.round((correctChars / target.length) * 100))
      : 0;

    return { progress, errorPositions };
  }, []);

  // 한글 자모인지 확인
  const isKoreanJamo = (char: string): boolean => {
    const code = char.charCodeAt(0);
    // 한글 자모 (ㄱ-ㅣ): 0x3131-0x3163
    return code >= 0x3131 && code <= 0x3163;
  };

  // 방 생성
  const createRoom = useCallback(async (roomName: string, playerName: string): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await socket.createRoom({ roomName, playerName });

      if (response.success && response.data) {
        const { room, playerId: newPlayerId } = response.data;

        saveRoomInfo(room.id, newPlayerId, playerName);

        setState(prev => ({
          ...prev,
          room,
          roomId: room.id,
          playerId: newPlayerId,
          playerName,
          isHost: true,
          isSpectator: false,
          gameState: room.gameState,
          roundNumber: room.roundNumber,
          loading: false,
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '방 생성 실패',
      }));
      throw error;
    }
  }, [socket, saveRoomInfo]);

  // 방 참여
  const joinRoom = useCallback(async (roomId: string, playerName: string): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await socket.joinRoom({ roomId, playerName });

      if (response.success && response.data) {
        const { room, playerId: newPlayerId, isSpectator } = response.data;

        saveRoomInfo(room.id, newPlayerId, playerName);

        // 방의 첫 번째 참가자인지 확인 (호스트 여부)
        const isHost = room.players.length > 0 && room.players[0].id === newPlayerId;

        setState(prev => ({
          ...prev,
          room,
          roomId: room.id,
          playerId: newPlayerId,
          playerName,
          isHost,
          isSpectator: isSpectator || false,
          gameState: room.gameState,
          sentence: room.currentSentence,
          roundNumber: room.roundNumber,
          countdown: room.countdownRemaining,
          loading: false,
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '방 참여 실패',
      }));
      throw error;
    }
  }, [socket, saveRoomInfo]);

  // 방 나가기
  const leaveRoom = useCallback(async (): Promise<void> => {
    if (!state.roomId) {
      return;
    }

    try {
      await socket.leaveRoom(state.roomId);
      clearRoomInfo(state.roomId);
      setState(initialGameState);
    } catch (error) {
      console.error('방 나가기 실패:', error);
      // 에러가 발생해도 로컬 상태는 초기화
      if (state.roomId) {
        clearRoomInfo(state.roomId);
      }
      setState(initialGameState);
    }
  }, [socket, state.roomId, clearRoomInfo]);

  // 게임 시작
  const startGame = useCallback(async (): Promise<void> => {
    if (!state.roomId || !state.isHost) {
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      await socket.startGame(state.roomId);
      setState(prev => ({ ...prev, loading: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '게임 시작 실패',
      }));
      throw error;
    }
  }, [socket, state.roomId, state.isHost]);

  // 입력 처리
  const handleInput = useCallback(async (newInput: string): Promise<void> => {
    if (!state.roomId || state.isFinished || state.isSpectator) {
      return;
    }

    if (state.gameState !== TypingGameState.PLAYING) {
      return;
    }

    // 붙여넣기 감지
    if (detectPaste(previousInputRef.current, newInput)) {
      console.warn('붙여넣기 감지됨');
      return; // 붙여넣기는 무시
    }

    previousInputRef.current = newInput;

    // 클라이언트 측 진행률 및 오타 계산 (Optimistic Update)
    if (state.sentence) {
      const { progress, errorPositions } = calculateProgress(newInput, state.sentence.text);
      setState(prev => ({
        ...prev,
        input: newInput,
        progress,
        errorPositions,
      }));
    }

    // 서버에 입력 전송
    try {
      await socket.sendInput({
        roomId: state.roomId,
        input: newInput,
      });
    } catch (error) {
      console.error('입력 전송 실패:', error);
    }
  }, [socket, state.roomId, state.gameState, state.isFinished, state.isSpectator, state.sentence, detectPaste, calculateProgress]);

  // 제출 처리 (Enter)
  const handleSubmit = useCallback(async (): Promise<boolean> => {
    if (!state.roomId || state.isFinished || state.isSpectator) {
      return false;
    }

    if (state.gameState !== TypingGameState.PLAYING) {
      return false;
    }

    // 오타가 있으면 제출 불가
    if (state.errorPositions.length > 0) {
      return false;
    }

    // 입력이 완성되지 않았으면 제출 불가
    if (state.sentence && state.input !== state.sentence.text) {
      return false;
    }

    try {
      const response = await socket.submitTyping(state.roomId);

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          isFinished: true,
          rank: response.data?.rank || null,
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('제출 실패:', error);
      return false;
    }
  }, [socket, state.roomId, state.gameState, state.isFinished, state.isSpectator, state.errorPositions, state.input, state.sentence]);

  // 방 목록 조회
  const getRoomList = useCallback(async () => {
    try {
      return await socket.getRoomList();
    } catch (error) {
      console.error('방 목록 조회 실패:', error);
      return [];
    }
  }, [socket]);

  // Socket 이벤트 리스너 등록
  useEffect(() => {
    // 방 업데이트
    const unsubRoomUpdate = socket.onRoomUpdate((data) => {
      setState(prev => {
        if (prev.roomId !== data.room.id) {
          return prev;
        }

        // 현재 플레이어 정보 찾기
        const currentPlayer = data.room.players.find(p => p.id === prev.playerId);

        // 플레이어 진행 상황 맵 업데이트
        const newPlayerProgress = new Map<string, { progress: number; isFinished: boolean; rank: number | null }>();
        data.room.players.forEach(player => {
          if (player.id !== prev.playerId) {
            newPlayerProgress.set(player.id, {
              progress: player.progress,
              isFinished: player.isFinished,
              rank: player.rank,
            });
          }
        });

        return {
          ...prev,
          room: data.room,
          gameState: data.room.gameState,
          sentence: data.room.currentSentence,
          roundNumber: data.room.roundNumber,
          countdown: data.room.countdownRemaining,
          isSpectator: currentPlayer?.isSpectator || false,
          playerProgress: newPlayerProgress,
        };
      });
    });

    // 카운트다운
    const unsubCountdown = socket.onCountdown((data) => {
      setState(prev => {
        if (prev.roomId !== data.roomId) {
          return prev;
        }
        return {
          ...prev,
          countdown: data.count,
          gameState: TypingGameState.COUNTDOWN,
        };
      });
    });

    // 라운드 시작
    const unsubRoundStart = socket.onRoundStart((data) => {
      setState(prev => {
        if (prev.roomId !== data.roomId) {
          return prev;
        }

        // 입력 상태 초기화
        previousInputRef.current = '';

        return {
          ...prev,
          gameState: TypingGameState.PLAYING,
          sentence: data.sentence,
          roundNumber: data.roundNumber,
          countdown: null,
          input: '',
          progress: 0,
          errorPositions: [],
          isFinished: false,
          rank: null,
          roundResult: null,
          rankings: [],
          playerProgress: new Map(),
        };
      });
    });

    // 진행 상황 업데이트
    const unsubProgress = socket.onProgress((data) => {
      setState(prev => {
        if (prev.roomId !== data.roomId) {
          return prev;
        }

        // 자신의 진행 상황은 무시 (이미 로컬에서 업데이트됨)
        if (data.playerId === prev.playerId) {
          return prev;
        }

        const newPlayerProgress = new Map(prev.playerProgress);
        newPlayerProgress.set(data.playerId, {
          progress: data.progress,
          isFinished: false,
          rank: null,
        });

        return {
          ...prev,
          playerProgress: newPlayerProgress,
        };
      });
    });

    // 1등 완료
    const unsubFirstFinish = socket.onFirstFinish((data) => {
      setState(prev => {
        if (prev.roomId !== data.roomId) {
          return prev;
        }

        const newPlayerProgress = new Map(prev.playerProgress);
        if (data.playerId !== prev.playerId) {
          newPlayerProgress.set(data.playerId, {
            progress: 100,
            isFinished: true,
            rank: 1,
          });
        }

        return {
          ...prev,
          countdown: data.countdownSeconds,
          playerProgress: newPlayerProgress,
        };
      });
    });

    // 플레이어 완료
    const unsubPlayerFinish = socket.onPlayerFinish((data) => {
      setState(prev => {
        if (prev.roomId !== data.roomId) {
          return prev;
        }

        const newPlayerProgress = new Map(prev.playerProgress);
        if (data.playerId !== prev.playerId) {
          newPlayerProgress.set(data.playerId, {
            progress: 100,
            isFinished: true,
            rank: data.rank,
          });
        }

        return {
          ...prev,
          playerProgress: newPlayerProgress,
        };
      });
    });

    // 라운드 종료
    const unsubRoundEnd = socket.onRoundEnd((data) => {
      setState(prev => {
        if (prev.roomId !== data.roomId) {
          return prev;
        }

        return {
          ...prev,
          gameState: TypingGameState.ROUND_END,
          roundResult: data.result,
          rankings: data.result.rankings,
          countdown: data.nextRoundIn,
        };
      });
    });

    // 에러
    const unsubError = socket.onError((error) => {
      console.error('Socket 에러:', error);
      setState(prev => ({
        ...prev,
        error: error.message,
      }));
    });

    // 클린업
    return () => {
      unsubRoomUpdate();
      unsubCountdown();
      unsubRoundStart();
      unsubProgress();
      unsubFirstFinish();
      unsubPlayerFinish();
      unsubRoundEnd();
      unsubError();
    };
  }, [socket]);

  // 연결 상태 변경 시 상태 초기화
  useEffect(() => {
    if (!socket.isConnected && state.roomId) {
      // 연결이 끊어지면 에러 상태 표시 (방 정보는 유지)
      setState(prev => ({
        ...prev,
        error: '서버 연결이 끊어졌습니다. 재연결 중...',
      }));
    } else if (socket.isConnected && state.error?.includes('연결')) {
      // 재연결 시 에러 상태 해제
      setState(prev => ({
        ...prev,
        error: null,
      }));
    }
  }, [socket.isConnected, state.roomId, state.error]);

  // 제출 가능 여부 확인
  const canSubmit = state.gameState === TypingGameState.PLAYING &&
    !state.isFinished &&
    !state.isSpectator &&
    state.errorPositions.length === 0 &&
    state.sentence !== null &&
    state.input === state.sentence.text;

  // 게임 시작 가능 여부 확인
  const canStartGame = state.isHost &&
    state.gameState === TypingGameState.WAITING &&
    state.room !== null &&
    state.room.players.filter(p => !p.isSpectator).length >= TYPING_GAME_CONFIG.MIN_PLAYERS_FOR_GAME;

  return {
    // 상태
    ...state,

    // Socket 연결 상태
    isConnected: socket.isConnected,
    isConnecting: socket.isConnecting,

    // 계산된 상태
    canSubmit,
    canStartGame,

    // 액션
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    handleInput,
    handleSubmit,
    getRoomList,

    // 유틸리티
    clearError: () => setState(prev => ({ ...prev, error: null })),
  };
}
