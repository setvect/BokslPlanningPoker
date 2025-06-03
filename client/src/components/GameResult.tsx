import React from 'react';
import type { User, GameResult as GameResultType } from '../types';

interface GameResultProps {
  users: User[];
  gameResult: GameResultType;
  onNewRound: () => void;
  className?: string;
}

export default function GameResult({ users, gameResult, onNewRound, className = '' }: GameResultProps) {
  // 참여자들을 선택한 카드별로 그룹화
  const groupedByCard = users
    .filter(user => user.selectedCard)
    .reduce((groups, user) => {
      const card = user.selectedCard!;
      if (!groups[card]) {
        groups[card] = [];
      }
      groups[card].push(user);
      return groups;
    }, {} as Record<string, User[]>);

  // 카드별 정렬 (숫자 우선, 특수 카드는 뒤로)
  const sortedCards = Object.keys(groupedByCard).sort((a, b) => {
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    
    // 둘 다 숫자인 경우
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }
    
    // 분수 처리 (1/2)
    if (a === '1/2') return -1;
    if (b === '1/2') return 1;
    
    // 하나는 숫자, 하나는 특수 카드
    if (!isNaN(numA) && isNaN(numB)) return -1;
    if (isNaN(numA) && !isNaN(numB)) return 1;
    
    // 둘 다 특수 카드인 경우 (?, 커피)
    return a.localeCompare(b);
  });

  // 카드별 색상 지정
  const getCardColor = (card: string) => {
    const num = parseFloat(card);
    if (card === '1/2') return 'bg-purple-100 text-purple-800 border-purple-300';
    if (!isNaN(num)) {
      if (num <= 3) return 'bg-green-100 text-green-800 border-green-300';
      if (num <= 8) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      if (num <= 20) return 'bg-orange-100 text-orange-800 border-orange-300';
      return 'bg-red-100 text-red-800 border-red-300';
    }
    if (card === '?') return 'bg-indigo-100 text-indigo-800 border-indigo-300';
    if (card === '커피') return 'bg-amber-100 text-amber-800 border-amber-300';
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  // 통계 계산
  const totalParticipants = users.filter(user => user.selectedCard).length;
  const numericVotes = users
    .filter(user => user.selectedCard && !isNaN(parseFloat(user.selectedCard)) || user.selectedCard === '1/2')
    .length;

  return (
    <div className={`bg-white rounded-xl p-6 shadow-lg ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">
          🎯 게임 결과
        </h3>
        <button 
          onClick={onNewRound}
          className="btn btn-primary"
        >
          새 라운드 시작
        </button>
      </div>

      {/* 평균값 및 통계 요약 */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* 평균값 */}
        <div className="text-center p-4 bg-primary-50 rounded-lg border border-primary-200">
          <div className="text-sm text-primary-600 font-medium mb-1">평균 포인트</div>
          <div className="text-3xl font-bold text-primary-700">
            {gameResult.average !== null ? gameResult.average.toFixed(1) : 'N/A'}
          </div>
          <div className="text-xs text-primary-500 mt-1">
            {numericVotes > 0 ? `${numericVotes}명의 숫자 투표 기준` : '숫자 투표 없음'}
          </div>
        </div>

        {/* 참여 통계 */}
        <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="text-sm text-green-600 font-medium mb-1">참여율</div>
          <div className="text-3xl font-bold text-green-700">
            {((totalParticipants / users.length) * 100).toFixed(0)}%
          </div>
          <div className="text-xs text-green-500 mt-1">
            {totalParticipants}/{users.length}명 참여
          </div>
        </div>
      </div>

      {/* 카드별 투표 결과 */}
      <div className="mb-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">📊 카드별 투표 결과</h4>
        <div className="space-y-3">
          {sortedCards.map(card => {
            const votersForCard = groupedByCard[card];
            const percentage = (votersForCard.length / totalParticipants) * 100;
            
            return (
              <div key={card} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`
                      px-3 py-1.5 rounded-lg border font-mono font-bold text-lg
                      ${getCardColor(card)}
                    `}>
                      {card}
                    </div>
                    <div className="text-gray-600">
                      <span className="font-medium">{votersForCard.length}명</span>
                      <span className="text-sm ml-1">({percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                </div>
                
                {/* 진행률 바 */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                
                {/* 투표한 사용자 목록 */}
                <div className="flex flex-wrap gap-2">
                  {votersForCard.map(user => (
                    <span 
                      key={user.id}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full"
                    >
                      {user.name}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 미참여자 표시 */}
      {users.filter(user => !user.selectedCard).length > 0 && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-600 mb-2">
            🚫 미참여자 ({users.filter(user => !user.selectedCard).length}명)
          </h4>
          <div className="flex flex-wrap gap-2">
            {users
              .filter(user => !user.selectedCard)
              .map(user => (
                <span 
                  key={user.id}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full"
                >
                  {user.name}
                </span>
              ))
            }
          </div>
        </div>
      )}

      {/* 추가 액션 */}
      <div className="mt-6 pt-4 border-t">
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button 
            onClick={onNewRound}
            className="btn btn-primary flex items-center gap-2"
          >
            🔄 새 라운드 시작
          </button>
          <button 
            onClick={() => {
              const resultText = `플래닝 포커 결과\n평균: ${
                gameResult.average !== null ? gameResult.average.toFixed(1) : 'N/A'
              }\n참여: ${totalParticipants}/${users.length}명\n\n카드별 결과:\n${
                sortedCards.map(card => 
                  `${card}: ${groupedByCard[card].length}명 (${groupedByCard[card].map(u => u.name).join(', ')})`
                ).join('\n')
              }`;
              
              if (navigator.share) {
                navigator.share({
                  title: '플래닝 포커 결과',
                  text: resultText
                });
              } else {
                navigator.clipboard.writeText(resultText);
                alert('결과가 클립보드에 복사되었습니다!');
              }
            }}
            className="btn btn-secondary flex items-center gap-2"
          >
            📋 결과 공유
          </button>
        </div>
      </div>
    </div>
  );
} 