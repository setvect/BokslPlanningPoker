import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';
import { STORAGE_KEYS } from '../../../shared/constants.ts';
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
  newRoundCooldown: {
    isActive: boolean;
    remainingTime: number;
  };
}

// localStorage 유틸리티 함수들
const saveSelectedCard = (roomId: string, card: PlanningPokerCard): void => {
  try {
    const key = `${STORAGE_KEYS.SELECTED_CARD}_${roomId}`;
    localStorage.setItem(key, card);
    console.log('🔧 카드 선택 정보 저장:', { roomId, card });
  } catch (error) {
    console.warn('카드 선택 정보 저장 실패:', error);
  }
};

const getSavedCard = (roomId: string): PlanningPokerCard | null => {
  try {
    const key = `${STORAGE_KEYS.SELECTED_CARD}_${roomId}`;
    const savedCard = localStorage.getItem(key) as PlanningPokerCard;
    console.log('🔧 저장된 카드 선택 정보 로드:', { roomId, savedCard });
    return savedCard;
  } catch (error) {
    console.warn('저장된 카드 정보 로드 실패:', error);
    return null;
  }
};

const clearSavedCard = (roomId: string): void => {
  try {
    const key = `${STORAGE_KEYS.SELECTED_CARD}_${roomId}`;
    localStorage.removeItem(key);
    console.log('🔧 카드 선택 정보 삭제:', { roomId });
  } catch (error) {
    console.warn('카드 선택 정보 삭제 실패:', error);
  }
};

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
    },
    newRoundCooldown: {
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
  const createRoom = useCallback(async (roomName: string, userName: string, deckType?: any) => {
    try {
      setLoading(true);
      clearError();

      const response = await socket.createRoom({ roomName, userName, deckType });
      
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

      // 2. localStorage에 카드 선택 정보 저장
      saveSelectedCard(gameState.room.id, card);

      // 3. 서버에 요청 전송 (백그라운드)
      const response = await socket.selectCard({ 
        roomId: gameState.room.id, 
        card 
      });
      
      // 4. 공개 상태에서 카드 변경 시 게임 결과 업데이트
      if (response.result) {
        setGameState(prev => ({
          ...prev,
          gameResult: response.result || null
        }));
      }
      
    } catch (error) {
      // 5. 실패 시 이전 상태로 롤백
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
      
      // 실패 시 localStorage에서도 이전 카드로 복원
      if (previousCard) {
        saveSelectedCard(gameState.room.id, previousCard);
      } else {
        clearSavedCard(gameState.room.id);
      }
      
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
      
      // 저장된 카드 선택 정보 삭제
      clearSavedCard(gameState.room.id);
      
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

    const roomId = gameState.room.id;

    try {
      await socket.leaveRoom(roomId);
      
      // 저장된 카드 선택 정보 삭제
      clearSavedCard(roomId);
      
      setGameState({
        room: null,
        currentUser: null,
        gameResult: null,
        loading: false,
        error: null,
        revealCountdown: {
          isActive: false,
          remainingTime: 0
        },
        newRoundCooldown: {
          isActive: false,
          remainingTime: 0
        }
      });
      
      console.log('방 나가기 성공');
    } catch (error) {
      console.error('방 나가기 실패:', error);
      
      // 에러가 발생해도 로컬 상태는 초기화
      clearSavedCard(roomId);
      
      setGameState({
        room: null,
        currentUser: null,
        gameResult: null,
        loading: false,
        error: null,
        revealCountdown: {
          isActive: false,
          remainingTime: 0
        },
        newRoundCooldown: {
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

  // 저장된 카드 선택 정보 복원 (방 참여 후)
  useEffect(() => {
    if (gameState.room && gameState.currentUser) {
      const savedCard = getSavedCard(gameState.room.id);
      
      // 저장된 카드가 있고, 현재 선택된 카드와 다르면 복원
      if (savedCard && gameState.currentUser.selectedCard !== savedCard) {
        console.log('💾 저장된 카드 선택 정보 복원:', {
          savedCard,
          gameState: gameState.room.gameState
        });
        
        // 즉시 로컬 상태 업데이트
        setGameState(prev => {
          if (!prev.room || !prev.currentUser) return prev;
          
          const updatedUser = { ...prev.currentUser, selectedCard: savedCard };
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
        
        // 서버 동기화 (selecting과 revealed 상태 모두에서 가능)
        if (gameState.room.gameState === 'selecting' || gameState.room.gameState === 'revealed') {
          socket.selectCard({ 
            roomId: gameState.room.id, 
            card: savedCard 
          }).catch(error => {
            console.warn('저장된 카드 복원 실패:', error);
            // 복원 실패 시 저장된 정보 삭제
            clearSavedCard(gameState.room!.id);
          });
        }
      }
    }
  }, [gameState.room, gameState.currentUser, socket]);

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
          
          // currentUser 정보도 업데이트된 방 데이터에서 찾아서 동기화
          const updatedCurrentUser = prev.currentUser && data.room?.users 
            ? data.room.users.find(user => user.id === prev.currentUser!.id) || prev.currentUser
            : prev.currentUser;
          
          const newState = {
            ...prev,
            room: data.room,
            currentUser: updatedCurrentUser
          };
          
          console.log('🔍 새 상태:', {
            roomId: newState.room?.id,
            usersCount: newState.room?.users?.length,
            users: newState.room?.users?.map(u => u.name),
            currentUserName: newState.currentUser?.name
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
          // 하지만 본인의 이름 변경이나 다른 정보는 반영
          const isMyCardSelection = prev.currentUser?.id === data.user.id && data.action === 'card_selected';
          if (isMyCardSelection) {
            console.log('본인 카드 선택 업데이트 무시:', data.user.name, data.user.selectedCard);
            return prev;
          }

          // 다른 사용자의 업데이트나 본인의 카드 선택 외 업데이트 처리
          const updatedUsers = prev.room.users.map(user => 
            user.id === data.user.id ? data.user : user
          );

          return {
            ...prev,
            room: {
              ...prev.room,
              users: updatedUsers
            },
            // 본인의 정보 업데이트 (카드 선택 제외)
            currentUser: prev.currentUser?.id === data.user.id 
              ? { ...data.user, selectedCard: prev.currentUser.selectedCard } // 카드는 로컬 상태 유지, 나머지는 서버 데이터 사용
              : prev.currentUser
          };
        });
      })
    );

    // 카드 공개
    unsubscribers.push(
      socket.onCardsRevealed((data) => {
        console.log('카드 공개됨:', data.result);
        
        setGameState(prev => {
          // 이미 쿨다운이 진행 중이거나 이미 공개 상태였다면 쿠다운을 시작하지 않음
          const shouldStartCooldown = prev.room?.gameState !== 'revealed' && !prev.newRoundCooldown.isActive;
          
          if (shouldStartCooldown) {
            console.log('🔄 새 라운드 쿨다운 시작 (최초 카드 공개)');
            
            // 3초 새 라운드 쿨다운 시작
            let cooldownTime = 3;
            
            // 1초마다 쿨다운 타이머 업데이트
            const cooldownInterval = setInterval(() => {
              cooldownTime--;
              
              if (cooldownTime > 0) {
                setGameState(current => ({
                  ...current,
                  newRoundCooldown: {
                    isActive: true,
                    remainingTime: cooldownTime
                  }
                }));
              } else {
                // 쿨다운 완료
                clearInterval(cooldownInterval);
                setGameState(current => ({
                  ...current,
                  newRoundCooldown: {
                    isActive: false,
                    remainingTime: 0
                  }
                }));
                console.log('✅ 새 라운드 버튼 활성화됨');
              }
            }, 1000);
            
            return {
              ...prev,
              gameResult: data.result || null,
              room: prev.room ? {
                ...prev.room,
                gameState: data.gameState
              } : null,
              revealCountdown: {
                isActive: false,
                remainingTime: 0
              },
              newRoundCooldown: {
                isActive: true,
                remainingTime: cooldownTime
              }
            };
          } else {
            console.log('🔄 게임 결과 업데이트 (쿨다운 유지)');
            // 쿨다운을 시작하지 않고 게임 결과만 업데이트
            return {
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
              // newRoundCooldown는 기존 상태 유지
            };
          }
        });
      })
    );

    // 라운드 초기화
    unsubscribers.push(
      socket.onRoundReset((data) => {
        console.log('라운드 초기화됨');
        setGameState(prev => {
          // 저장된 카드 선택 정보 삭제
          if (prev.room) {
            clearSavedCard(prev.room.id);
          }
          
          return {
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
            },
            newRoundCooldown: {
              isActive: false,
              remainingTime: 0
            }
          };
        });
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

  const canStartNewRound = gameState.room &&
    gameState.room.gameState === 'revealed' &&
    !gameState.newRoundCooldown.isActive; // 쿨다운 중이 아닐 때

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
    newRoundCooldown: gameState.newRoundCooldown,
    
    // Socket 연결 상태
    isConnected: socket.isConnected,
    isConnecting: socket.isConnecting,
    socketError: socket.error,
    
    // 계산된 값들
    canRevealCards,
    canStartNewRound,
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
      Boolean(gameState.room?.users.find(u => u.id === userId)?.selectedCard),
    
    getRoomStats: () => ({
      total: gameState.room?.users.length || 0,
      selected: gameState.room?.users.filter(u => u.selectedCard).length || 0
    })
  };
} 