import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  KeyboardAvoidingView, Platform, ActivityIndicator, Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useTheme, ThemeColors } from '../theme/ThemeContext';

interface LoginScreenProps {
  onLoginSuccess: (name: string, employeeId?: number, token?: string, rememberMe?: boolean) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      alert('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      // Use localhost for Web, and the local computer IP for physical phones/emulators
      const apiUrl = Platform.OS === 'web' 
        ? 'http://localhost/atech_prime/backend/public/api/login'
        : 'http://192.168.100.31/atech_prime/backend/public/api/login';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed.');
      }

      onLoginSuccess(data.name || 'Employee', data.employee_id, data.token, rememberMe);
      
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={theme.backgroundGradient}
      style={styles.container}
    >
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      
      {/* Decorative Background Elements */}
      <View style={styles.glow1} />
      <View style={styles.glow2} />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <Animated.View 
          style={[
            styles.formContainer, 
            { 
              opacity: fadeAnim, 
              transform: [{ translateY: slideAnim }] 
            }
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.companyName}>ATECH PRIME</Text>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Securely sign in to your HR workspace</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>EMAIL ADDRESS</Text>
            <View style={[styles.inputWrapper, isEmailFocused && styles.inputWrapperFocused]}>
              <Feather name="mail" size={18} color={isEmailFocused ? theme.primary : theme.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="name@company.com"
                placeholderTextColor="#475569"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => setIsEmailFocused(false)}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>PASSWORD</Text>
            <View style={[styles.inputWrapper, isPasswordFocused && styles.inputWrapperFocused]}>
              <Feather name="lock" size={18} color={isPasswordFocused ? theme.primary : theme.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#475569"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Feather name={showPassword ? "eye" : "eye-off"} size={18} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.loginOptions}>
            <TouchableOpacity 
              style={styles.checkboxContainer} 
              onPress={() => setRememberMe(!rememberMe)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe && <Feather name="check" size={14} color={theme.cardBgSolid} />}
              </View>
              <Text style={styles.checkboxText}>Remember Me</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Recover Password</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.loginButton} 
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={theme.primaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientButton}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.loginButtonText}>AUTHENTICATE</Text>
                  <Feather name="arrow-right" size={18} color="#ffffff" style={styles.buttonIcon} />
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const getStyles = (theme: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  glow1: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 300,
    height: 300,
    backgroundColor: theme.glow1,
    borderRadius: 150,
    transform: [{ scale: 2 }],
  },
  glow2: {
    position: 'absolute',
    bottom: -100,
    right: -100,
    width: 300,
    height: 300,
    backgroundColor: theme.glow2,
    borderRadius: 150,
    transform: [{ scale: 2 }],
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  formContainer: {
    backgroundColor: theme.cardBg,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 32,
    borderRadius: 0, // Sharp corners rule
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  header: {
    marginBottom: 40,
  },
  companyName: {
    color: theme.primary,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 12,
  },
  title: {
    color: theme.textPrimary,
    fontSize: 32,
    fontWeight: '300',
    marginBottom: 8,
  },
  subtitle: {
    color: theme.textMuted,
    fontSize: 15,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    color: theme.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.inputBg,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 0, // Sharp corners rule
  },
  inputWrapperFocused: {
    borderColor: theme.primary,
    backgroundColor: theme.inputBgFocused,
  },
  inputIcon: {
    paddingLeft: 16,
  },
  eyeIcon: {
    padding: 16,
  },
  input: {
    flex: 1,
    color: theme.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 16,
    fontSize: 16,
  },
  loginOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: theme.textMuted,
    borderRadius: 0, // Sharp corners rule
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  checkboxText: {
    color: theme.textSecondary,
    fontSize: 14,
  },
  forgotPassword: {
  },
  forgotPasswordText: {
    color: theme.primary,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  loginButton: {
    width: '100%',
    shadowColor: theme.primary,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  gradientButton: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 0, // Sharp corners rule
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  buttonIcon: {
    marginLeft: 8,
  },
});
