import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  KeyboardAvoidingView, Platform, ActivityIndicator, Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
        : 'http://192.168.0.49/atech_prime/backend/public/api/login';

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

      alert('Welcome back, ' + data.name + '!');
      // In the future, we will save data.token to AsyncStorage and navigate here
      
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#020617', '#0f172a', '#020617']}
      style={styles.container}
    >
      <StatusBar style="light" />
      
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
              <Feather name="mail" size={18} color={isEmailFocused ? '#38bdf8' : '#64748b'} style={styles.inputIcon} />
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
              <Feather name="lock" size={18} color={isPasswordFocused ? '#38bdf8' : '#64748b'} style={styles.inputIcon} />
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
                <Feather name={showPassword ? "eye" : "eye-off"} size={18} color="#64748b" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Recover Password</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.loginButton} 
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#0284c7', '#2563eb']}
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

const styles = StyleSheet.create({
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
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderRadius: 150,
    transform: [{ scale: 2 }],
  },
  glow2: {
    position: 'absolute',
    bottom: -100,
    right: -100,
    width: 300,
    height: 300,
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    borderRadius: 150,
    transform: [{ scale: 2 }],
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  formContainer: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
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
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 12,
  },
  title: {
    color: '#f8fafc',
    fontSize: 32,
    fontWeight: '300',
    marginBottom: 8,
  },
  subtitle: {
    color: '#64748b',
    fontSize: 15,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(2, 6, 23, 0.5)',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 0, // Sharp corners rule
  },
  inputWrapperFocused: {
    borderColor: '#38bdf8',
    backgroundColor: 'rgba(2, 6, 23, 0.8)',
  },
  inputIcon: {
    paddingLeft: 16,
  },
  eyeIcon: {
    padding: 16,
  },
  input: {
    flex: 1,
    color: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 16,
    fontSize: 16,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 32,
  },
  forgotPasswordText: {
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  loginButton: {
    width: '100%',
    shadowColor: '#2563eb',
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
