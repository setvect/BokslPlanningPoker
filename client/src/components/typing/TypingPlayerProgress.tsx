interface PlayerProgressInfo {
  id: string;
  name: string;
  progress: number;
  isFinished: boolean;
  rank: number | null;
  isCurrentUser: boolean;
}

interface TypingPlayerProgressProps {
  players: PlayerProgressInfo[];
}

export function TypingPlayerProgress({ players }: TypingPlayerProgressProps) {
  // 진행률 또는 순위 기준으로 정렬
  const sortedPlayers = [...players].sort((a, b) => {
    // 완료한 플레이어가 먼저
    if (a.isFinished && !b.isFinished) {
      return -1;
    }
    if (!a.isFinished && b.isFinished) {
      return 1;
    }
    // 둘 다 완료했으면 순위 순
    if (a.isFinished && b.isFinished) {
      return (a.rank || 999) - (b.rank || 999);
    }
    // 둘 다 미완료면 진행률 순
    return b.progress - a.progress;
  });

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
        참가자 현황
      </h3>

      {sortedPlayers.map((player) => (
        <div
          key={player.id}
          className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
            player.isCurrentUser
              ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700'
              : 'bg-gray-50 dark:bg-dark-700'
          }`}
        >
          {/* 순위 또는 상태 아이콘 */}
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 dark:bg-dark-600 text-sm font-bold">
            {player.isFinished ? (
              player.rank === 1 ? (
                <span className="text-yellow-500">🥇</span>
              ) : player.rank === 2 ? (
                <span className="text-gray-400">🥈</span>
              ) : player.rank === 3 ? (
                <span className="text-amber-600">🥉</span>
              ) : (
                <span className="text-gray-500 dark:text-gray-400">{player.rank}</span>
              )
            ) : (
              <span className="text-gray-400 dark:text-gray-500">⏳</span>
            )}
          </div>

          {/* 플레이어 이름 */}
          <div className="flex-1 min-w-0">
            <div className={`text-sm font-medium truncate ${
              player.isCurrentUser
                ? 'text-blue-700 dark:text-blue-300'
                : 'text-gray-700 dark:text-gray-300'
            }`}>
              {player.name}
              {player.isCurrentUser && (
                <span className="ml-1 text-xs text-blue-500 dark:text-blue-400">(나)</span>
              )}
            </div>

            {/* 진행 바 */}
            <div className="w-full h-2 bg-gray-200 dark:bg-dark-600 rounded-full mt-1 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  player.isFinished
                    ? 'bg-green-500 dark:bg-green-400'
                    : player.isCurrentUser
                    ? 'bg-blue-500 dark:bg-blue-400'
                    : 'bg-gray-400 dark:bg-gray-500'
                }`}
                style={{ width: `${player.progress}%` }}
              />
            </div>
          </div>

          {/* 진행률 표시 */}
          <div className={`text-sm font-medium ${
            player.isFinished
              ? 'text-green-600 dark:text-green-400'
              : 'text-gray-500 dark:text-gray-400'
          }`}>
            {player.isFinished ? '완료!' : `${player.progress}%`}
          </div>
        </div>
      ))}
    </div>
  );
}
