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
  primaryLight: string;
  primaryGradient: readonly [string, string];
  secondary: string;
  error: string;
  success: string;
  warning: string;
  info: string;
  tealTint: string;
  greenTint: string;
  yellowTint: string;
  redTint: string;
  blueTint: string;
  inputBg: string;
  inputBgFocused: string;
  sidebarOverlay: string;
  sidebarBg: string;
  dateContainerBg: string;
  // Aliases for compatibility
  glow1: string;
  glow2: string;
  purple: string;
  surface: string;
  background: string;
};

export const darkTheme: ThemeColors = {
  backgroundGradient: ['#031c20', '#042a30', '#031c20'],
  cardBg: 'rgba(8, 42, 48, 0.92)',
  cardBgSolid: '#062830',
  border: 'rgba(19, 157, 158, 0.18)',
  textPrimary: '#e8f5f5',
  textSecondary: '#8ecece',
  textMuted: '#4a8c8c',
  primary: '#139D9E',
  primaryLight: '#1cc4c5',
  primaryGradient: ['#08697A', '#139D9E'],
  secondary: '#A6CE38',
  error: '#ef4444',
  success: '#A6CE38',
  warning: '#f59e0b',
  info: '#38bdf8',
  tealTint: 'rgba(19, 157, 158, 0.12)',
  greenTint: 'rgba(166, 206, 56, 0.12)',
  yellowTint: 'rgba(245, 158, 11, 0.12)',
  redTint: 'rgba(239, 68, 68, 0.12)',
  blueTint: 'rgba(56, 189, 248, 0.12)',
  inputBg: 'rgba(4, 30, 35, 0.7)',
  inputBgFocused: 'rgba(4, 30, 35, 0.95)',
  sidebarOverlay: 'rgba(2, 12, 14, 0.88)',
  sidebarBg: '#041e22',
  dateContainerBg: 'rgba(8, 42, 48, 0.6)',
  glow1: 'rgba(19, 157, 158, 0.15)',
  glow2: 'rgba(166, 206, 56, 0.08)',
  purple: '#139D9E', // Harmonized with corporate teal
  surface: 'rgba(8, 42, 48, 0.92)',
  background: '#041e22',
};

export const lightTheme: ThemeColors = {
  backgroundGradient: ['#f0fafa', '#e8f7f7', '#f0fafa'],
  cardBg: 'rgba(255, 255, 255, 0.98)',
  cardBgSolid: '#ffffff',
  border: 'rgba(8, 105, 122, 0.14)',
  textPrimary: '#0a2b32',
  textSecondary: '#2d6b78',
  textMuted: '#7aacb5',
  primary: '#08697A',
  primaryLight: '#139D9E',
  primaryGradient: ['#08697A', '#139D9E'],
  secondary: '#A6CE38',
  error: '#dc2626',
  success: '#7aaa1e',
  warning: '#d97706',
  info: '#0284c7',
  tealTint: 'rgba(8, 105, 122, 0.08)',
  greenTint: 'rgba(166, 206, 56, 0.12)',
  yellowTint: 'rgba(217, 119, 6, 0.1)',
  redTint: 'rgba(220, 38, 38, 0.08)',
  blueTint: 'rgba(2, 132, 199, 0.08)',
  inputBg: 'rgba(255, 255, 255, 0.8)',
  inputBgFocused: '#ffffff',
  sidebarOverlay: 'rgba(4, 30, 35, 0.72)',
  sidebarBg: '#ffffff',
  dateContainerBg: 'rgba(255, 255, 255, 0.8)',
  glow1: 'rgba(8, 105, 122, 0.08)',
  glow2: 'rgba(166, 206, 56, 0.08)',
  purple: '#08697A', // Harmonized with corporate teal
  surface: 'rgba(255, 255, 255, 0.98)',
  background: '#f0fafa',
};

interface ThemeContextType {
  isDarkMode: boolean;
  theme: ThemeColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  theme: lightTheme,
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
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

  if (!isLoaded) return null;

  return (
    <ThemeContext.Provider value={{ isDarkMode, theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
