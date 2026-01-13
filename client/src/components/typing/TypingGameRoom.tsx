import { useTypingGame } from '../../hooks/useTypingGame';
import { TypingGameState } from '../../../../shared/types';
import { TypingCountdown } from './TypingCountdown';
import { TypingSentenceDisplay } from './TypingSentenceDisplay';
import { TypingInput } from './TypingInput';
import { TypingPlayerProgress } from './TypingPlayerProgress';
import { TypingRanking } from './TypingRanking';

interface TypingGameRoomProps {
  game: ReturnType<typeof useTypingGame>;
  onLeave: () => void;
}

export function TypingGameRoom({ game, onLeave }: TypingGameRoomProps) {
  // 게임 진행 중에는 관전자도 참가자로 표시 (새 라운드 시작 시 관전자 상태가 해제됨)
  const isGameInProgress = game.gameState === TypingGameState.PLAYING ||
                           game.gameState === TypingGameState.ROUND_END;

  // 참가자 목록 변환
  const playerProgressList = game.room?.players.map(player => ({
    id: player.id,
    name: player.name,
    progress: player.id === game.playerId ? game.progress : (game.playerProgress.get(player.id)?.progress || 0),
    isFinished: player.id === game.playerId ? game.isFinished : (game.playerProgress.get(player.id)?.isFinished || false),
    rank: player.id === game.playerId ? game.rank : (game.playerProgress.get(player.id)?.rank || null),
    isCurrentUser: player.id === game.playerId,
  })).filter(p => {
    // 게임 진행 중이면 현재 사용자의 관전 상태(game.isSpectator)를 참조
    if (p.isCurrentUser) {
      return !game.isSpectator;
    }
    // 다른 플레이어는 서버 데이터 참조 (게임 진행 중이면 모두 표시)
    const serverPlayer = game.room?.players.find(rp => rp.id === p.id);
    return isGameInProgress || !serverPlayer?.isSpectator;
  }) || [];

  // 참가자 수 계산 (게임 진행 중이면 관전자도 포함)
  const totalPlayers = isGameInProgress
    ? (game.room?.players.length || 0) - (game.isSpectator ? 1 : 0)
    : (game.room?.players.filter(p => !p.isSpectator).length || 0);
  const spectatorCount = isGameInProgress
    ? (game.isSpectator ? 1 : 0)
    : (game.room?.players.filter(p => p.isSpectator).length || 0);

  // 카운트다운 타입 결정
  const getCountdownType = () => {
    if (game.gameState === TypingGameState.COUNTDOWN) {
      return 'start';
    }
    if (game.gameState === TypingGameState.PLAYING && game.countdown !== null) {
      return 'finish';
    }
    if (game.gameState === TypingGameState.ROUND_END) {
      return 'nextRound';
    }
    return 'start';
  };

  // 완료 여부 확인
  const isInputComplete = game.sentence !== null && game.input === game.sentence.text;

  return (
    <div className="max-w-7xl mx-auto min-h-screen flex flex-col bg-gradient-to-br from-primary-50 to-primary-100 dark:from-dark-900 dark:to-dark-800 p-4">
      {/* 헤더 */}
      <div className="bg-white dark:bg-dark-800 rounded-xl p-4 shadow-lg mb-4 border border-gray-200 dark:border-dark-600">
        <div className="flex justify-between items-center gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
              {game.room?.name || '타자 게임'}
            </h1>
            <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
              {game.roundNumber > 0 ? `라운드 ${game.roundNumber}` : '대기 중'}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
              참가자: {totalPlayers}명
              {spectatorCount > 0 && ` (관전: ${spectatorCount}명)`}
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

      {/* 메인 게임 영역 */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 왼쪽: 게임 영역 */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* 게임 상태별 컨텐츠 */}
          <div className="bg-white dark:bg-dark-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-dark-600 flex-1 flex flex-col">
            {/* 대기 상태 */}
            {game.gameState === TypingGameState.WAITING && !game.countdown && (
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="text-6xl mb-4">⌨️</div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                  타자 게임
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
                  {game.isSpectator
                    ? '다음 라운드부터 참여할 수 있습니다.'
                    : '게임을 시작해주세요!'}
                </p>

                {game.canStartGame && (
                  <button
                    onClick={game.startGame}
                    disabled={game.loading}
                    className="btn btn-primary px-8 py-3 text-lg"
                  >
                    {game.loading ? '시작 중...' : '게임 시작'}
                  </button>
                )}

                {!game.isHost && !game.isSpectator && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                    방장이 게임을 시작할 때까지 기다려주세요.
                  </p>
                )}
              </div>
            )}

            {/* 카운트다운 상태 */}
            {(game.gameState === TypingGameState.COUNTDOWN ||
              (game.gameState === TypingGameState.WAITING && game.countdown !== null) ||
              (game.gameState === TypingGameState.ROUND_END && game.countdown !== null)) && (
              <div className="flex-1 flex items-center justify-center">
                <TypingCountdown
                  count={game.countdown || 0}
                  type={getCountdownType()}
                />
              </div>
            )}

            {/* 플레이 상태 */}
            {game.gameState === TypingGameState.PLAYING && game.sentence && (
              <div className="flex-1 flex flex-col">
                {/* 문장 표시 */}
                <TypingSentenceDisplay
                  displayText={game.sentence.displayText}
                  targetText={game.sentence.text}
                  userInput={game.input}
                  errorPositions={game.errorPositions}
                />

                {/* 입력창 */}
                {!game.isSpectator ? (
                  <TypingInput
                    value={game.input}
                    onChange={game.handleInput}
                    onSubmit={game.handleSubmit}
                    disabled={game.isFinished}
                    hasErrors={game.errorPositions.length > 0}
                    isComplete={isInputComplete}
                    placeholder={game.isFinished ? '완료!' : '위 문장을 입력하세요...'}
                  />
                ) : (
                  <div className="bg-gray-100 dark:bg-dark-700 rounded-lg p-4 text-center text-gray-500 dark:text-gray-400">
                    관전 중입니다. 다음 라운드부터 참여할 수 있습니다.
                  </div>
                )}

                {/* 1등 완료 후 카운트다운 표시 */}
                {game.countdown !== null && (
                  <div className="mt-4 bg-orange-100 dark:bg-orange-900/20 rounded-lg p-3 text-center">
                    <span className="text-orange-600 dark:text-orange-400 font-medium">
                      라운드 종료까지 {game.countdown}초!
                    </span>
                  </div>
                )}

                {/* 완료 메시지 */}
                {game.isFinished && game.rank && (
                  <div className="mt-4 text-center">
                    <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-4 py-2 rounded-lg">
                      {game.rank === 1 && <span className="text-2xl">🥇</span>}
                      {game.rank === 2 && <span className="text-2xl">🥈</span>}
                      {game.rank === 3 && <span className="text-2xl">🥉</span>}
                      <span className="font-medium">{game.rank}등으로 완료!</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 라운드 종료 상태 */}
            {game.gameState === TypingGameState.ROUND_END && game.roundResult && (
              <div className="flex-1 flex flex-col">
                <TypingRanking
                  rankings={game.rankings}
                  currentPlayerId={game.playerId}
                />

                {game.countdown !== null && game.countdown > 0 && (
                  <div className="mt-6 text-center text-gray-600 dark:text-gray-400">
                    다음 라운드까지 {game.countdown}초...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 오른쪽: 참가자 진행 상황 */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-dark-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-dark-600 sticky top-4">
            <TypingPlayerProgress players={playerProgressList} />
          </div>
        </div>
      </div>

      {/* 에러 표시 */}
      {game.error && (
        <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3">
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
  );
}
