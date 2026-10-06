import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, TextInput, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useTheme, ThemeColors } from '../theme/ThemeContext';

interface CoeRequestFormScreenProps {
  onBack: () => void;
  onSubmitSuccess: () => void;
  token?: string | null;
  employeeId?: number | null;
}

const COMMON_PURPOSES = [
  { id: 'Bank Loan Application', label: 'Loan Application', icon: 'credit-card' as const },
  { id: 'Visa Application', label: 'Visa Application', icon: 'globe' as const },
  { id: 'Bank Account Opening', label: 'Bank Account', icon: 'briefcase' as const },
  { id: 'Rental / Lease Agreement', label: 'Housing / Rental', icon: 'home' as const },
  { id: 'Employment Verification', label: 'Verification', icon: 'file-text' as const },
  { id: 'Other Purpose', label: 'Other Purpose', icon: 'edit-3' as const },
];

export default function CoeRequestFormScreen({ onBack, onSubmitSuccess, token, employeeId }: CoeRequestFormScreenProps) {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);
  
  const [selectedPreset, setSelectedPreset] = useState<string>('Bank Loan Application');
  const [purpose, setPurpose] = useState('');
  const [withCompensation, setWithCompensation] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!token) {
      setErrorMsg('You are not properly logged in. Please log out and log back in to get a valid token.');
      return;
    }
    if (!employeeId) {
      setErrorMsg('No employee profile linked to your account. You cannot submit COE requests.');
      return;
    }
    
    const finalPurpose = purpose.trim() 
      ? `[${selectedPreset}] ${purpose.trim()} (With Compensation: ${withCompensation ? 'Yes' : 'No'})`
      : `[${selectedPreset}] (With Compensation: ${withCompensation ? 'Yes' : 'No'})`;

    if (!finalPurpose) {
      setErrorMsg('Please specify the purpose for your Certificate of Employment.');
      return;
    }
    
    setIsSubmitting(true);
    setErrorMsg(null);
    
    try {
      const url = Platform.OS === 'web' 
        ? `http://${window.location.hostname}/atech_prime/backend/public/api/coe-requests`
        : 'http://192.168.100.11/atech_prime/backend/public/api/coe-requests';
        
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          employee_id: employeeId,
          purpose: finalPurpose
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

  const isFormComplete = Boolean(selectedPreset || purpose.trim());

  if (submitted) {
    return (
      <View style={styles.container}>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        <LinearGradient colors={theme.backgroundGradient as any} style={StyleSheet.absoluteFillObject} />

        {/* Signature Top Gradient Strip */}
        <LinearGradient
          colors={theme.accentGradient as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.topGradientStrip}
        />

        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onSubmitSuccess} activeOpacity={0.7}>
            <Feather name="arrow-left" size={18} color={theme.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitleBlock}>
            <Text style={styles.headerSubtitle}>OFFICIAL CREDENTIALS</Text>
            <Text style={styles.headerTitle}>Certificate of Employment</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.successContainer}>
          <View style={styles.successCard}>
            <LinearGradient
              colors={['#10b981', '#139D9E', '#08697A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.cardAccentBar}
            />
            <View style={styles.successIconWrapper}>
              <Feather name="check" size={36} color={theme.emerald} />
            </View>
            <Text style={styles.successTitle}>COE Request Submitted</Text>
            <Text style={styles.successDesc}>
              Your request for a Certificate of Employment ({selectedPreset}) has been recorded and submitted to HR for processing.
            </Text>

            <TouchableOpacity style={styles.submitButtonSuccess} onPress={onSubmitSuccess} activeOpacity={0.85}>
              <LinearGradient
                colors={['#10b981', '#139D9E', '#08697A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitGradient}
              >
                <Feather name="list" size={16} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.submitButtonText}>View Request History</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <LinearGradient colors={theme.backgroundGradient as any} style={StyleSheet.absoluteFillObject} />
      
      {/* Signature Top Gradient Strip */}
      <LinearGradient
        colors={theme.accentGradient as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.topGradientStrip}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <Feather name="arrow-left" size={18} color={theme.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleBlock}>
          <Text style={styles.headerSubtitle}>HR CREDENTIALS PORTAL</Text>
          <Text style={styles.headerTitle}>New COE Request</Text>
        </View>
        <View style={styles.headerBadge}>
          <View style={styles.headerBadgeDot} />
          <Text style={styles.headerBadgeText}>NEW DRAFT</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formWrapper}>

          {/* Quick Notice Banner */}
          <View style={styles.noticeBanner}>
            <View style={styles.noticeIconWrap}>
              <Feather name="info" size={14} color={theme.primaryLight} />
            </View>
            <Text style={styles.noticeText}>
              Certificates of Employment (COE) are typically verified and issued by HR within 1-2 business days. Specify if you require salary disclosure.
            </Text>
          </View>

          {/* Main Card */}
          <View style={styles.card}>
            {/* Top accent line on card */}
            <LinearGradient
              colors={['#10b981', '#139D9E', '#08697A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.cardAccentBar}
            />

            {/* Section 1: Purpose Category */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionTitle}>SELECT REQUEST PURPOSE</Text>
              <Text style={styles.requiredIndicator}>*Required</Text>
            </View>

            <View style={styles.presetGrid}>
              {COMMON_PURPOSES.map((item) => {
                const isActive = selectedPreset === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.presetCard,
                      isActive && styles.presetCardActive
                    ]}
                    onPress={() => setSelectedPreset(item.id)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.presetCardTop}>
                      <View style={[styles.presetIconBox, isActive && styles.presetIconBoxActive]}>
                        <Feather 
                          name={item.icon} 
                          size={14} 
                          color={isActive ? theme.primaryLight : theme.textSecondary} 
                        />
                      </View>
                      <View style={[styles.radioCircle, isActive && styles.radioCircleActive]}>
                        {isActive && <View style={styles.radioInner} />}
                      </View>
                    </View>
                    <Text style={[styles.presetLabel, isActive && styles.presetLabelActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Section 2: Compensation breakdown inclusion */}
            <View style={[styles.sectionHeader, { marginTop: 20 }]}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionTitle}>COMPENSATION DETAILS</Text>
            </View>

            <TouchableOpacity 
              style={[
                styles.compensationToggle,
                withCompensation && styles.compensationToggleActive
              ]}
              onPress={() => setWithCompensation(!withCompensation)}
              activeOpacity={0.8}
            >
              <View style={styles.checkboxBox}>
                <Feather 
                  name={withCompensation ? "check-square" : "square"} 
                  size={18} 
                  color={withCompensation ? theme.primaryLight : theme.textMuted} 
                />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.compTitle, withCompensation && styles.compTitleActive]}>
                  Include Salary & Compensation Details
                </Text>
                <Text style={styles.compSub}>
                  Check if requested by bank or visa authority for financial assessment
                </Text>
              </View>
            </TouchableOpacity>

            {/* Section 3: Additional Notes */}
            <View style={[styles.sectionHeader, { marginTop: 24 }]}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionTitle}>SPECIFIC DETAILS & REMARKS</Text>
            </View>

            <View style={styles.textAreaWrapper}>
              <TextInput
                style={styles.textArea}
                placeholder="State any specific addressed institution, embassy, or custom remarks..."
                placeholderTextColor={theme.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={purpose}
                onChangeText={setPurpose}
              />
              <View style={styles.charCountRow}>
                <Text style={styles.charCountHint}>e.g., Address to Embassy of Japan, BDO, etc.</Text>
                <Text style={styles.charCount}>{purpose.length} chars</Text>
              </View>
            </View>

          </View>

          {/* Error Banner */}
          {errorMsg ? (
            <View style={styles.errorContainer}>
              <Feather name="alert-circle" size={16} color={theme.error} style={{ marginRight: 8, marginTop: 1 }} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* Submit Action */}
          <TouchableOpacity 
            style={[
              styles.submitButton, 
              !isFormComplete && styles.submitButtonDisabled
            ]} 
            onPress={handleSubmit}
            disabled={!isFormComplete || isSubmitting}
            activeOpacity={0.85}
          >
            {isFormComplete ? (
              <LinearGradient
                colors={['#10b981', '#139D9E', '#08697A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitGradient}
              >
                {isSubmitting ? (
                  <>
                    <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 10 }} />
                    <Text style={styles.submitButtonText}>Submitting COE Request...</Text>
                  </>
                ) : (
                  <>
                    <Feather name="send" size={16} color="#ffffff" style={{ marginRight: 8 }} />
                    <Text style={styles.submitButtonText}>Submit COE Request</Text>
                  </>
                )}
              </LinearGradient>
            ) : (
              <View style={styles.disabledInner}>
                <Feather name="send" size={16} color={theme.textMuted} style={{ marginRight: 8 }} />
                <Text style={[styles.submitButtonText, { color: theme.textMuted }]}>
                  {isSubmitting ? 'Submitting...' : 'Submit COE Request'}
                </Text>
              </View>
            )}
          </TouchableOpacity>

        </View>
      </ScrollView>
    </View>
  );
}

const getStyles = (theme: ThemeColors, isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: isDarkMode ? '#070e18' : '#f8fafc',
  },
  topGradientStrip: {
    height: 4,
    width: '100%',
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 54 : (Platform.OS === 'web' ? 18 : 20),
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    backgroundColor: isDarkMode ? 'rgba(15, 27, 44, 0.95)' : 'rgba(255, 255, 255, 0.95)',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  headerTitleBlock: {
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: theme.primaryLight,
    marginBottom: 2,
  },
  headerTitle: {
    color: theme.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.tealTint,
    borderWidth: 1,
    borderColor: theme.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 0,
  },
  headerBadgeDot: {
    width: 6,
    height: 6,
    backgroundColor: theme.emerald,
    borderRadius: 3,
    marginRight: 6,
  },
  headerBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.primaryLight,
    letterSpacing: 0.8,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  formWrapper: {
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.tealTint,
    borderWidth: 1,
    borderColor: isDarkMode ? 'rgba(19, 157, 158, 0.25)' : 'rgba(8, 105, 122, 0.2)',
    padding: 12,
    marginBottom: 16,
    borderRadius: 0,
  },
  noticeIconWrap: {
    marginRight: 10,
    marginTop: 1,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: isDarkMode ? theme.textSecondary : '#1e3a47',
    fontWeight: '500',
  },
  card: {
    backgroundColor: theme.cardBg,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 0,
    padding: 20,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  cardAccentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionDot: {
    width: 6,
    height: 6,
    backgroundColor: theme.primaryLight,
    marginRight: 8,
    borderRadius: 0,
  },
  sectionTitle: {
    color: theme.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    flex: 1,
  },
  requiredIndicator: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.textMuted,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetCard: {
    width: '48.5%',
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.02)' : '#ffffff',
    padding: 12,
    borderRadius: 0,
    justifyContent: 'space-between',
    minHeight: 70,
  },
  presetCardActive: {
    borderColor: theme.primaryLight,
    backgroundColor: theme.tealTint,
  },
  presetCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  presetIconBox: {
    width: 26,
    height: 26,
    borderRadius: 0,
    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetIconBoxActive: {
    backgroundColor: isDarkMode ? 'rgba(19, 157, 158, 0.2)' : 'rgba(8, 105, 122, 0.12)',
  },
  radioCircle: {
    width: 14,
    height: 14,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: theme.primaryLight,
  },
  radioInner: {
    width: 6,
    height: 6,
    backgroundColor: theme.primaryLight,
    borderRadius: 3,
  },
  presetLabel: {
    color: theme.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  presetLabelActive: {
    color: isDarkMode ? '#ffffff' : theme.primary,
  },
  compensationToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.02)' : '#ffffff',
    padding: 12,
    borderRadius: 0,
  },
  compensationToggleActive: {
    borderColor: theme.primaryLight,
    backgroundColor: theme.tealTint,
  },
  checkboxBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  compTitle: {
    color: theme.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  compTitleActive: {
    color: isDarkMode ? '#ffffff' : theme.primary,
  },
  compSub: {
    color: theme.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  textAreaWrapper: {
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.inputBg,
    borderRadius: 0,
    padding: 12,
  },
  textArea: {
    color: theme.textPrimary,
    fontSize: 13,
    minHeight: 88,
    lineHeight: 20,
    paddingTop: 0,
  },
  charCountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
  },
  charCountHint: {
    fontSize: 10,
    color: theme.textMuted,
  },
  charCount: {
    fontSize: 10,
    color: theme.textMuted,
    fontWeight: '600',
  },
  submitButton: {
    borderRadius: 0,
    overflow: 'hidden',
    marginTop: 8,
  },
  submitButtonDisabled: {
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : '#e2e8f0',
  },
  disabledInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.roseTint,
    borderWidth: 1,
    borderColor: theme.error,
    padding: 12,
    marginBottom: 12,
    borderRadius: 0,
  },
  errorText: {
    color: theme.error,
    fontSize: 12,
    flex: 1,
    lineHeight: 17,
    fontWeight: '500',
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  successCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: theme.cardBg,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 0,
    padding: 28,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  successIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 0,
    backgroundColor: theme.emeraldTint,
    borderWidth: 1,
    borderColor: theme.emerald,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    marginTop: 10,
  },
  successTitle: {
    color: theme.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  successDesc: {
    color: theme.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  submitButtonSuccess: {
    width: '100%',
    borderRadius: 0,
    overflow: 'hidden',
  },
});
