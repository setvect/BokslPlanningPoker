import { useRef, useEffect, useCallback } from 'react';

interface TypingInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  hasErrors: boolean;
  isComplete: boolean;
  placeholder?: string;
}

export function TypingInput({
  value,
  onChange,
  onSubmit,
  disabled,
  hasErrors,
  isComplete,
  placeholder = '여기에 입력하세요...',
}: TypingInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // 자동 포커스
  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);

  // 붙여넣기 방지
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    console.warn('붙여넣기가 차단되었습니다.');
  }, []);

  // 키 입력 처리
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      if (hasErrors) {
        // 오타가 있으면 제출 불가
        return;
      }

      if (isComplete) {
        onSubmit();
      }
    }
  }, [hasErrors, isComplete, onSubmit]);

  // 입력 변경 처리
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  // 입력창 스타일 결정
  const getInputClassName = () => {
    let className = 'w-full px-4 py-3 text-lg font-mono rounded-lg border-2 transition-colors focus:outline-none ';

    if (disabled) {
      className += 'bg-gray-100 dark:bg-dark-700 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-dark-600 cursor-not-allowed ';
    } else if (hasErrors) {
      className += 'bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100 border-red-400 dark:border-red-500 focus:border-red-500 dark:focus:border-red-400 ';
    } else if (isComplete) {
      className += 'bg-green-50 dark:bg-green-900/20 text-gray-900 dark:text-gray-100 border-green-400 dark:border-green-500 focus:border-green-500 dark:focus:border-green-400 ';
    } else {
      className += 'bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-dark-600 focus:border-blue-500 dark:focus:border-blue-400 ';
    }

    return className;
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        disabled={disabled}
        placeholder={placeholder}
        className={getInputClassName()}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
      />

      {/* 상태 표시 */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
        {hasErrors && (
          <span className="text-red-500 dark:text-red-400 text-sm">
            오타가 있습니다
          </span>
        )}
        {isComplete && !hasErrors && (
          <span className="text-green-500 dark:text-green-400 text-sm">
            Enter를 눌러 완료!
          </span>
        )}
      </div>
    </div>
  );
}
