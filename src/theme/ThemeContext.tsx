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
  // Frontend Signature Gradients
  accentGradient: readonly [string, string, string]; // from-blue-600 via-indigo-500 to-cyan-400
  brandGradient: readonly [string, string, string];  // Deep Teal -> Bright Teal -> Lime Green
  secondary: string;
  error: string;
  success: string;
  warning: string;
  info: string;
  // Authentic Frontend Color Accents
  emerald: string;
  indigo: string;
  royalBlue: string;
  cyan: string;
  aqua: string;
  rose: string;
  amber: string;
  // Tint Tokens
  tealTint: string;
  greenTint: string;
  yellowTint: string;
  redTint: string;
  blueTint: string;
  emeraldTint: string;
  indigoTint: string;
  roseTint: string;
  amberTint: string;
  cyanTint: string;
  // Inputs & Shell
  inputBg: string;
  inputBgFocused: string;
  sidebarOverlay: string;
  sidebarBg: string;
  dateContainerBg: string;
  // Compatibility Aliases
  glow1: string;
  glow2: string;
  purple: string;
  surface: string;
  background: string;
};

export const darkTheme: ThemeColors = {
  backgroundGradient: ['#031c20', '#042a30', '#031c20'],
  cardBg: 'rgba(8, 42, 48, 0.94)',
  cardBgSolid: '#062830',
  border: 'rgba(19, 157, 158, 0.22)',
  textPrimary: '#e8f5f5',
  textSecondary: '#8ecece',
  textMuted: '#4a8c8c',
  primary: '#139D9E',
  primaryLight: '#1cc4c5',
  primaryGradient: ['#08697A', '#139D9E'],
  accentGradient: ['#2563eb', '#6366f1', '#22d3ee'],
  brandGradient: ['#08697A', '#139D9E', '#A6CE38'],
  secondary: '#A6CE38',
  error: '#f43f5e',
  success: '#10b981',
  warning: '#f59e0b',
  info: '#38bdf8',
  emerald: '#10b981',
  indigo: '#6366f1',
  royalBlue: '#2563eb',
  cyan: '#22d3ee',
  aqua: '#8ED6D4',
  rose: '#f43f5e',
  amber: '#f59e0b',
  tealTint: 'rgba(19, 157, 158, 0.16)',
  greenTint: 'rgba(166, 206, 56, 0.16)',
  yellowTint: 'rgba(245, 158, 11, 0.16)',
  redTint: 'rgba(244, 63, 94, 0.16)',
  blueTint: 'rgba(37, 99, 235, 0.16)',
  emeraldTint: 'rgba(16, 185, 129, 0.16)',
  indigoTint: 'rgba(99, 102, 241, 0.16)',
  roseTint: 'rgba(244, 63, 94, 0.16)',
  amberTint: 'rgba(245, 158, 11, 0.16)',
  cyanTint: 'rgba(34, 211, 238, 0.16)',
  inputBg: 'rgba(4, 30, 35, 0.75)',
  inputBgFocused: 'rgba(4, 30, 35, 0.98)',
  sidebarOverlay: 'rgba(2, 12, 14, 0.9)',
  sidebarBg: '#041e22',
  dateContainerBg: 'rgba(8, 42, 48, 0.7)',
  glow1: 'rgba(37, 99, 235, 0.18)',
  glow2: 'rgba(166, 206, 56, 0.12)',
  purple: '#6366f1',
  surface: 'rgba(8, 42, 48, 0.94)',
  background: '#041e22',
};

export const lightTheme: ThemeColors = {
  backgroundGradient: ['#f0fafa', '#e6f6f6', '#f0fafa'],
  cardBg: 'rgba(255, 255, 255, 0.98)',
  cardBgSolid: '#ffffff',
  border: 'rgba(8, 105, 122, 0.18)',
  textPrimary: '#0a2b32',
  textSecondary: '#2d6b78',
  textMuted: '#689ca6',
  primary: '#08697A',
  primaryLight: '#139D9E',
  primaryGradient: ['#08697A', '#139D9E'],
  accentGradient: ['#2563eb', '#6366f1', '#22d3ee'],
  brandGradient: ['#08697A', '#139D9E', '#A6CE38'],
  secondary: '#A6CE38',
  error: '#e11d48',
  success: '#10b981',
  warning: '#d97706',
  info: '#0284c7',
  emerald: '#10b981',
  indigo: '#4f46e5',
  royalBlue: '#2563eb',
  cyan: '#06b6d4',
  aqua: '#8ED6D4',
  rose: '#e11d48',
  amber: '#d97706',
  tealTint: 'rgba(8, 105, 122, 0.1)',
  greenTint: 'rgba(166, 206, 56, 0.15)',
  yellowTint: 'rgba(217, 119, 6, 0.12)',
  redTint: 'rgba(225, 29, 72, 0.1)',
  blueTint: 'rgba(37, 99, 235, 0.1)',
  emeraldTint: 'rgba(16, 185, 129, 0.12)',
  indigoTint: 'rgba(79, 70, 229, 0.1)',
  roseTint: 'rgba(225, 29, 72, 0.1)',
  amberTint: 'rgba(217, 119, 6, 0.12)',
  cyanTint: 'rgba(6, 182, 212, 0.12)',
  inputBg: 'rgba(255, 255, 255, 0.9)',
  inputBgFocused: '#ffffff',
  sidebarOverlay: 'rgba(4, 30, 35, 0.72)',
  sidebarBg: '#ffffff',
  dateContainerBg: 'rgba(255, 255, 255, 0.85)',
  glow1: 'rgba(37, 99, 235, 0.1)',
  glow2: 'rgba(166, 206, 56, 0.1)',
  purple: '#4f46e5',
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

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('app_theme');
        if (savedTheme !== null) {
          setIsDarkMode(savedTheme === 'dark');
        }
      } catch (e) {
        console.error('Failed to load theme preference:', e);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    try {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      await AsyncStorage.setItem('app_theme', newMode ? 'dark' : 'light');
    } catch (e) {
      console.error('Failed to save theme preference:', e);
    }
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ isDarkMode, theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
