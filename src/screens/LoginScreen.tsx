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

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
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
      if (!res.ok) throw new Error(data.error || 'Authentication failed. Please verify credentials.');

      if (data['2fa_required']) {
        setRequiresOtp(true);
        setTempUserId(data.user_id);
        return;
      }

      const userPayload = {
        id: data.user_id,
        name: data.name || data.email || 'Workstation User',
        email: data.email,
        role: data.role,
        employee_id: data.employee_id || null,
        company_name: data.company?.name || 'ATECH PRIME',
        company_plan: data.company?.plan || 'ENTERPRISE',
      };

      await AsyncStorage.setItem('auth_token', data.token);
      await AsyncStorage.setItem('user_data', JSON.stringify(userPayload));
      onLoginSuccess(data.token, userPayload);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim() || !tempUserId) {
      setError('Please enter the verification code.');
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
      if (!res.ok) throw new Error(data.error || 'Invalid code.');

      const userPayload = {
        id: data.user_id,
        name: data.name || data.email || 'Workstation User',
        email: data.email,
        role: data.role,
        employee_id: data.employee_id || null,
        company_name: data.company?.name || 'ATECH PRIME',
        company_plan: data.company?.plan || 'ENTERPRISE',
      };

      await AsyncStorage.setItem('auth_token', data.token);
      await AsyncStorage.setItem('user_data', JSON.stringify(userPayload));
      onLoginSuccess(data.token, userPayload);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <LinearGradient colors={theme.backgroundGradient as any} style={StyleSheet.absoluteFillObject} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.inner, { opacity: fadeAnim }]}>

            {/* Clean, Simple Card with Green-to-Blue Strip */}
            <View style={styles.cardWrapper}>
              {/* Green to Blue signature strip */}
              <LinearGradient
                colors={['#10b981', '#139D9E', '#08697A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.signatureStrip}
              />

              {/* Brand Header */}
              <View style={styles.brandRow}>
                <LinearGradient colors={['#10b981', '#08697A']} style={styles.logoBox}>
                  <Feather name="shield" size={22} color="#ffffff" />
                </LinearGradient>
                <View>
                  <Text style={styles.brandName}>ATECH PRIME</Text>
                  <Text style={styles.brandTagline}>Human Resource & Workforce System</Text>
                </View>
              </View>

              <Text style={styles.title}>{requiresOtp ? 'Authentication Code' : 'Sign In'}</Text>
              <Text style={styles.subtitle}>
                {requiresOtp ? 'Enter your 6-digit one-time code to continue.' : 'Enter your email and password to access your workstation.'}
              </Text>

              {/* Error Message */}
              {error ? (
                <View style={styles.errorBox}>
                  <Feather name="alert-circle" size={15} color={theme.error} style={{ marginRight: 8, marginTop: 1 }} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {requiresOtp ? (
                <>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>6-DIGIT CODE</Text>
                    <View style={styles.inputRow}>
                      <Feather name="key" size={16} color={theme.primaryLight} style={styles.inputIcon} />
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

                  <TouchableOpacity style={styles.primaryBtn} onPress={handleVerifyOtp} disabled={isLoading} activeOpacity={0.88}>
                    <LinearGradient
                      colors={['#10b981', '#08697A']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.primaryBtnGradient}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#ffffff" size="small" />
                      ) : (
                        <View style={styles.btnRow}>
                          <Text style={styles.primaryBtnText}>VERIFY & CONTINUE</Text>
                          <Feather name="check" size={16} color="#ffffff" style={{ marginLeft: 8 }} />
                        </View>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.linkBtn} onPress={() => { setRequiresOtp(false); setError(null); }}>
                    <Text style={styles.linkBtnText}>← Back to login</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {/* Email */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>EMAIL ADDRESS</Text>
                    <View style={[styles.inputRow, isEmailFocused && styles.inputRowFocused]}>
                      <Feather name="mail" size={15} color={isEmailFocused ? theme.primaryLight : theme.textMuted} style={styles.inputIcon} />
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

                  {/* Password */}
                  <View style={styles.fieldGroup}>
                    <View style={styles.labelRow}>
                      <Text style={styles.label}>PASSWORD</Text>
                      <TouchableOpacity>
                        <Text style={styles.forgotText}>Forgot?</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={[styles.inputRow, isPasswordFocused && styles.inputRowFocused]}>
                      <Feather name="lock" size={15} color={isPasswordFocused ? theme.primaryLight : theme.textMuted} style={styles.inputIcon} />
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
                        <Feather name={showPassword ? 'eye' : 'eye-off'} size={15} color={theme.textMuted} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Remember Me */}
                  <View style={styles.optionsRow}>
                    <TouchableOpacity style={styles.checkRow} onPress={() => setRememberMe(!rememberMe)} activeOpacity={0.8}>
                      <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                        {rememberMe && <Feather name="check" size={12} color="#ffffff" />}
                      </View>
                      <Text style={styles.checkLabel}>Remember me</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Green-to-Blue Primary Button */}
                  <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin} disabled={isLoading} activeOpacity={0.88}>
                    <LinearGradient
                      colors={['#10b981', '#08697A']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.primaryBtnGradient}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#ffffff" size="small" />
                      ) : (
                        <View style={styles.btnRow}>
                          <Text style={styles.primaryBtnText}>SIGN IN</Text>
                          <Feather name="arrow-right" size={16} color="#ffffff" style={{ marginLeft: 8 }} />
                        </View>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  <View style={styles.footerNote}>
                    <Feather name="lock" size={12} color={theme.textMuted} style={{ marginRight: 6 }} />
                    <Text style={styles.footerNoteText}>Secure Encrypted Workstation</Text>
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
  keyboardView: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 40 },
  inner: { width: '100%', maxWidth: 420, alignSelf: 'center' },
  cardWrapper: {
    backgroundColor: theme.cardBg,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 26,
    position: 'relative',
    overflow: 'hidden',
  },
  signatureStrip: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 3.5,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 },
  logoBox: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  brandName: { fontSize: 15, fontWeight: '800', letterSpacing: 1.5, color: theme.primary },
  brandTagline: { fontSize: 11, color: theme.textMuted },
  title: { fontSize: 22, fontWeight: '700', color: theme.textPrimary, marginBottom: 4 },
  subtitle: { fontSize: 13, color: theme.textMuted, marginBottom: 22, lineHeight: 18 },
  errorBox: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: theme.roseTint, borderWidth: 1, borderColor: theme.error + '40',
    padding: 12, marginBottom: 16,
  },
  errorText: { color: theme.error, fontSize: 12, flex: 1, lineHeight: 16 },
  fieldGroup: { marginBottom: 16 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, color: theme.textSecondary, marginBottom: 6 },
  forgotText: { fontSize: 11, color: theme.primaryLight, fontWeight: '600' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: theme.border,
    backgroundColor: theme.inputBg, paddingHorizontal: 12, height: 44,
  },
  inputRowFocused: { borderColor: theme.primaryLight },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: theme.textPrimary, fontSize: 14, height: '100%' },
  eyeBtn: { padding: 6 },
  optionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
  checkRow: { flexDirection: 'row', alignItems: 'center' },
  checkbox: {
    width: 17, height: 17, borderWidth: 1, borderColor: theme.border,
    backgroundColor: theme.inputBg, alignItems: 'center', justifyContent: 'center', marginRight: 8,
  },
  checkboxChecked: { backgroundColor: theme.primary, borderColor: theme.primary },
  checkLabel: { fontSize: 12, color: theme.textSecondary },
  primaryBtn: { marginBottom: 18, overflow: 'hidden' },
  primaryBtnGradient: {
    paddingVertical: 13, alignItems: 'center', justifyContent: 'center',
  },
  btnRow: { flexDirection: 'row', alignItems: 'center' },
  primaryBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 13, letterSpacing: 1 },
  linkBtn: { paddingVertical: 10, alignItems: 'center' },
  linkBtnText: { color: theme.primaryLight, fontSize: 12, fontWeight: '600' },
  footerNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  footerNoteText: { fontSize: 11, color: theme.textMuted },
});
