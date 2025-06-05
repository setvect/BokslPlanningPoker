import { useTheme } from '../hooks/useTheme';

interface ThemeToggleProps {
  className?: string;
}

/**
 * 라이트/다크 테마 토글 버튼 컴포넌트
 * - 현재 테마에 따라 아이콘 변경
 * - 부드러운 애니메이션 효과
 * - 접근성 지원 (키보드 네비게이션, 스크린 리더)
 */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative inline-flex items-center justify-center 
        w-10 h-10 rounded-full
        bg-white dark:bg-dark-800 
        border border-gray-200 dark:border-dark-600
        shadow-md hover:shadow-lg
        transition-all duration-300 ease-in-out
        hover:scale-110 active:scale-95
        focus:outline-none focus:ring-4 focus:ring-primary-200 dark:focus:ring-primary-400
        group
        ${className}
      `}
      title={isDark ? '라이트 모드로 변경' : '다크 모드로 변경'}
      aria-label={isDark ? '라이트 모드로 변경' : '다크 모드로 변경'}
    >
      {/* 라이트 모드 아이콘 (해) */}
      <svg
        className={`
          absolute w-5 h-5 text-yellow-500 transition-all duration-500 ease-in-out
          ${isDark ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}
        `}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
          clipRule="evenodd"
        />
      </svg>

      {/* 다크 모드 아이콘 (달) */}
      <svg
        className={`
          absolute w-5 h-5 text-slate-700 dark:text-slate-300 transition-all duration-500 ease-in-out
          ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}
        `}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"
        />
      </svg>

      {/* 호버 효과용 배경 */}
      <div 
        className={`
          absolute inset-0 rounded-full transition-all duration-300
          group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20
          opacity-0 group-hover:opacity-100
        `}
      />
    </button>
  );
}; 