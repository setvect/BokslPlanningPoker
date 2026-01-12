import type { TypingRoomListItem } from '../../../../shared/types';
import { TypingGameState } from '../../../../shared/types';

interface TypingRoomListProps {
  rooms: TypingRoomListItem[];
  loading: boolean;
  onRefresh: () => void;
  onJoinRoom: (roomId: string, roomName: string) => void;
  refreshing: boolean;
}

export function TypingRoomList({
  rooms,
  loading,
  onRefresh,
  onJoinRoom,
  refreshing,
}: TypingRoomListProps) {
  // 게임 상태 표시
  const getStateDisplay = (state: TypingGameState) => {
    switch (state) {
      case TypingGameState.WAITING:
        return {
          text: '대기',
          className: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300',
        };
      case TypingGameState.COUNTDOWN:
        return {
          text: '준비',
          className: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-300',
        };
      case TypingGameState.PLAYING:
        return {
          text: '진행',
          className: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300',
        };
      case TypingGameState.ROUND_END:
        return {
          text: '종료',
          className: 'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-300',
        };
      default:
        return {
          text: '알 수 없음',
          className: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
        };
    }
  };

  return (
    <div className="bg-white dark:bg-dark-800 rounded-xl p-8 shadow-lg border-2 border-gray-200 dark:border-dark-600">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="text-4xl">📋</div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            게임 방 목록
          </h2>
        </div>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-50"
          title="새로고침"
        >
          {refreshing ? '🔄' : '↻'}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent mx-auto mb-2"></div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">로딩 중...</p>
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400 text-sm">현재 활성화된 방이 없습니다</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">새 방을 만들어보세요!</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin">
          {rooms.map((room) => {
            const stateDisplay = getStateDisplay(room.gameState);

            return (
              <div
                key={room.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-600 transition-colors cursor-pointer"
                onClick={() => onJoinRoom(room.id, room.name)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {room.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {room.playerCount}/{room.maxPlayers}명
                  </div>
                  {room.roundNumber > 0 && (
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      R{room.roundNumber}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className={`px-2 py-1 rounded ${stateDisplay.className}`}>
                    {stateDisplay.text}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
