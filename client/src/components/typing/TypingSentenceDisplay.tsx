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
    const result: { char: string; className: string; isSpecial: boolean; isSpaceGroup?: boolean }[] = [];
    let targetIndex = 0;

    for (let i = 0; i < displayText.length; i++) {
      const displayChar = displayText[i];

      // 특수문자 확인 (복사 방지용)
      const isSpecialChar = isSpecialCharacter(displayChar);

      // 공백 + 특수문자 + 공백 그룹 감지
      if (displayChar === ' ' && i + 2 < displayText.length) {
        const nextChar = displayText[i + 1];
        const nextNextChar = displayText[i + 2];

        // " 특수문자 " 패턴 감지
        if (isSpecialCharacter(nextChar) && nextNextChar === ' ') {
          // 세 글자를 하나의 그룹으로 처리 (실제 공백 하나와 동일한 너비)
          if (targetIndex >= targetText.length) {
            result.push({
              char: ' ',
              className: 'text-gray-400 dark:text-gray-500',
              isSpecial: false,
              isSpaceGroup: true,
            });
            i += 2; // 특수문자와 뒤 공백 건너뛰기
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

          // 공백으로 렌더링하되 내부에 숨겨진 특수문자 포함
          result.push({
            char: ` ${nextChar} `,
            className,
            isSpecial: false,
            isSpaceGroup: true,
          });

          targetIndex++;
          i += 2; // 특수문자와 뒤 공백 건너뛰기
          continue;
        }
      }

      if (isSpecialChar) {
        // 단독 특수문자 (그룹으로 처리되지 않은 경우)
        result.push({
          char: displayChar,
          className: 'text-gray-300 dark:text-gray-600',
          isSpecial: true,
        });
      } else if (displayChar === ' ') {
        // 일반 공백
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
        {renderedChars.map((item, index) => {
          if (item.isSpaceGroup) {
            // 공백 그룹: 공백 표시 + 특수문자를 반투명하게 오버레이
            return (
              <span key={index} className={`${item.className} relative`}>
                {' '}
                <span className="absolute left-0 top-0 w-full text-center text-gray-300 dark:text-gray-600 text-xs opacity-30 pointer-events-none select-none">
                  {item.char.trim()}
                </span>
              </span>
            );
          }

          return (
            <span
              key={index}
              className={`${item.className} ${item.isSpecial ? 'text-xs align-middle' : ''}`}
            >
              {item.char}
            </span>
          );
        })}
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
