import type { TypingPlayerRanking } from '../../../../shared/types';

interface TypingRankingProps {
  rankings: TypingPlayerRanking[];
  currentPlayerId: string | null;
}

export function TypingRanking({ rankings, currentPlayerId }: TypingRankingProps) {
  // 시간 포맷팅 (ms -> 초.밀리초)
  const formatTime = (timeMs: number | null): string => {
    if (timeMs === null) {
      return '-';
    }
    const seconds = Math.floor(timeMs / 1000);
    const ms = timeMs % 1000;
    return `${seconds}.${ms.toString().padStart(3, '0')}초`;
  };

  // 순위별 메달 또는 숫자
  const getRankDisplay = (rank: number) => {
    switch (rank) {
      case 1:
        return <span className="text-2xl">🥇</span>;
      case 2:
        return <span className="text-2xl">🥈</span>;
      case 3:
        return <span className="text-2xl">🥉</span>;
      default:
        return <span className="text-lg font-bold text-gray-500 dark:text-gray-400">{rank}</span>;
    }
  };

  // 순위별 배경색
  const getRankBgClass = (rank: number, isCurrentUser: boolean) => {
    if (isCurrentUser) {
      return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700';
    }

    switch (rank) {
      case 1:
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700';
      case 2:
        return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
      case 3:
        return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700';
      default:
        return 'bg-white dark:bg-dark-800 border-gray-200 dark:border-dark-600';
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 text-center">
        라운드 결과
      </h3>

      <div className="space-y-2">
        {rankings.map((player) => {
          const isCurrentUser = player.playerId === currentPlayerId;

          return (
            <div
              key={player.playerId}
              className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${getRankBgClass(player.rank, isCurrentUser)}`}
            >
              {/* 순위 */}
              <div className="w-10 flex justify-center">
                {getRankDisplay(player.rank)}
              </div>

              {/* 플레이어 이름 */}
              <div className="flex-1">
                <span className={`font-medium ${
                  isCurrentUser
                    ? 'text-blue-700 dark:text-blue-300'
                    : 'text-gray-800 dark:text-gray-200'
                }`}>
                  {player.playerName}
                  {isCurrentUser && (
                    <span className="ml-1 text-xs text-blue-500 dark:text-blue-400">(나)</span>
                  )}
                </span>
              </div>

              {/* 완료 시간 */}
              <div className={`text-sm ${
                player.isFinished
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-gray-400 dark:text-gray-500'
              }`}>
                {player.isFinished ? formatTime(player.timeMs) : '미완료'}
              </div>
            </div>
          );
        })}
      </div>

      {rankings.length === 0 && (
        <div className="text-center text-gray-500 dark:text-gray-400 py-4">
          아직 완료한 참가자가 없습니다.
        </div>
      )}
    </div>
  );
}
