import type { PlanningPokerCard } from '../types';
import type { useGame } from '../hooks/useGame';
import GameResult from './GameResult';
import CardSelectionModal from './CardSelectionModal';
import { useState } from 'react';
import { FaCoffee } from 'react-icons/fa';

interface GameRoomProps {
  roomId: string
  roomName: string
  userName: string
  onLeave: () => void
  game: ReturnType<typeof useGame>
}

export default function GameRoom({ roomId, roomName, userName, onLeave, game }: GameRoomProps) {
  // 카드 선택 모달 상태
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  
  // 이름 편집 상태
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState('');

  // 방 이름 편집 상태
  const [isEditingRoomName, setIsEditingRoomName] = useState(false);
  const [editingRoomName, setEditingRoomName] = useState('');

  // 플래닝 포커 카드 덱
  const cards: PlanningPokerCard[] = ['0', '1/2', '1', '2', '3', '5', '8', '13', '20', '40', '60', '100', '?', '커피'];

  console.log('🔍 GameRoom 렌더링:', {
    room: game.room,
    users: game.room?.users,
    usersCount: game.room?.users?.length
  });

  // 실제 방 데이터 사용
  const currentRoom = game.room;
  const users = currentRoom?.users || [];
  const totalUsers = users.length;
  const selectedUsers = users.filter(user => user.selectedCard).length;
  const selectedPercentage = totalUsers > 0 ? (selectedUsers / totalUsers) * 100 : 0;

  // 카드별 특수 스타일 클래스 반환
  const getCardSpecialClass = (card: PlanningPokerCard) => {
    switch (card) {
      case '?':
        return 'planning-card-question';
      case '커피':
        return 'planning-card-coffee';
      case '100':
        return 'planning-card-infinity';
      default:
        return '';
    }
  };

  // 카드 내용 렌더링 함수
  const renderCardContent = (card: PlanningPokerCard) => {
    if (card === '커피') {
      return <FaCoffee className="text-amber-600 text-3xl" />;
    }
    return card;
  };

  // 이름 편집 시작
  const startEditingName = () => {
    if (game.currentUser) {
      setEditingName(game.currentUser.name);
      setIsEditingName(true);
    }
  };

  // 이름 편집 취소
  const cancelEditingName = () => {
    setIsEditingName(false);
    setEditingName('');
  };

  // 이름 변경 완료
  const finishEditingName = async () => {
    if (!editingName.trim()) {
      cancelEditingName();
      return;
    }

    try {
      await game.updateUserName(editingName.trim());
      setIsEditingName(false);
      setEditingName('');
    } catch (error) {
      console.error('이름 변경 실패:', error);
      // 에러는 useGame에서 관리되므로 여기서는 편집 상태만 초기화
      setIsEditingName(false);
      setEditingName('');
    }
  };

  // Enter/Escape 키 처리
  const handleNameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      finishEditingName();
    } else if (e.key === 'Escape') {
      cancelEditingName();
    }
  };

  // 방 이름 편집 시작
  const startEditingRoomName = () => {
    if (game.room) {
      setEditingRoomName(game.room.name);
      setIsEditingRoomName(true);
    }
  };

  // 방 이름 편집 취소
  const cancelEditingRoomName = () => {
    setIsEditingRoomName(false);
    setEditingRoomName('');
  };

  // 방 이름 변경 완료
  const finishEditingRoomName = async () => {
    if (!editingRoomName.trim()) {
      cancelEditingRoomName();
      return;
    }

    try {
      await game.updateRoomName(editingRoomName.trim());
      setIsEditingRoomName(false);
      setEditingRoomName('');
    } catch (error) {
      console.error('방 이름 변경 실패:', error);
      // 에러는 useGame에서 관리되므로 여기서는 편집 상태만 초기화
      setIsEditingRoomName(false);
      setEditingRoomName('');
    }
  };

  // 방 이름 Enter/Escape 키 처리
  const handleRoomNameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      finishEditingRoomName();
    } else if (e.key === 'Escape') {
      cancelEditingRoomName();
    }
  };

  // 바둑판식 그리드 컬럼 수 계산
  const getGridColumns = (total: number) => {
    if (total <= 4) return 2;      // 2x2
    if (total <= 9) return 3;      // 3x3
    if (total <= 12) return 4;     // 4x3 (12명까지)
    return 5;                      // 5열 (13명부터)
  };

  const gridColumns = getGridColumns(totalUsers);

  return (
    <div className="max-w-6xl mx-auto min-h-screen flex flex-col bg-gradient-to-br from-primary-50 to-primary-100 dark:from-dark-900 dark:to-dark-800 p-4">
      {/* 헤더 - 여백 최적화 */}
      <div className="bg-white dark:bg-dark-800 rounded-xl p-3 shadow-lg mb-3 border border-gray-200 dark:border-dark-600">
        <div className="flex justify-between items-center gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {isEditingRoomName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editingRoomName}
                  onChange={(e) => setEditingRoomName(e.target.value)}
                  onKeyDown={handleRoomNameKeyPress}
                  onBlur={finishEditingRoomName}
                  className="text-lg font-bold text-gray-900 dark:text-gray-100 bg-white dark:bg-dark-700 border border-gray-300 dark:border-dark-600 rounded px-2 py-1 min-w-0 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  maxLength={50}
                  autoFocus
                />
                <button
                  onClick={finishEditingRoomName}
                  className="text-sm bg-green-500 dark:bg-green-600 text-white px-2 py-1 rounded hover:bg-green-600 dark:hover:bg-green-700"
                  disabled={game.loading}
                >
                  ✓
                </button>
                <button
                  onClick={cancelEditingRoomName}
                  className="text-sm bg-gray-500 dark:bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-600 dark:hover:bg-gray-700"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="relative group flex items-center gap-2 flex-1 min-w-0">
                <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">{currentRoom?.name || roomName}</h1>
                <button
                  onClick={startEditingRoomName}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 flex-shrink-0"
                  title="방 이름 편집"
                  disabled={game.loading}
                >
                  ✏️
                </button>
              </div>
            )}
            <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
              선택: {selectedUsers}/{totalUsers}
            </span>
          </div>
          <button
            onClick={onLeave}
            className="btn btn-secondary text-sm px-3 py-1.5 flex-shrink-0"
          >
            나가기
          </button>
        </div>
      </div>

      {/* 메인 게임 영역 - 여백 최적화 */}
      <div className="flex-1 flex flex-col">
        {/* 바둑판식 참여자 카드 영역 */}
        <div className="flex-1 flex flex-col items-center justify-center mb-3 p-4">
          {/* 참여자 카드 그리드 */}
          <div 
            className="grid gap-6 mb-6 w-full max-w-4xl"
            style={{ 
              gridTemplateColumns: `repeat(${gridColumns}, 1fr)`
            }}
          >
            {users.map((user, index) => {
              const isCurrentUser = user.id === game.currentUser?.id;
              
              // 카드 상태에 따른 클래스 결정
              let cardClass = 'player-card-large';
              if (currentRoom?.gameState === 'revealed' && user.selectedCard) {
                cardClass += ' revealed';
              } else if (user.selectedCard) {
                cardClass += ' selected';
              } else {
                cardClass += ' waiting';
              }
              
              if (isCurrentUser) {
                cardClass += ' current-user';
              }
              
              return (
                <div key={user.id} className="flex flex-col items-center">
                  <div className="relative">
                    <div 
                      className={cardClass}
                      title={`${user.name}${user.selectedCard ? ` - ${user.selectedCard}` : ' - 카드 미선택'}`}
                    >
                      {currentRoom?.gameState === 'revealed' && user.selectedCard ? (
                        renderCardContent(user.selectedCard)
                      ) : user.selectedCard ? (
                        '🃏'
                      ) : (
                        '⏳'
                      )}
                    </div>
                    
                    {/* 수정 아이콘 (본인 카드만, 결과 공개 후에만) */}
                    {isCurrentUser && currentRoom?.gameState === 'revealed' && (
                      <button
                        onClick={() => setIsCardModalOpen(true)}
                        className="absolute -top-2 -right-2 bg-blue-500 dark:bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors shadow-md"
                        title="카드 선택/수정"
                      >
                        ✏️
                      </button>
                    )}
                  </div>
                  
                  {/* 참여자 이름 */}
                  <div className={`player-name-large ${isCurrentUser ? 'current-user' : 'other-user'} mt-3`}>
                    {isCurrentUser && isEditingName ? (
                      <div className="flex flex-col items-center gap-2">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={handleNameKeyPress}
                          onBlur={finishEditingName}
                          className="bg-white dark:bg-dark-700 border border-gray-300 dark:border-dark-600 rounded px-2 py-1 text-sm text-center w-20 max-w-full text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                          maxLength={20}
                          autoFocus
                        />
                        <div className="flex gap-1">
                          <button
                            onClick={finishEditingName}
                            className="text-xs bg-green-500 dark:bg-green-600 text-white px-2 py-1 rounded hover:bg-green-600 dark:hover:bg-green-700"
                            disabled={game.loading}
                          >
                            ✓
                          </button>
                          <button
                            onClick={cancelEditingName}
                            className="text-xs bg-gray-500 dark:bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-600 dark:hover:bg-gray-700"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="relative group">
                        <span>{user.name}</span>
                        {isCurrentUser && (
                          <button
                            onClick={startEditingName}
                            className="absolute -right-5 top-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400"
                            title="이름 편집"
                            disabled={game.loading}
                          >
                            ✏️
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 중앙 액션 버튼 */}
          <div className="mb-4">
            {currentRoom?.gameState === 'selecting' ? (
              <button 
                className={`px-6 py-3 text-base font-semibold bg-success-600 dark:bg-success-700 text-white rounded-lg shadow-md hover:bg-success-700 dark:hover:bg-success-600 transition-colors ${!game.canRevealCards || game.loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!game.canRevealCards || game.loading}
                onClick={game.revealCards}
              >
                {game.loading ? '카드 오픈 중...' : '카드 오픈'}
              </button>
            ) : (
              <button 
                className={`px-6 py-3 text-base font-semibold bg-gray-600 dark:bg-gray-700 text-white rounded-lg shadow-md hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors ${game.loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={game.resetRound}
                disabled={game.loading}
              >
                {game.loading ? '초기화 중...' : '새 라운드'}
              </button>
            )}
          </div>
        </div>

        {/* 하단 영역: 게임 결과 (공개 후) - 패딩 최적화 */}
        <div className="bg-white dark:bg-dark-800 rounded-xl p-4 shadow-lg min-h-[280px] flex flex-col border border-gray-200 dark:border-dark-600">
          {/* 게임 결과 우선 표시 (공개 후) */}
          {game.gameResult && currentRoom?.gameState === 'revealed' ? (
            <div className="flex-1 flex flex-col justify-center">
              <GameResult 
                users={users}
                gameResult={game.gameResult}
                onNewRound={game.resetRound}
              />
            </div>
          ) : (
            /* 카드 선택 영역 (선택 중 또는 기본) */
            <div className="flex-1 flex flex-col">
              {/* 카드 선택 덱 - 여백 최소화 */}
              <div className="text-center mb-2">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-0.5">
                  스토리 포인트 선택
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  원하는 포인트 카드를 선택하세요
                </p>
              </div>
              
              {/* 카드 선택 영역 - 통합 반응형 */}
              <div className="flex-1 flex flex-col justify-center">
                <div className="flex gap-1 sm:gap-2 justify-center flex-wrap max-w-full px-1">
                  {cards.map((card) => {
                    const isSelected = game.isCardSelected(card);
                    const isDisabled = game.loading || !currentRoom;
                    
                    return (
                      <button
                        key={card}
                        className={`planning-card flex-shrink-0 
                          w-9 min-h-[2.75rem]
                          sm:w-11 sm:min-h-[3.25rem]
                          md:w-12 md:min-h-[3.5rem]
                          lg:w-14 lg:min-h-[4rem]
                          xl:w-16 xl:min-h-[4.5rem]
                          ${isSelected ? 'selected' : ''} ${getCardSpecialClass(card)} ${
                          game.loading && isSelected ? 'animate-pulse-soft' : ''
                        }`}
                        onClick={() => game.selectCard(card)}
                        disabled={isDisabled}
                        title={isDisabled ? 
                          `현재 선택할 수 없습니다` : 
                          `${card} 포인트 선택`
                        }
                      >
                        <span className="planning-card-content 
                          text-sm
                          sm:text-sm
                          md:text-base
                          lg:text-lg
                          xl:text-xl">
                          {renderCardContent(card)}
                        </span>
                        {isSelected && (
                          <div className="absolute inset-0 flex items-center justify-center bg-primary-500 bg-opacity-20 rounded-xl">
                            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6 border-2 border-primary-600 rounded-full flex items-center justify-center">
                              <div className="w-1 h-1 sm:w-1 sm:h-1 md:w-1.5 md:h-1.5 lg:w-2 lg:h-2 xl:w-2.5 xl:h-2.5 bg-primary-600 rounded-full"></div>
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 카드 선택 모달 */}
      <CardSelectionModal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        selectedCard={game.currentUser?.selectedCard || null}
        onSelectCard={game.selectCard}
        loading={game.loading}
      />

      {/* 에러 표시 - 여백 최적화 */}
      {game.error && (
        <div className="mt-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <span className="text-red-600 dark:text-red-400">❌</span>
            <span className="text-red-800 dark:text-red-300 font-medium">오류</span>
          </div>
          <p className="text-red-700 dark:text-red-400 text-sm mt-1">{game.error}</p>
          <button 
            onClick={game.clearError}
            className="text-red-600 dark:text-red-400 text-sm mt-2 underline"
          >
            오류 닫기
          </button>
        </div>
      )}
    </div>
  )
} 