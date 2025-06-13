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
  revealCountdown: {
    isActive: boolean;
    remainingTime: number;
  };
}

export function useGame() {
  const socket = useSocket();
  const [gameState, setGameState] = useState<GameHookState>({
    room: null,
    currentUser: null,
    gameResult: null,
    loading: false,
    error: null,
    revealCountdown: {
      isActive: false,
      remainingTime: 0
    }
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

  // 카드 선택 (Optimistic Update)
  const selectCard = useCallback(async (card: PlanningPokerCard) => {
    if (!gameState.room || !gameState.currentUser) {
      throw new Error('방에 참여하지 않았습니다');
    }

    const previousCard = gameState.currentUser.selectedCard;

    try {
      // 1. 즉시 로컬 상태 업데이트 (리렌더링 없이)
      setGameState(prev => {
        if (!prev.room || !prev.currentUser) return prev;
        
        const updatedUser = { ...prev.currentUser, selectedCard: card };
        const updatedUsers = prev.room.users.map(user => 
          user.id === prev.currentUser!.id ? updatedUser : user
        );

        return {
          ...prev,
          currentUser: updatedUser,
          room: {
            ...prev.room,
            users: updatedUsers
          }
        };
      });

      // 2. 서버에 요청 전송 (백그라운드)
      const response = await socket.selectCard({ 
        roomId: gameState.room.id, 
        card 
      });
      
      // 3. 공개 상태에서 카드 변경 시 게임 결과 업데이트
      if (response.result) {
        setGameState(prev => ({
          ...prev,
          gameResult: response.result || null
        }));
      }
      
    } catch (error) {
      // 4. 실패 시 이전 상태로 롤백
      setGameState(prev => {
        if (!prev.room || !prev.currentUser) return prev;
        
        const revertedUser = { ...prev.currentUser, selectedCard: previousCard };
        const revertedUsers = prev.room.users.map(user => 
          user.id === prev.currentUser!.id ? revertedUser : user
        );

        return {
          ...prev,
          currentUser: revertedUser,
          room: {
            ...prev.room,
            users: revertedUsers
          },
          error: error instanceof Error ? error.message : '카드 선택에 실패했습니다'
        };
      });
      throw error;
    }
  }, [gameState.room, gameState.currentUser, socket]);

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
        error: null,
        revealCountdown: {
          isActive: false,
          remainingTime: 0
        }
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
        error: null,
        revealCountdown: {
          isActive: false,
          remainingTime: 0
        }
      });
    }
  }, [gameState.room, socket]);

  // 사용자 이름 변경
  const updateUserName = useCallback(async (newName: string) => {
    if (!gameState.currentUser) {
      throw new Error('사용자 정보가 없습니다');
    }

    try {
      setLoading(true);
      clearError();

      await socket.updateUserName(newName);
      
      console.log('이름 변경 성공:', newName);
      setLoading(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '이름 변경에 실패했습니다';
      setGameState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      throw error;
    }
  }, [gameState.currentUser, socket, setLoading, clearError]);

  // 방 이름 변경
  const updateRoomName = useCallback(async (newName: string) => {
    if (!gameState.room) {
      throw new Error('방에 참여하지 않았습니다');
    }

    try {
      setLoading(true);
      clearError();

      await socket.updateRoomName(newName);
      
      console.log('방 이름 변경 성공:', newName);
      setLoading(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '방 이름 변경에 실패했습니다';
      setGameState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      throw error;
    }
  }, [gameState.room, socket, setLoading, clearError]);

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

    // 사용자 업데이트 (카드 선택 등) - 본인 카드 선택은 제외
    unsubscribers.push(
      socket.onUserUpdate((data) => {
        console.log('사용자 업데이트:', data.action, data.user.name);
        setGameState(prev => {
          if (!prev.room) return prev;

          // 본인의 카드 선택 업데이트는 무시 (이미 Optimistic Update로 처리됨)
          const isMyCardSelection = prev.currentUser?.id === data.user.id && data.action === 'card_selected';
          if (isMyCardSelection) {
            console.log('본인 카드 선택 업데이트 무시:', data.user.name, data.user.selectedCard);
            return prev;
          }

          // 다른 사용자의 업데이트만 처리
          const updatedUsers = prev.room.users.map(user => 
            user.id === data.user.id ? data.user : user
          );

          return {
            ...prev,
            room: {
              ...prev.room,
              users: updatedUsers
            },
            // 본인이 아닌 경우에만 currentUser 업데이트
            currentUser: prev.currentUser?.id === data.user.id 
              ? prev.currentUser // 본인은 그대로 유지
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
          } : null,
          revealCountdown: {
            isActive: false,
            remainingTime: 0
          }
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
          } : null,
          revealCountdown: {
            isActive: false,
            remainingTime: 0
          }
        }));
      })
    );

    // 카드 공개 카운트다운
    unsubscribers.push(
      socket.onRevealCountdown((data) => {
        console.log('🕒 카드 공개 카운트다운:', data.remainingTime + '초 남음');
        setGameState(prev => ({
          ...prev,
          revealCountdown: {
            isActive: data.isStarted,
            remainingTime: data.remainingTime
          }
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
    gameState.room.users.length >= 1 && // 최소 1명 이상 참여
    gameState.room.users.some(user => user.selectedCard) &&
    !gameState.revealCountdown.isActive; // 카운트다운 중이 아닐 때

  const allUsersSelected = gameState.room &&
    gameState.room.users.length > 0 &&
    gameState.room.users.every(user => user.selectedCard);

  const selectedCount = gameState.room ? 
    gameState.room.users.filter(user => user.selectedCard).length : 0;

  const totalCount = gameState.room ? gameState.room.users.length : 0;

  // 카드 공개 준비 상태 (모든 사용자가 선택 완료)
  const isReadyToReveal = gameState.room &&
    gameState.room.gameState === 'selecting' &&
    gameState.room.users.length > 0 &&
    gameState.room.users.every(user => user.selectedCard);

  return {
    // 상태
    room: gameState.room,
    currentUser: gameState.currentUser,
    gameResult: gameState.gameResult,
    loading: gameState.loading,
    error: gameState.error,
    revealCountdown: gameState.revealCountdown,
    
    // Socket 연결 상태
    isConnected: socket.isConnected,
    isConnecting: socket.isConnecting,
    socketError: socket.error,
    
    // 계산된 값들
    canRevealCards,
    allUsersSelected,
    selectedCount,
    totalCount,
    isReadyToReveal,
    
    // 액션
    createRoom,
    joinRoom,
    selectCard,
    revealCards,
    resetRound,
    leaveRoom,
    updateUserName,
    updateRoomName,
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