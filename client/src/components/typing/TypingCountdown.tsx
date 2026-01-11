interface TypingCountdownProps {
  count: number;
  type: 'start' | 'finish' | 'nextRound';
}

export function TypingCountdown({ count, type }: TypingCountdownProps) {
  const getMessage = () => {
    switch (type) {
      case 'start':
        return '게임 시작';
      case 'finish':
        return '라운드 종료';
      case 'nextRound':
        return '다음 라운드';
      default:
        return '';
    }
  };

  const getColorClass = () => {
    switch (type) {
      case 'start':
        return 'text-blue-500 dark:text-blue-400';
      case 'finish':
        return 'text-orange-500 dark:text-orange-400';
      case 'nextRound':
        return 'text-green-500 dark:text-green-400';
      default:
        return 'text-gray-500 dark:text-gray-400';
    }
  };

  const getBgClass = () => {
    switch (type) {
      case 'start':
        return 'bg-blue-100 dark:bg-blue-900/30';
      case 'finish':
        return 'bg-orange-100 dark:bg-orange-900/30';
      case 'nextRound':
        return 'bg-green-100 dark:bg-green-900/30';
      default:
        return 'bg-gray-100 dark:bg-gray-800';
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center p-8 rounded-xl ${getBgClass()}`}>
      <div className={`text-lg font-medium mb-2 ${getColorClass()}`}>
        {getMessage()}
      </div>
      <div className={`text-7xl font-bold ${getColorClass()} animate-pulse`}>
        {count}
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
        {type === 'start' && '준비하세요!'}
        {type === 'finish' && '곧 종료됩니다!'}
        {type === 'nextRound' && '잠시 후 시작합니다'}
      </div>
    </div>
  );
}
