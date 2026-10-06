import React, { useState, createElement } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, TextInput, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useTheme, ThemeColors } from '../theme/ThemeContext';
import DateTimePicker from '@react-native-community/datetimepicker';

interface LeaveRequestFormScreenProps {
  onBack: () => void;
  onSubmitSuccess: () => void;
  token?: string | null;
  employeeId?: number | null;
}

const LEAVE_TYPES = [
  { id: 'Vacation', label: 'Vacation', desc: 'Planned rest & personal leave', icon: 'sun' as const },
  { id: 'Sick Leave', label: 'Sick Leave', desc: 'Medical & health recuperation', icon: 'activity' as const },
  { id: 'Emergency', label: 'Emergency', desc: 'Urgent family / critical event', icon: 'alert-circle' as const },
];

export default function LeaveRequestFormScreen({ onBack, onSubmitSuccess, token, employeeId }: LeaveRequestFormScreenProps) {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);
  const [leaveType, setLeaveType] = useState<string>('Vacation');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Helper to parse "YYYY-MM-DD" back to Date
  const parseDateString = (dateStr: string) => {
    if (!dateStr) return new Date();
    const [y, m, d] = dateStr.split('-');
    if (y && m && d) return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    return new Date();
  };

  const formatHumanDate = (dateStr: string) => {
    if (!dateStr) return null;
    try {
      const [y, m, d] = dateStr.split('-');
      if (y && m && d) {
        const obj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
        return obj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
    } catch {}
    return dateStr;
  };

  const getDurationInfo = () => {
    if (!startDate || !endDate) return null;
    try {
      const [y1, m1, d1] = startDate.split('-').map(Number);
      const [y2, m2, d2] = endDate.split('-').map(Number);
      const start = new Date(y1, m1 - 1, d1);
      const end = new Date(y2, m2 - 1, d2);
      const diffMs = end.getTime() - start.getTime();
      const diffDays = Math.round(diffMs / (1000 * 3600 * 24)) + 1;
      if (diffDays < 1) {
        return { valid: false, message: 'End date must be on or after start date' };
      }
      return { 
        valid: true, 
        days: diffDays, 
        message: `${diffDays} Day${diffDays > 1 ? 's' : ''} Leave Duration` 
      };
    } catch {
      return null;
    }
  };

  const durationInfo = getDurationInfo();

  const handleDateChangePicker = (event: any, selectedDate: Date | undefined, isStart: boolean) => {
    if (Platform.OS !== 'ios') {
      if (isStart) setShowStartPicker(false);
      else setShowEndPicker(false);
    }
    
    if (selectedDate && !isNaN(selectedDate.getTime())) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const formatted = `${year}-${month}-${day}`;
      
      if (isStart) {
        setStartDate(formatted);
        // If the newly picked start date is after current end date, auto-align end date
        if (endDate && formatted > endDate) {
          setEndDate(formatted);
        }
      } else {
        // End date cannot be before start date
        if (startDate && formatted < startDate) {
          setEndDate(startDate);
        } else {
          setEndDate(formatted);
        }
      }
    }
  };

  const handleSubmit = async () => {
    if (!token) {
      setErrorMsg('You are not properly logged in. Please log out and log back in to get a valid token.');
      return;
    }
    if (!employeeId) {
      setErrorMsg('No employee profile linked to your account. You cannot submit leave requests.');
      return;
    }
    if (durationInfo && !durationInfo.valid) {
      setErrorMsg(durationInfo.message);
      return;
    }
    
    setIsSubmitting(true);
    setErrorMsg(null);
    
    try {
      const url = Platform.OS === 'web' 
        ? `http://${window.location.hostname}/atech_prime/backend/public/api/leave-requests`
        : 'http://192.168.100.31/atech_prime/backend/public/api/leave-requests';
        
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
          leave_type: leaveType,
          start_date: startDate,
          end_date: endDate,
          reason: reason
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit request');
      }
      
      setSubmitted(true);
    } catch (error: any) {
      setErrorMsg(error.message || 'An error occurred while submitting.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormComplete = Boolean(
    startDate && 
    endDate && 
    reason.trim() && 
    (!durationInfo || durationInfo.valid)
  );

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
          <TouchableOpacity style={styles.backButton} onPress={onSubmitSuccess}>
            <Feather name="arrow-left" size={18} color={theme.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitleBlock}>
            <Text style={styles.headerSubtitle}>TIME OFF PORTAL</Text>
            <Text style={styles.headerTitle}>Leave Request</Text>
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
            <Text style={styles.successTitle}>Request Submitted</Text>
            <Text style={styles.successDesc}>
              Your {leaveType} request for {formatHumanDate(startDate)} to {formatHumanDate(endDate)} has been recorded and submitted to HR for approval.
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
          <Text style={styles.headerSubtitle}>EMPLOYEE SELF-SERVICE</Text>
          <Text style={styles.headerTitle}>New Leave Request</Text>
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
              Requests require supervisor endorsement. Please ensure your dates and details are complete prior to submission.
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

            {/* Section 1: Leave Type */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionTitle}>SELECT LEAVE TYPE</Text>
            </View>

            <View style={styles.typeGrid}>
              {LEAVE_TYPES.map((item) => {
                const isActive = leaveType === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.typeCard,
                      isActive && styles.typeCardActive
                    ]}
                    onPress={() => setLeaveType(item.id)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.typeCardTop}>
                      <View style={[styles.typeIconBox, isActive && styles.typeIconBoxActive]}>
                        <Feather 
                          name={item.icon} 
                          size={15} 
                          color={isActive ? theme.primaryLight : theme.textSecondary} 
                        />
                      </View>
                      <View style={[styles.typeRadioCircle, isActive && styles.typeRadioCircleActive]}>
                        {isActive && <View style={styles.typeRadioInner} />}
                      </View>
                    </View>
                    <Text style={[styles.typeLabel, isActive && styles.typeLabelActive]}>
                      {item.label}
                    </Text>
                    <Text style={styles.typeDesc}>
                      {item.desc}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Section 2: Duration */}
            <View style={[styles.sectionHeader, { marginTop: 24 }]}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionTitle}>DURATION & DATES</Text>
            </View>

            <View style={styles.dateRow}>
              {/* Start Date */}
              <View style={styles.dateInputWrapper}>
                <Text style={styles.inputFieldLabel}>START DATE</Text>
                
                {Platform.OS === 'web' ? (
                  <View style={[styles.dateBox, startDate ? styles.dateBoxFilled : null]}>
                    <Feather 
                      name="calendar" 
                      size={15} 
                      color={startDate ? theme.primaryLight : theme.textMuted} 
                      style={styles.inputIcon} 
                    />
                    <View style={styles.dateTextContainer}>
                      <Text style={[styles.dateValueText, !startDate && styles.datePlaceholderText]}>
                        {startDate ? formatHumanDate(startDate) : 'Select Start Date'}
                      </Text>
                      {startDate ? (
                        <Text style={styles.dateIsoSubtext}>{startDate}</Text>
                      ) : null}
                    </View>
                    {createElement('input', {
                      type: 'date',
                      value: startDate,
                      onChange: (e: any) => handleDateChangePicker(null, new Date(e.target.value), true),
                      onClick: (e: any) => {
                        try {
                          if (e.target && typeof e.target.showPicker === 'function') {
                            e.target.showPicker();
                          }
                        } catch (err) {}
                      },
                      style: {
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        opacity: 0,
                        cursor: 'pointer'
                      }
                    })}
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={[styles.dateBox, startDate ? styles.dateBoxFilled : null]} 
                    onPress={() => setShowStartPicker(true)}
                    activeOpacity={0.7}
                  >
                    <Feather 
                      name="calendar" 
                      size={15} 
                      color={startDate ? theme.primaryLight : theme.textMuted} 
                      style={styles.inputIcon} 
                    />
                    <View style={styles.dateTextContainer}>
                      <Text style={[styles.dateValueText, !startDate && styles.datePlaceholderText]}>
                        {startDate ? formatHumanDate(startDate) : 'Select Start Date'}
                      </Text>
                      {startDate ? (
                        <Text style={styles.dateIsoSubtext}>{startDate}</Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                )}

                {showStartPicker && Platform.OS !== 'web' && (
                  <DateTimePicker
                    value={parseDateString(startDate)}
                    mode="date"
                    display="default"
                    onChange={(e: any, d?: Date) => handleDateChangePicker(e, d, true)}
                  />
                )}
              </View>

              {/* End Date */}
              <View style={styles.dateInputWrapper}>
                <Text style={styles.inputFieldLabel}>END DATE</Text>

                {Platform.OS === 'web' ? (
                  <View style={[styles.dateBox, endDate ? styles.dateBoxFilled : null]}>
                    <Feather 
                      name="calendar" 
                      size={15} 
                      color={endDate ? theme.primaryLight : theme.textMuted} 
                      style={styles.inputIcon} 
                    />
                    <View style={styles.dateTextContainer}>
                      <Text style={[styles.dateValueText, !endDate && styles.datePlaceholderText]}>
                        {endDate ? formatHumanDate(endDate) : 'Select End Date'}
                      </Text>
                      {endDate ? (
                        <Text style={styles.dateIsoSubtext}>{endDate}</Text>
                      ) : null}
                    </View>
                    {createElement('input', {
                      type: 'date',
                      value: endDate,
                      min: startDate || undefined,
                      onChange: (e: any) => handleDateChangePicker(null, new Date(e.target.value), false),
                      onClick: (e: any) => {
                        try {
                          if (e.target && typeof e.target.showPicker === 'function') {
                            e.target.showPicker();
                          }
                        } catch (err) {}
                      },
                      style: {
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        opacity: 0,
                        cursor: 'pointer'
                      }
                    })}
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={[styles.dateBox, endDate ? styles.dateBoxFilled : null]} 
                    onPress={() => setShowEndPicker(true)}
                    activeOpacity={0.7}
                  >
                    <Feather 
                      name="calendar" 
                      size={15} 
                      color={endDate ? theme.primaryLight : theme.textMuted} 
                      style={styles.inputIcon} 
                    />
                    <View style={styles.dateTextContainer}>
                      <Text style={[styles.dateValueText, !endDate && styles.datePlaceholderText]}>
                        {endDate ? formatHumanDate(endDate) : 'Select End Date'}
                      </Text>
                      {endDate ? (
                        <Text style={styles.dateIsoSubtext}>{endDate}</Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                )}

                {showEndPicker && Platform.OS !== 'web' && (
                  <DateTimePicker
                    value={parseDateString(endDate || startDate)}
                    mode="date"
                    display="default"
                    minimumDate={startDate ? parseDateString(startDate) : undefined}
                    onChange={(e: any, d?: Date) => handleDateChangePicker(e, d, false)}
                  />
                )}
              </View>
            </View>

            {/* Calculated duration badge */}
            {durationInfo ? (
              <View style={[
                styles.durationBadge,
                durationInfo.valid ? styles.durationBadgeValid : styles.durationBadgeInvalid
              ]}>
                <Feather 
                  name={durationInfo.valid ? "clock" : "alert-triangle"} 
                  size={13} 
                  color={durationInfo.valid ? theme.emerald : theme.error} 
                  style={{ marginRight: 6 }} 
                />
                <Text style={[
                  styles.durationBadgeText,
                  { color: durationInfo.valid ? (isDarkMode ? theme.emerald : '#065f46') : theme.error }
                ]}>
                  {durationInfo.message}
                </Text>
              </View>
            ) : null}

            {/* Section 3: Reason */}
            <View style={[styles.sectionHeader, { marginTop: 24 }]}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionTitle}>JUSTIFICATION & REASON</Text>
              <Text style={styles.requiredIndicator}>*Required</Text>
            </View>

            <View style={styles.textAreaWrapper}>
              <TextInput
                style={styles.textArea}
                placeholder="Provide specific details or reason for taking leave..."
                placeholderTextColor={theme.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={reason}
                onChangeText={setReason}
              />
              <View style={styles.charCountRow}>
                <Text style={styles.charCountHint}>Provide enough context for supervisor review</Text>
                <Text style={styles.charCount}>{reason.length} chars</Text>
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
                    <Text style={styles.submitButtonText}>Submitting Leave Request...</Text>
                  </>
                ) : (
                  <>
                    <Feather name="send" size={16} color="#ffffff" style={{ marginRight: 8 }} />
                    <Text style={styles.submitButtonText}>Submit Leave Request</Text>
                  </>
                )}
              </LinearGradient>
            ) : (
              <View style={styles.disabledInner}>
                <Feather name="send" size={16} color={theme.textMuted} style={{ marginRight: 8 }} />
                <Text style={[styles.submitButtonText, { color: theme.textMuted }]}>
                  {isSubmitting ? 'Submitting...' : 'Submit Leave Request'}
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
  typeGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  typeCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.02)' : '#ffffff',
    padding: 12,
    borderRadius: 0,
    minHeight: 88,
    justifyContent: 'space-between',
  },
  typeCardActive: {
    borderColor: theme.primaryLight,
    backgroundColor: theme.tealTint,
  },
  typeCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeIconBox: {
    width: 28,
    height: 28,
    borderRadius: 0,
    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeIconBoxActive: {
    backgroundColor: isDarkMode ? 'rgba(19, 157, 158, 0.2)' : 'rgba(8, 105, 122, 0.12)',
  },
  typeRadioCircle: {
    width: 14,
    height: 14,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeRadioCircleActive: {
    borderColor: theme.primaryLight,
  },
  typeRadioInner: {
    width: 6,
    height: 6,
    backgroundColor: theme.primaryLight,
    borderRadius: 3,
  },
  typeLabel: {
    color: theme.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  typeLabelActive: {
    color: isDarkMode ? '#ffffff' : theme.primary,
  },
  typeDesc: {
    color: theme.textMuted,
    fontSize: 10,
    lineHeight: 13,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInputWrapper: {
    flex: 1,
  },
  inputFieldLabel: {
    color: theme.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  dateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.inputBg,
    borderRadius: 0,
    paddingHorizontal: 12,
    height: 52,
    position: 'relative',
  },
  dateBoxFilled: {
    borderColor: isDarkMode ? 'rgba(19, 157, 158, 0.4)' : '#cbd5e1',
  },
  inputIcon: {
    marginRight: 10,
  },
  dateTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  dateValueText: {
    color: theme.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  datePlaceholderText: {
    color: theme.textMuted,
    fontWeight: '500',
    fontSize: 12,
  },
  dateIsoSubtext: {
    color: theme.textMuted,
    fontSize: 10,
    marginTop: 1,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 0,
    borderWidth: 1,
  },
  durationBadgeValid: {
    backgroundColor: theme.emeraldTint,
    borderColor: isDarkMode ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.4)',
  },
  durationBadgeInvalid: {
    backgroundColor: theme.roseTint,
    borderColor: isDarkMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.4)',
  },
  durationBadgeText: {
    fontSize: 11,
    fontWeight: '700',
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
