import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Platform, ActivityIndicator, Animated, ScrollView,
  KeyboardAvoidingView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme, ThemeColors } from '../theme/ThemeContext';

interface LoginScreenProps {
  onLoginSuccess: (token: string, user: any) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [tempUserId, setTempUserId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      let apiUrl = `http://192.168.100.31/atech_prime/backend/public/api/login`;
      if (Platform.OS === 'web') {
        apiUrl = `http://${window.location.hostname}/atech_prime/backend/public/api/login`;
      }

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed. Please check your credentials.');

      if (data['2fa_required']) {
        setRequiresOtp(true);
        setTempUserId(data.user_id);
        return;
      }

      await AsyncStorage.setItem('auth_token', data.token);
      await AsyncStorage.setItem('user_data', JSON.stringify(data.user));
      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim() || !tempUserId) {
      setError('Please enter the OTP code.');
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      let apiUrl = `http://192.168.100.31/atech_prime/backend/public/api/login/verify-otp`;
      if (Platform.OS === 'web') {
        apiUrl = `http://${window.location.hostname}/atech_prime/backend/public/api/login/verify-otp`;
      }

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ user_id: tempUserId, otp: otp.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid OTP code.');

      await AsyncStorage.setItem('auth_token', data.token);
      await AsyncStorage.setItem('user_data', JSON.stringify(data.user));
      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />

      {/* Background Gradient */}
      <LinearGradient colors={theme.backgroundGradient as any} style={StyleSheet.absoluteFillObject} />

      {/* Decorative Glows matching Frontend (Indigo & Lime) */}
      <View style={styles.bgAccent1} />
      <View style={styles.bgAccent2} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.inner, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

            {/* Login Card Wrapper with Frontend Top Gradient Strip */}
            <View style={styles.cardWrapper}>
              {/* Signature Frontend Strip: Blue-600 via Indigo-500 to Cyan-400 */}
              <LinearGradient
                colors={theme.accentGradient as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.signatureStrip}
              />

              {/* Brand Header */}
              <View style={styles.brandRow}>
                <View style={styles.logoBox}>
                  <LinearGradient colors={theme.primaryGradient as any} style={styles.logoGradient}>
                    <Feather name="shield" size={24} color="#fff" />
                  </LinearGradient>
                </View>
                <View>
                  <Text style={styles.brandName}>ATECH PRIME</Text>
                  <Text style={styles.brandTagline}>HR & Workforce Management System</Text>
                </View>
              </View>

              {/* Console Portal Pill Badge matching Frontend */}
              <View style={styles.portalBadge}>
                <Feather name="shield" size={13} color={theme.royalBlue} style={{ marginRight: 6 }} />
                <Text style={styles.portalBadgeText}>Console Portal</Text>
                <View style={styles.portalBadgeDot} />
                <Text style={styles.portalBadgeSub}>Secure Access</Text>
              </View>

              <Text style={styles.title}>{requiresOtp ? 'Two-Factor Authentication' : 'Welcome Back'}</Text>
              <Text style={styles.subtitle}>
                {requiresOtp ? 'Enter your 6-digit authorization code to proceed.' : 'Enter your credentials to access your workforce dashboard.'}
              </Text>

              {/* Error Banner */}
              {error ? (
                <View style={styles.errorBanner}>
                  <Feather name="alert-circle" size={16} color={theme.rose} style={{ marginRight: 8, marginTop: 1 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.errorTitle}>Authentication Error</Text>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                </View>
              ) : null}

              {requiresOtp ? (
                <>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>AUTHORIZATION CODE</Text>
                    <View style={styles.inputRow}>
                      <Feather name="key" size={16} color={theme.primary} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, { letterSpacing: 4, fontWeight: '700' }]}
                        placeholder="123456"
                        placeholderTextColor={theme.textMuted}
                        value={otp}
                        onChangeText={setOtp}
                        keyboardType="numeric"
                        maxLength={6}
                      />
                    </View>
                  </View>

                  <TouchableOpacity style={styles.primaryBtn} onPress={handleVerifyOtp} disabled={isLoading} activeOpacity={0.85}>
                    <LinearGradient colors={['#2563eb', '#4f46e5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryBtnGradient}>
                      {isLoading ? <ActivityIndicator color="#fff" size="small" /> : (
                        <View style={styles.btnRow}>
                          <Text style={styles.primaryBtnText}>VERIFY & PROCEED</Text>
                          <Feather name="check-circle" size={16} color="#fff" style={{ marginLeft: 8 }} />
                        </View>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.linkBtn} onPress={() => { setRequiresOtp(false); setError(null); }}>
                    <Text style={styles.linkBtnText}>← Return to credentials</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {/* Email Field */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>WORK EMAIL ADDRESS</Text>
                    <View style={[styles.inputRow, isEmailFocused && styles.inputRowFocused]}>
                      <Feather name="mail" size={16} color={isEmailFocused ? theme.royalBlue : theme.textMuted} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="employee@company.com"
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
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <Text style={styles.label}>PASSWORD</Text>
                      <TouchableOpacity>
                        <Text style={styles.forgotText}>Forgot password?</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={[styles.inputRow, isPasswordFocused && styles.inputRowFocused]}>
                      <Feather name="lock" size={16} color={isPasswordFocused ? theme.royalBlue : theme.textMuted} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="••••••••••••"
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

                  {/* Remember Me */}
                  <View style={styles.optionsRow}>
                    <TouchableOpacity style={styles.checkRow} onPress={() => setRememberMe(!rememberMe)} activeOpacity={0.8}>
                      <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                        {rememberMe && <Feather name="check" size={12} color="#fff" />}
                      </View>
                      <Text style={styles.checkLabel}>Remember this workstation</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Submit with High Energy Gradient Button */}
                  <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin} disabled={isLoading} activeOpacity={0.85}>
                    <LinearGradient colors={['#2563eb', '#08697A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryBtnGradient}>
                      {isLoading ? <ActivityIndicator color="#fff" size="small" /> : (
                        <View style={styles.btnRow}>
                          <Text style={styles.primaryBtnText}>SIGN IN TO CONSOLE</Text>
                          <Feather name="arrow-right" size={16} color="#fff" style={{ marginLeft: 8 }} />
                        </View>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <View style={styles.securedTag}>
                      <Feather name="shield" size={11} color={theme.emerald} style={{ marginRight: 4 }} />
                      <Text style={styles.dividerText}>ENTERPRISE GRADE SECURITY</Text>
                    </View>
                    <View style={styles.dividerLine} />
                  </View>

                  <View style={styles.secureRow}>
                    <Feather name="lock" size={12} color={theme.textMuted} />
                    <Text style={styles.secureText}>256-bit TLS encrypted connection</Text>
                  </View>
                </>
              )}
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const getStyles = (theme: ThemeColors, isDarkMode: boolean) => StyleSheet.create({
  container: { flex: 1 },
  bgAccent1: {
    position: 'absolute', top: -100, right: -100, width: 300, height: 300,
    backgroundColor: theme.glow1, opacity: 0.15,
  },
  bgAccent2: {
    position: 'absolute', bottom: -80, left: -80, width: 260, height: 260,
    backgroundColor: theme.glow2, opacity: 0.12,
  },
  keyboardView: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 36 },
  inner: { width: '100%', maxWidth: 460, alignSelf: 'center' },
  cardWrapper: {
    backgroundColor: theme.cardBg,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 28,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: isDarkMode ? 0.3 : 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 16,
    elevation: 4,
  },
  signatureStrip: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 4,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  logoBox: { marginRight: 14 },
  logoGradient: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  brandName: { fontSize: 16, fontWeight: '900', letterSpacing: 2, color: theme.primary },
  brandTagline: { fontSize: 11, color: theme.textMuted, letterSpacing: 0.5 },
  portalBadge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    backgroundColor: theme.blueTint, borderWidth: 1, borderColor: 'rgba(37, 99, 235, 0.25)',
    paddingHorizontal: 10, paddingVertical: 4, marginBottom: 16,
  },
  portalBadgeText: { fontSize: 11, fontWeight: '700', color: theme.royalBlue },
  portalBadgeDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: theme.textMuted, marginHorizontal: 6 },
  portalBadgeSub: { fontSize: 11, color: theme.textMuted },
  title: { fontSize: 24, fontWeight: '700', color: theme.textPrimary, marginBottom: 6 },
  subtitle: { fontSize: 13, color: theme.textMuted, marginBottom: 24, lineHeight: 18 },
  errorBanner: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: theme.roseTint,
    borderLeftWidth: 4, borderLeftColor: theme.rose, borderWidth: 1, borderColor: 'rgba(244, 63, 94, 0.3)',
    padding: 12, marginBottom: 20,
  },
  errorTitle: { color: theme.rose, fontSize: 11, fontWeight: '800', letterSpacing: 0.5, marginBottom: 2 },
  errorText: { color: theme.textPrimary, fontSize: 12, lineHeight: 16 },
  fieldGroup: { marginBottom: 18 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 1, color: theme.textSecondary, marginBottom: 6 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: theme.border,
    backgroundColor: theme.inputBg, paddingHorizontal: 12, height: 46,
  },
  inputRowFocused: { borderColor: theme.royalBlue },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: theme.textPrimary, fontSize: 14, height: '100%' },
  eyeBtn: { padding: 8 },
  optionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  checkRow: { flexDirection: 'row', alignItems: 'center' },
  checkbox: {
    width: 18, height: 18, borderWidth: 1, borderColor: theme.border,
    backgroundColor: theme.inputBg, alignItems: 'center', justifyContent: 'center', marginRight: 8,
  },
  checkboxChecked: { backgroundColor: theme.royalBlue, borderColor: theme.royalBlue },
  checkLabel: { fontSize: 12, color: theme.textSecondary },
  forgotText: { fontSize: 12, color: theme.royalBlue, fontWeight: '600' },
  primaryBtn: { marginBottom: 20 },
  primaryBtnGradient: {
    paddingVertical: 14, alignItems: 'center', justifyContent: 'center',
  },
  btnRow: { flexDirection: 'row', alignItems: 'center' },
  primaryBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 13, letterSpacing: 1 },
  linkBtn: { paddingVertical: 12, alignItems: 'center' },
  linkBtnText: { color: theme.primary, fontSize: 13, fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: theme.border },
  securedTag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 },
  dividerText: { fontSize: 10, fontWeight: '700', letterSpacing: 1, color: theme.textMuted },
  secureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  secureText: { fontSize: 11, color: theme.textMuted, marginLeft: 6 },
});
