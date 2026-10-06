import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Animated, ScrollView
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
  const styles = getStyles(theme, isDarkMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [requiresOtp, setRequiresOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [userId, setUserId] = useState<number | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const getApiUrl = (endpoint: string) => {
    if (Platform.OS === 'web') {
      return `http://${window.location.hostname}/atech_prime/backend/public/api/${endpoint}`;
    }
    return `http://192.168.100.31/atech_prime/backend/public/api/${endpoint}`;
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const response = await fetch(getApiUrl('login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Login failed.');
      if (data['2fa_required']) {
        setUserId(data.user_id);
        setRequiresOtp(true);
        return;
      }
      onLoginSuccess(data.name || 'Employee', data.employee_id, data.token, rememberMe);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || !userId) { setError('Please enter the OTP.'); return; }
    setError(null);
    setIsLoading(true);
    try {
      const response = await fetch(getApiUrl('login/verify-2fa'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ user_id: userId, otp, remember_me: rememberMe }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Verification failed.');
      onLoginSuccess(data.name || 'Employee', data.employee_id, data.token, rememberMe);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />

      {/* Top accent bar */}
      <LinearGradient
        colors={theme.primaryGradient as any}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={styles.topBar}
      />

      {/* Background */}
      <LinearGradient colors={theme.backgroundGradient as any} style={StyleSheet.absoluteFillObject} />

      {/* Subtle teal circle accent */}
      <View style={styles.bgAccent1} />
      <View style={styles.bgAccent2} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.inner, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

            {/* Brand Header */}
            <View style={styles.brandRow}>
              <View style={styles.logoBox}>
                <LinearGradient colors={theme.primaryGradient as any} style={styles.logoGradient}>
                  <Feather name="shield" size={22} color="#fff" />
                </LinearGradient>
              </View>
              <View>
                <Text style={styles.brandName}>ATECH PRIME</Text>
                <Text style={styles.brandTagline}>HR & Workforce System</Text>
              </View>
            </View>

            <Text style={styles.title}>{requiresOtp ? 'Two-Factor Auth' : 'Sign In'}</Text>
            <Text style={styles.subtitle}>
              {requiresOtp ? 'Enter the 6-digit code sent to you.' : 'Welcome back. Sign in to continue.'}
            </Text>

            {/* Error Banner */}
            {error ? (
              <View style={styles.errorBanner}>
                <Feather name="alert-circle" size={15} color={theme.error} style={{ marginRight: 8 }} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {requiresOtp ? (
              <>
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>OTP CODE</Text>
                  <View style={styles.inputRow}>
                    <Feather name="shield" size={16} color={theme.primary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="6-digit code"
                      placeholderTextColor={theme.textMuted}
                      value={otp}
                      onChangeText={setOtp}
                      keyboardType="numeric"
                      maxLength={6}
                    />
                  </View>
                </View>

                <TouchableOpacity style={styles.primaryBtn} onPress={handleVerifyOtp} disabled={isLoading} activeOpacity={0.85}>
                  <LinearGradient colors={theme.primaryGradient as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryBtnGradient}>
                    {isLoading ? <ActivityIndicator color="#fff" size="small" /> : (
                      <View style={styles.btnRow}>
                        <Text style={styles.primaryBtnText}>VERIFY CODE</Text>
                        <Feather name="check" size={16} color="#fff" style={{ marginLeft: 8 }} />
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={styles.linkBtn} onPress={() => { setRequiresOtp(false); setError(null); }}>
                  <Text style={styles.linkBtnText}>? Back to Sign In</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* Email Field */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>EMAIL ADDRESS</Text>
                  <View style={[styles.inputRow, isEmailFocused && styles.inputRowFocused]}>
                    <Feather name="mail" size={16} color={isEmailFocused ? theme.primary : theme.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="name@company.com"
                      placeholderTextColor={theme.textMuted}
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

                {/* Password Field */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>PASSWORD</Text>
                  <View style={[styles.inputRow, isPasswordFocused && styles.inputRowFocused]}>
                    <Feather name="lock" size={16} color={isPasswordFocused ? theme.primary : theme.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your password"
                      placeholderTextColor={theme.textMuted}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      onFocus={() => setIsPasswordFocused(true)}
                      onBlur={() => setIsPasswordFocused(false)}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                      <Feather name={showPassword ? 'eye' : 'eye-off'} size={16} color={theme.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Remember Me + Forgot */}
                <View style={styles.optionsRow}>
                  <TouchableOpacity style={styles.checkRow} onPress={() => setRememberMe(!rememberMe)} activeOpacity={0.8}>
                    <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                      {rememberMe && <Feather name="check" size={12} color="#fff" />}
                    </View>
                    <Text style={styles.checkLabel}>Remember me</Text>
                  </TouchableOpacity>
                  <TouchableOpacity>
                    <Text style={styles.forgotText}>Forgot password?</Text>
                  </TouchableOpacity>
                </View>

                {/* Submit */}
                <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin} disabled={isLoading} activeOpacity={0.85}>
                  <LinearGradient colors={theme.primaryGradient as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryBtnGradient}>
                    {isLoading ? <ActivityIndicator color="#fff" size="small" /> : (
                      <View style={styles.btnRow}>
                        <Text style={styles.primaryBtnText}>SIGN IN</Text>
                        <Feather name="arrow-right" size={16} color="#fff" style={{ marginLeft: 8 }} />
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.divider}><View style={styles.dividerLine} /><Text style={styles.dividerText}>SECURED</Text><View style={styles.dividerLine} /></View>

                <View style={styles.secureRow}>
                  <Feather name="lock" size={12} color={theme.textMuted} />
                  <Text style={styles.secureText}>256-bit encrypted connection</Text>
                </View>
              </>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const getStyles = (theme: ThemeColors, isDarkMode: boolean) => StyleSheet.create({
  container: { flex: 1 },
  topBar: { height: 4, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  bgAccent1: {
    position: 'absolute', top: -80, right: -80, width: 240, height: 240,
    borderRadius: 120, backgroundColor: isDarkMode ? 'rgba(19,157,158,0.08)' : 'rgba(8,105,122,0.06)',
  },
  bgAccent2: {
    position: 'absolute', bottom: -60, left: -60, width: 200, height: 200,
    borderRadius: 100, backgroundColor: isDarkMode ? 'rgba(166,206,56,0.06)' : 'rgba(166,206,56,0.08)',
  },
  keyboardView: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  inner: { width: '100%', maxWidth: 440, alignSelf: 'center' },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 36 },
  logoBox: { marginRight: 14 },
  logoGradient: { width: 44, height: 44, borderRadius: 0, alignItems: 'center', justifyContent: 'center' },
  brandName: { fontSize: 14, fontWeight: '800', letterSpacing: 2.5, color: theme.primary, marginBottom: 2 },
  brandTagline: { fontSize: 11, color: theme.textMuted, letterSpacing: 0.5 },
  title: { fontSize: 28, fontWeight: '300', color: theme.textPrimary, marginBottom: 6 },
  subtitle: { fontSize: 14, color: theme.textMuted, marginBottom: 28 },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: isDarkMode ? 'rgba(239,68,68,0.1)' : 'rgba(220,38,38,0.07)',
    borderWidth: 1, borderColor: isDarkMode ? 'rgba(239,68,68,0.3)' : 'rgba(220,38,38,0.2)',
    paddingHorizontal: 14, paddingVertical: 10, marginBottom: 20, borderRadius: 0,
  },
  errorText: { flex: 1, color: theme.error, fontSize: 13 },
  fieldGroup: { marginBottom: 20 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, color: theme.textMuted, marginBottom: 8 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: theme.inputBg,
    borderWidth: 1, borderColor: theme.border, borderRadius: 0,
  },
  inputRowFocused: { borderColor: theme.primary, backgroundColor: theme.inputBgFocused },
  inputIcon: { paddingLeft: 14, paddingRight: 2 },
  input: { flex: 1, color: theme.textPrimary, fontSize: 15, paddingHorizontal: 10, paddingVertical: 14 },
  eyeBtn: { padding: 14 },
  optionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  checkRow: { flexDirection: 'row', alignItems: 'center' },
  checkbox: {
    width: 18, height: 18, borderWidth: 1.5, borderColor: theme.textMuted, borderRadius: 0,
    alignItems: 'center', justifyContent: 'center', marginRight: 8,
  },
  checkboxChecked: { backgroundColor: theme.primary, borderColor: theme.primary },
  checkLabel: { color: theme.textSecondary, fontSize: 13 },
  forgotText: { color: theme.primary, fontSize: 13, fontWeight: '600' },
  primaryBtn: { marginBottom: 24, shadowColor: theme.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  primaryBtnGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center', borderRadius: 0 },
  btnRow: { flexDirection: 'row', alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 1.5 },
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: theme.border },
  dividerText: { fontSize: 10, color: theme.textMuted, letterSpacing: 2, marginHorizontal: 12 },
  secureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  secureText: { color: theme.textMuted, fontSize: 12, marginLeft: 6 },
  linkBtn: { alignItems: 'center', paddingVertical: 12 },
  linkBtnText: { color: theme.primary, fontSize: 14, fontWeight: '600' },
});
