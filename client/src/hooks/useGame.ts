import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';
import type { 
  Room, 
  User, 
  GameResult, 
  PlanningPokerCard
} from '../../../shared/types.ts';

interface GameHookState {
  room: Room | null;
  currentUser: User | null;
  gameResult: GameResult | null;
  loading: boolean;
  error: string | null;
}

export function useGame() {
  const socket = useSocket();
  const [gameState, setGameState] = useState<GameHookState>({
    room: null,
    currentUser: null,
    gameResult: null,
    loading: false,
    error: null
  });

  // 에러 상태 클리어
  const clearError = useCallback(() => {
    setGameState(prev => ({ ...prev, error: null }));
  }, []);

  // 로딩 상태 설정
  const setLoading = useCallback((loading: boolean) => {
    setGameState(prev => ({ ...prev, loading }));
  }, []);

  // 방 생성
  const createRoom = useCallback(async (roomName: string, userName: string) => {
    try {
      setLoading(true);
      clearError();

      const response = await socket.createRoom({ roomName, userName });
      
      if (response.room && response.user) {
        setGameState(prev => ({
          ...prev,
          room: response.room!,
          currentUser: response.user!,
          loading: false
        }));
        
        console.log('방 생성 성공:', response.room.id);
        return response.room.id;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '방 생성에 실패했습니다';
      setGameState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      throw error;
    }
  }, [socket, setLoading, clearError]);

  // 방 참여
  const joinRoom = useCallback(async (roomId: string, userName: string) => {
    try {
      setLoading(true);
      clearError();

      const response = await socket.joinRoom({ roomId, userName });
      
      if (response.room && response.user) {
        setGameState(prev => ({
          ...prev,
          room: response.room!,
          currentUser: response.user!,
          loading: false
        }));
        
        console.log('방 참여 성공:', response.room.id);
        return true;
      }
      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '방 참여에 실패했습니다';
      setGameState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      throw error;
    }
  }, [socket, setLoading, clearError]);

  // 카드 선택
  const selectCard = useCallback(async (card: PlanningPokerCard) => {
    if (!gameState.room || !gameState.currentUser) {
      throw new Error('방에 참여하지 않았습니다');
    }

    try {
      setLoading(true);
      clearError();

      const response = await socket.selectCard({ 
        roomId: gameState.room.id, 
        card 
      });
      
      // 서버에서 result를 받았다면 (공개 상태에서 카드 변경) 즉시 업데이트
      if (response.result) {
        setGameState(prev => ({
          ...prev,
          gameResult: response.result || null,
          loading: false
        }));
      }
      
      setLoading(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '카드 선택에 실패했습니다';
      setGameState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      throw error;
    }
  }, [gameState.room, gameState.currentUser, socket, setLoading, clearError]);

  // 카드 공개
  const revealCards = useCallback(async () => {
    if (!gameState.room) {
      throw new Error('방에 참여하지 않았습니다');
    }

    try {
      setLoading(true);
      clearError();

      await socket.revealCards(gameState.room.id);
      
      console.log('카드 공개 요청 성공');
      setLoading(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '카드 공개에 실패했습니다';
      setGameState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      throw error;
    }
  }, [gameState.room, socket, setLoading, clearError]);

  // 라운드 초기화
  const resetRound = useCallback(async () => {
    if (!gameState.room) {
      throw new Error('방에 참여하지 않았습니다');
    }

    try {
      setLoading(true);
      clearError();

      await socket.resetRound(gameState.room.id);
      
      // 게임 결과 초기화
      setGameState(prev => ({
        ...prev,
        gameResult: null,
        loading: false
      }));
      
      console.log('라운드 초기화 성공');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '라운드 초기화에 실패했습니다';
      setGameState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      throw error;
    }
  }, [gameState.room, socket, setLoading, clearError]);

  // 방 나가기
  const leaveRoom = useCallback(async () => {
    if (!gameState.room) return;

    try {
      await socket.leaveRoom(gameState.room.id);
      
      setGameState({
        room: null,
        currentUser: null,
        gameResult: null,
        loading: false,
        error: null
      });
      
      console.log('방 나가기 성공');
    } catch (error) {
      console.error('방 나가기 실패:', error);
      // 에러가 발생해도 로컬 상태는 초기화
      setGameState({
        room: null,
        currentUser: null,
        gameResult: null,
        loading: false,
        error: null
      });
    }
  }, [gameState.room, socket]);

  // Socket.io 이벤트 리스너 등록
  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    // 방 업데이트 (사용자 참여/나감, 이름 변경 등)
    unsubscribers.push(
      socket.onRoomUpdate((data) => {
        console.log('🔍 방 업데이트 이벤트 수신:', {
          type: data.type,
          newUser: data.user?.name,
          roomId: data.room?.id,
          totalUsers: data.room?.users?.length
        });
        console.log('🔍 전체 방 데이터:', data);
        
        setGameState(prev => {
          console.log('🔍 이전 상태:', {
            roomId: prev.room?.id,
            usersCount: prev.room?.users?.length,
            users: prev.room?.users?.map(u => u.name)
          });
          
          const newState = {
            ...prev,
            room: data.room
          };
          
          console.log('🔍 새 상태:', {
            roomId: newState.room?.id,
            usersCount: newState.room?.users?.length,
            users: newState.room?.users?.map(u => u.name)
          });
          
          return newState;
        });
      })
    );

    // 사용자 업데이트 (카드 선택 등)
    unsubscribers.push(
      socket.onUserUpdate((data) => {
        console.log('사용자 업데이트:', data.action, data.user.name);
        setGameState(prev => {
          if (!prev.room) return prev;

          // 방의 사용자 목록 업데이트
          const updatedUsers = prev.room.users.map(user => 
            user.id === data.user.id ? data.user : user
          );

          return {
            ...prev,
            room: {
              ...prev.room,
              users: updatedUsers
            },
            // 현재 사용자 정보 업데이트
            currentUser: prev.currentUser?.id === data.user.id 
              ? data.user 
              : prev.currentUser
          };
        });
      })
    );

    // 카드 공개
    unsubscribers.push(
      socket.onCardsRevealed((data) => {
        console.log('카드 공개됨:', data.result);
        setGameState(prev => ({
          ...prev,
          gameResult: data.result || null,
          room: prev.room ? {
            ...prev.room,
            gameState: data.gameState
          } : null
        }));
      })
    );

    // 라운드 초기화
    unsubscribers.push(
      socket.onRoundReset((data) => {
        console.log('라운드 초기화됨');
        setGameState(prev => ({
          ...prev,
          gameResult: null,
          room: prev.room ? {
            ...prev.room,
            gameState: data.gameState,
            users: prev.room.users.map(user => ({
              ...user,
              selectedCard: undefined
            }))
          } : null,
          currentUser: prev.currentUser ? {
            ...prev.currentUser,
            selectedCard: undefined
          } : null
        }));
      })
    );

    // 에러 처리
    unsubscribers.push(
      socket.onError((error) => {
        console.error('Socket 에러:', error);
        setGameState(prev => ({
          ...prev,
          error: error.message,
          loading: false
        }));
      })
    );

    // 클린업
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [socket]);

  // 계산된 값들
  const canRevealCards = gameState.room && 
    gameState.room.gameState === 'selecting' &&
    gameState.room.users.some(user => user.selectedCard);

  const allUsersSelected = gameState.room &&
    gameState.room.users.length > 0 &&
    gameState.room.users.every(user => user.selectedCard);

  const selectedCount = gameState.room ? 
    gameState.room.users.filter(user => user.selectedCard).length : 0;

  const totalCount = gameState.room ? gameState.room.users.length : 0;

  return {
    // 상태
    room: gameState.room,
    currentUser: gameState.currentUser,
    gameResult: gameState.gameResult,
    loading: gameState.loading,
    error: gameState.error,
    
    // Socket 연결 상태
    isConnected: socket.isConnected,
    isConnecting: socket.isConnecting,
    socketError: socket.error,
    
    // 계산된 값들
    canRevealCards,
    allUsersSelected,
    selectedCount,
    totalCount,
    
    // 액션
    createRoom,
    joinRoom,
    selectCard,
    revealCards,
    resetRound,
    leaveRoom,
    clearError,
    
    // 유틸리티
    isCardSelected: (card: PlanningPokerCard) => 
      gameState.currentUser?.selectedCard === card,
    
    getUserCard: (userId: string) => 
      gameState.room?.users.find(u => u.id === userId)?.selectedCard,
    
    hasUserSelected: (userId: string) => 
      Boolean(gameState.room?.users.find(u => u.id === userId)?.selectedCard)
  };
} 