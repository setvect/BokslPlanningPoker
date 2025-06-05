import { useState, useEffect, useCallback } from 'react';

export type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'planning-poker-theme';

/**
 * 테마 관리 커스텀 훅
 * - 로컬 스토리지에서 테마 설정을 불러오고 저장
 * - 시스템 다크모드 설정을 감지
 * - HTML 클래스 자동 관리
 */
export const useTheme = () => {
  // 초기 테마 결정
  const getInitialTheme = (): Theme => {
    try {
      // 로컬 스토리지에서 저장된 테마 확인
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme;
      if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme;
      }
    } catch {
      // 로컬 스토리지 접근 실패 시 무시
    }

    // 시스템 다크모드 설정 확인
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    return 'light';
  };

  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  // HTML 클래스 업데이트
  const updateHtmlClass = useCallback((newTheme: Theme) => {
    const html = document.documentElement;
    if (newTheme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, []);

  // 테마 변경 함수
  const toggleTheme = useCallback(() => {
    const newTheme: Theme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    // 로컬 스토리지에 저장
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      // 로컬 스토리지 접근 실패 시 무시
    }
    
    updateHtmlClass(newTheme);
  }, [theme, updateHtmlClass]);

  // 특정 테마로 설정
  const setSpecificTheme = useCallback((newTheme: Theme) => {
    setTheme(newTheme);
    
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      // 로컬 스토리지 접근 실패 시 무시
    }
    
    updateHtmlClass(newTheme);
  }, [updateHtmlClass]);

  // 초기 HTML 클래스 설정 및 시스템 테마 변경 감지
  useEffect(() => {
    updateHtmlClass(theme);

    // 시스템 테마 변경 감지
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      // 사용자가 수동으로 테마를 설정했는지 확인
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (!savedTheme) {
        // 저장된 테마가 없으면 시스템 테마 따라가기
        const systemTheme: Theme = e.matches ? 'dark' : 'light';
        setTheme(systemTheme);
        updateHtmlClass(systemTheme);
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [theme, updateHtmlClass]);

  return {
    theme,
    toggleTheme,
    setTheme: setSpecificTheme,
    isDark: theme === 'dark',
  };
}; 