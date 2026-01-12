import { useMemo } from 'react';

interface TypingSentenceDisplayProps {
  displayText: string;   // 특수문자가 포함된 표시용 텍스트
  targetText: string;    // 실제 비교용 텍스트
  userInput: string;     // 사용자 입력
  errorPositions: number[];  // 오타 위치
}

export function TypingSentenceDisplay({
  displayText,
  targetText,
  userInput,
  errorPositions,
}: TypingSentenceDisplayProps) {
  // 문자별 스타일 계산
  const renderedChars = useMemo(() => {
    const result: { char: string; className: string; isSpecial: boolean }[] = [];
    let targetIndex = 0;

    for (let i = 0; i < displayText.length; i++) {
      const displayChar = displayText[i];

      // 특수문자 확인 (복사 방지용)
      const isSpecialChar = isSpecialCharacter(displayChar);

      if (isSpecialChar) {
        // 특수문자는 회색으로 표시 (입력 불필요)
        result.push({
          char: displayChar,
          className: 'text-gray-300 dark:text-gray-600',
          isSpecial: true,
        });
      } else if (displayChar === ' ') {
        // 공백 처리: 특수문자 뒤의 공백인지 확인
        const prevChar = i > 0 ? displayText[i - 1] : null;
        const isPrevSpecial = prevChar && isSpecialCharacter(prevChar);

        // 특수문자 바로 뒤의 공백만 무시 (특수문자 앞의 공백은 실제 띄어쓰기)
        if (isPrevSpecial) {
          // 특수문자 바로 뒤의 공백 → 장식용이므로 무시
          result.push({
            char: displayChar,
            className: 'text-gray-300 dark:text-gray-600',
            isSpecial: true,
          });
        } else {
          // 특수문자 앞의 공백 또는 일반 공백 → 실제 띄어쓰기
          if (targetIndex >= targetText.length) {
            result.push({
              char: displayChar,
              className: 'text-gray-400 dark:text-gray-500',
              isSpecial: false,
            });
            continue;
          }

          const targetChar = targetText[targetIndex];
          const inputChar = userInput[targetIndex];

          let className = 'text-gray-400 dark:text-gray-500';

          if (targetIndex < userInput.length) {
            if (errorPositions.includes(targetIndex)) {
              className = 'text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
            } else if (inputChar === targetChar) {
              className = 'text-green-600 dark:text-green-400';
            }
          } else if (targetIndex === userInput.length) {
            className = 'text-gray-700 dark:text-gray-300 border-b-2 border-blue-500';
          }

          result.push({
            char: displayChar,
            className,
            isSpecial: false,
          });

          targetIndex++;
        }
      } else {
        // 일반 문자 (공백이 아닌 문자)
        if (targetIndex >= targetText.length) {
          result.push({
            char: displayChar,
            className: 'text-gray-400 dark:text-gray-500',
            isSpecial: false,
          });
          continue;
        }

        const targetChar = targetText[targetIndex];
        const inputChar = userInput[targetIndex];

        let className = 'text-gray-400 dark:text-gray-500';

        if (targetIndex < userInput.length) {
          if (errorPositions.includes(targetIndex)) {
            className = 'text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
          } else if (inputChar === targetChar) {
            className = 'text-green-600 dark:text-green-400';
          }
        } else if (targetIndex === userInput.length) {
          className = 'text-gray-700 dark:text-gray-300 border-b-2 border-blue-500';
        }

        result.push({
          char: displayChar,
          className,
          isSpecial: false,
        });

        targetIndex++;
      }
    }

    return result;
  }, [displayText, targetText, userInput, errorPositions]);

  return (
    <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4 mb-4">
      <div className="text-lg leading-relaxed font-mono select-none" style={{ wordBreak: 'keep-all' }}>
        {renderedChars.map((item, index) => (
          <span
            key={index}
            className={`${item.className} ${item.isSpecial ? 'text-xs align-middle mx-0.5' : ''}`}
          >
            {item.char}
          </span>
        ))}
      </div>
    </div>
  );
}

// 특수문자 확인 (복사 방지용)
function isSpecialCharacter(char: string): boolean {
  // 복사 방지용 특수문자들
  const specialChars = ['·', '•', '◦', '‧', '∙', '⋅', '․'];
  return specialChars.includes(char);
}
