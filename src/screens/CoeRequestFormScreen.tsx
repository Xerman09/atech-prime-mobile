import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, TextInput, Alert, createElement
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useTheme, ThemeColors } from '../theme/ThemeContext';
import DateTimePicker from '@react-native-community/datetimepicker';

interface CoeRequestFormScreenProps {
  onBack: () => void;
  onSubmitSuccess: () => void;
  token?: string | null;
  employeeId?: number | null;
}

export default function CoeRequestFormScreen({ onBack, onSubmitSuccess, token, employeeId }: CoeRequestFormScreenProps) {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);
  const handleSubmit = async () => {
    if (!token) {
      setErrorMsg('You are not properly logged in. Please log out and log back in to get a valid token.');
      return;
    }
    if (!employeeId) {
      setErrorMsg('No employee profile linked to your account. You cannot submit leave requests.');
      return;
    }
    
    setIsSubmitting(true);
    setErrorMsg(null);
    
    try {
      const url = Platform.OS === 'web' 
        ? 'http://localhost/atech_prime/backend/public/api/coe-requests'
        : 'http://192.168.100.31/atech_prime/backend/public/api/coe-requests';
        
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          employee_id: employeeId,
          purpose: purpose
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401 || (errorData.error && errorData.error.includes('token'))) {
          throw new Error('Your session has expired. Please return to the dashboard, log out, and log back in.');
        }
        throw new Error(errorData.error || 'Failed to submit request');
      }
      
      setSubmitted(true);
    } catch (error: any) {
      setErrorMsg(error.message || 'An error occurred while submitting.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <LinearGradient colors={theme.backgroundGradient} style={styles.container}>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onSubmitSuccess}>
            <Feather name="arrow-left" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>COE Request</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.successContainer}>
          <View style={styles.successIconWrapper}>
            <Feather name="check" size={48} color={theme.success} />
          </View>
          <Text style={styles.successTitle}>Request Submitted</Text>
          <Text style={styles.successDesc}>Your COE request has been sent to HR for approval.</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={onSubmitSuccess}>
            <Text style={styles.primaryButtonText}>Return to History</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={theme.backgroundGradient} style={styles.container}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      
      {/* Decorative Background Elements */}
      <View style={styles.glow1} />
      <View style={styles.glow2} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Feather name="arrow-left" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New COE Request</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>PURPOSE</Text>
          <View style={[styles.inputContainer, styles.textAreaContainer]}>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="State the purpose of your COE request..."
              placeholderTextColor="#475569"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={purpose}
              onChangeText={setPurpose}
            />
          </View>
        </View>

        {errorMsg && (
          <View style={styles.errorContainer}>
            <Feather name="alert-circle" size={16} color={theme.error} style={{ marginRight: 8 }} />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        <TouchableOpacity 
          style={[
            styles.submitButton, 
            (!purpose || isSubmitting) && styles.submitButtonDisabled
          ]} 
          onPress={handleSubmit}
          disabled={!purpose || isSubmitting}
        >
          {isSubmitting ? (
            <Text style={styles.submitButtonText}>Submitting...</Text>
          ) : (
            <>
              <Feather name="send" size={18} color={theme.textPrimary} style={{ marginRight: 8 }} />
              <Text style={styles.submitButtonText}>Submit Request</Text>
            </>
          )}
        </TouchableOpacity>

      </ScrollView>
    </LinearGradient>
  );
}

const getStyles = (theme: ThemeColors, isDarkMode: boolean) => StyleSheet.create({
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
    backgroundColor: isDarkMode ? 'rgba(168, 85, 247, 0.1)' : 'rgba(147, 51, 234, 0.1)',
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    backgroundColor: theme.inputBg,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: theme.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: theme.cardBg,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 0,
    padding: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    color: theme.textMuted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 0,
    marginBottom: 8,
  },
  typeButtonActive: {
    borderColor: theme.purple,
    backgroundColor: isDarkMode ? 'rgba(168, 85, 247, 0.1)' : 'rgba(147, 51, 234, 0.1)',
  },
  typeButtonText: {
    color: theme.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: theme.purple,
    fontWeight: '700',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateInputWrapper: {
    width: '48%',
  },
  label: {
    color: theme.textSecondary,
    fontSize: 12,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.inputBg,
    borderRadius: 0,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: theme.textPrimary,
    fontSize: 14,
    height: '100%',
  },
  textAreaContainer: {
    height: 100,
    paddingVertical: 12,
    alignItems: 'flex-start',
  },
  textArea: {
    height: '100%',
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: theme.purple,
    paddingVertical: 16,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#475569',
    opacity: 0.5,
  },
  submitButtonText: {
    color: theme.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successIconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: theme.success,
  },
  successTitle: {
    color: theme.textPrimary,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  successDesc: {
    color: theme.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  primaryButton: {
    backgroundColor: theme.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 0,
  },
  primaryButtonText: {
    color: '#020617',
    fontSize: 14,
    fontWeight: '700',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: theme.error,
    padding: 12,
    marginBottom: 24,
  },
  errorText: {
    color: theme.textPrimary,
    fontSize: 13,
    flex: 1,
  },
});
