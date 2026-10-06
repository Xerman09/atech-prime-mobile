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
  // Core Green-to-Blue Brand Palette
  primary: string;         // Deep Teal/Blue (#08697A)
  primaryLight: string;    // Bright Teal (#139D9E)
  secondary: string;       // Fresh Lime Green (#A6CE38)
  emerald: string;         // Vibrant Green (#10b981)
  royalBlue: string;       // Deep Blue (#08697A)
  cyan: string;            // Light Aqua/Teal (#139D9E)
  aqua: string;            // Soft Aqua (#8ED6D4)
  // Gradients (Green to Blue)
  primaryGradient: readonly [string, string];          // Green -> Deep Blue
  accentGradient: readonly [string, string, string];   // Green -> Teal -> Deep Blue
  brandGradient: readonly [string, string, string];    // Lime -> Teal -> Deep Blue
  greenToBlueGradient: readonly [string, string, string];
  // Tints (Unified Green & Blue/Teal)
  tealTint: string;
  greenTint: string;
  blueTint: string;
  emeraldTint: string;
  cyanTint: string;
  indigoTint: string;
  roseTint: string;
  amberTint: string;
  yellowTint: string;
  redTint: string;
  // Functional alerts
  error: string;
  success: string;
  warning: string;
  info: string;
  rose: string;
  amber: string;
  indigo: string;
  // Shell
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
  backgroundGradient: ['#070e18', '#0c1626', '#070e18'],
  cardBg: '#0f1b2c',
  cardBgSolid: '#0f1b2c',
  border: 'rgba(255, 255, 255, 0.08)',
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  primary: '#139D9E',
  primaryLight: '#139D9E',
  secondary: '#10b981',
  emerald: '#10b981',
  royalBlue: '#139D9E',
  cyan: '#139D9E',
  aqua: '#8ED6D4',
  primaryGradient: ['#10b981', '#08697A'],
  accentGradient: ['#10b981', '#139D9E', '#08697A'],
  brandGradient: ['#10b981', '#139D9E', '#08697A'],
  greenToBlueGradient: ['#10b981', '#139D9E', '#08697A'],
  tealTint: 'rgba(19, 157, 158, 0.12)',
  greenTint: 'rgba(16, 185, 129, 0.12)',
  blueTint: 'rgba(8, 105, 122, 0.15)',
  emeraldTint: 'rgba(16, 185, 129, 0.12)',
  cyanTint: 'rgba(19, 157, 158, 0.12)',
  indigoTint: 'rgba(8, 105, 122, 0.12)',
  roseTint: 'rgba(239, 68, 68, 0.1)',
  amberTint: 'rgba(245, 158, 11, 0.1)',
  yellowTint: 'rgba(245, 158, 11, 0.1)',
  redTint: 'rgba(239, 68, 68, 0.1)',
  error: '#ef4444',
  success: '#10b981',
  warning: '#f59e0b',
  info: '#139D9E',
  rose: '#ef4444',
  amber: '#f59e0b',
  indigo: '#139D9E',
  inputBg: '#070e18',
  inputBgFocused: '#0c1626',
  sidebarOverlay: 'rgba(2, 6, 14, 0.85)',
  sidebarBg: '#0a1220',
  dateContainerBg: '#0f1b2c',
  glow1: 'rgba(16, 185, 129, 0.05)',
  glow2: 'rgba(8, 105, 122, 0.05)',
  purple: '#08697A',
  surface: '#0f1b2c',
  background: '#070e18',
};

export const lightTheme: ThemeColors = {
  backgroundGradient: ['#f8fafc', '#f1f5f9', '#f8fafc'],
  cardBg: '#ffffff',
  cardBgSolid: '#ffffff',
  border: '#e2e8f0',
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  primary: '#08697A',
  primaryLight: '#139D9E',
  secondary: '#10b981',
  emerald: '#10b981',
  royalBlue: '#08697A',
  cyan: '#139D9E',
  aqua: '#8ED6D4',
  primaryGradient: ['#10b981', '#08697A'],
  accentGradient: ['#10b981', '#139D9E', '#08697A'],
  brandGradient: ['#10b981', '#139D9E', '#08697A'],
  greenToBlueGradient: ['#10b981', '#139D9E', '#08697A'],
  tealTint: 'rgba(19, 157, 158, 0.08)',
  greenTint: 'rgba(16, 185, 129, 0.08)',
  blueTint: 'rgba(8, 105, 122, 0.08)',
  emeraldTint: 'rgba(16, 185, 129, 0.08)',
  cyanTint: 'rgba(19, 157, 158, 0.08)',
  indigoTint: 'rgba(8, 105, 122, 0.08)',
  roseTint: 'rgba(239, 68, 68, 0.06)',
  amberTint: 'rgba(245, 158, 11, 0.06)',
  yellowTint: 'rgba(245, 158, 11, 0.06)',
  redTint: 'rgba(239, 68, 68, 0.06)',
  error: '#dc2626',
  success: '#10b981',
  warning: '#d97706',
  info: '#08697A',
  rose: '#dc2626',
  amber: '#d97706',
  indigo: '#08697A',
  inputBg: '#ffffff',
  inputBgFocused: '#ffffff',
  sidebarOverlay: 'rgba(15, 23, 42, 0.6)',
  sidebarBg: '#ffffff',
  dateContainerBg: '#ffffff',
  glow1: 'rgba(16, 185, 129, 0.03)',
  glow2: 'rgba(8, 105, 122, 0.03)',
  purple: '#08697A',
  surface: '#ffffff',
  background: '#f8fafc',
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
