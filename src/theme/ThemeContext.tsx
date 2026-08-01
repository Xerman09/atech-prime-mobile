import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeColors = {
  backgroundGradient: readonly [string, string, string];
  cardBg: string;
  cardBgSolid: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryGradient: readonly [string, string];
  error: string;
  success: string;
  warning: string;
  purple: string;
  glow1: string;
  glow2: string;
  inputBg: string;
  inputBgFocused: string;
  sidebarOverlay: string;
  sidebarBg: string;
  dateContainerBg: string;
};

export const darkTheme: ThemeColors = {
  backgroundGradient: ['#020617', '#0f172a', '#020617'],
  cardBg: 'rgba(15, 23, 42, 0.85)',
  cardBgSolid: '#0f172a',
  border: 'rgba(51, 65, 85, 0.5)',
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  primary: '#38bdf8',
  primaryGradient: ['#0284c7', '#2563eb'],
  error: '#ef4444',
  success: '#22c55e',
  warning: '#f59e0b',
  purple: '#a855f7',
  glow1: 'rgba(56, 189, 248, 0.15)',
  glow2: 'rgba(37, 99, 235, 0.15)',
  inputBg: 'rgba(2, 6, 23, 0.5)',
  inputBgFocused: 'rgba(2, 6, 23, 0.8)',
  sidebarOverlay: 'rgba(2, 6, 23, 0.85)',
  sidebarBg: '#0f172a',
  dateContainerBg: 'rgba(15, 23, 42, 0.6)',
};

export const lightTheme: ThemeColors = {
  backgroundGradient: ['#f8fafc', '#f1f5f9', '#f8fafc'],
  cardBg: 'rgba(255, 255, 255, 0.9)',
  cardBgSolid: '#ffffff',
  border: 'rgba(203, 213, 225, 0.8)',
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#64748b',
  primary: '#2563eb', // Darker blue for visibility on light bg
  primaryGradient: ['#3b82f6', '#1d4ed8'],
  error: '#dc2626',
  success: '#16a34a',
  warning: '#d97706',
  purple: '#9333ea',
  glow1: 'rgba(56, 189, 248, 0.25)',
  glow2: 'rgba(37, 99, 235, 0.25)',
  inputBg: 'rgba(255, 255, 255, 0.8)',
  inputBgFocused: 'rgba(255, 255, 255, 1)',
  sidebarOverlay: 'rgba(255, 255, 255, 0.7)',
  sidebarBg: '#ffffff',
  dateContainerBg: 'rgba(255, 255, 255, 0.7)',
};

interface ThemeContextType {
  isDarkMode: boolean;
  theme: ThemeColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: true,
  theme: darkTheme,
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme_preference');
        if (savedTheme !== null) {
          setIsDarkMode(savedTheme === 'dark');
        }
      } catch (e) {
        console.error('Failed to load theme preference', e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    try {
      await AsyncStorage.setItem('theme_preference', newMode ? 'dark' : 'light');
    } catch (e) {
      console.error('Failed to save theme preference', e);
    }
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  if (!isLoaded) return null; // Or a loading spinner

  return (
    <ThemeContext.Provider value={{ isDarkMode, theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
