import React, { useState, createElement } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, TextInput, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useTheme, ThemeColors } from '../theme/ThemeContext';
import DateTimePicker from '@react-native-community/datetimepicker';

interface UndertimeRequestFormScreenProps {
  onBack: () => void;
  onSubmitSuccess: () => void;
  token?: string | null;
  employeeId?: number | null;
}

export default function UndertimeRequestFormScreen({ onBack, onSubmitSuccess, token, employeeId }: UndertimeRequestFormScreenProps) {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);
  const [date, setDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const parseDateString = (dateStr: string) => {
    if (!dateStr) return new Date();
    const [y, m, d] = dateStr.split('-');
    if (y && m && d) return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    return new Date();
  };

  const parseTimeString = (timeStr: string) => {
    if (!timeStr) return new Date();
    const [h, m] = timeStr.split(':');
    const d = new Date();
    if (h && m) {
      d.setHours(parseInt(h), parseInt(m), 0, 0);
    }
    return d;
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

  const formatHumanTime = (timeStr: string) => {
    if (!timeStr) return null;
    try {
      const [h, m] = timeStr.split(':');
      if (h !== undefined && m !== undefined) {
        const d = new Date();
        d.setHours(parseInt(h), parseInt(m));
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      }
    } catch {}
    return timeStr;
  };

  const getDurationInfo = () => {
    if (!startTime || !endTime) return null;
    try {
      const [h1, m1] = startTime.split(':').map(Number);
      const [h2, m2] = endTime.split(':').map(Number);
      const totalMinutes1 = h1 * 60 + m1;
      const totalMinutes2 = h2 * 60 + m2;
      const diffMinutes = totalMinutes2 - totalMinutes1;
      if (diffMinutes <= 0) {
        return { valid: false, message: 'End time must be after start time' };
      }
      const hrs = Math.floor(diffMinutes / 60);
      const mins = diffMinutes % 60;
      const hoursText = hrs > 0 ? `${hrs}h ` : '';
      const minsText = mins > 0 ? `${mins}m ` : '';
      return { 
        valid: true, 
        message: `${(hoursText + minsText).trim()} Undertime Duration` 
      };
    } catch {
      return null;
    }
  };

  const durationInfo = getDurationInfo();

  const handleDateChangePicker = (event: any, selectedDate: Date | undefined) => {
    if (Platform.OS !== 'ios') setShowDatePicker(false);
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      setDate(`${year}-${month}-${day}`);
    }
  };

  const handleTimeChangePicker = (event: any, selectedTime: Date | undefined, isStart: boolean) => {
    if (Platform.OS !== 'ios') {
      if (isStart) setShowStartTimePicker(false);
      else setShowEndTimePicker(false);
    }
    if (selectedTime) {
      const hours = String(selectedTime.getHours()).padStart(2, '0');
      const minutes = String(selectedTime.getMinutes()).padStart(2, '0');
      if (isStart) setStartTime(`${hours}:${minutes}`);
      else setEndTime(`${hours}:${minutes}`);
    }
  };

  const handleSubmit = async () => {
    if (!token) {
      setErrorMsg('You are not properly logged in. Please log out and log back in to get a valid token.');
      return;
    }
    if (!employeeId) {
      setErrorMsg('No employee profile linked to your account. You cannot submit undertime requests.');
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
        ? `http://${window.location.hostname}/atech_prime/backend/public/api/undertime-requests`
        : 'http://192.168.100.11/atech_prime/backend/public/api/undertime-requests';
        
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
          date: date,
          start_time: startTime,
          end_time: endTime,
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
    date && 
    startTime && 
    endTime && 
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
            <Text style={styles.headerSubtitle}>TIME ADJUSTMENT</Text>
            <Text style={styles.headerTitle}>Undertime Request</Text>
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
              Your undertime request for {formatHumanDate(date)} ({formatHumanTime(startTime)} - {formatHumanTime(endTime)}) has been submitted to HR for review.
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
          <Text style={styles.headerSubtitle}>TIME MANAGEMENT</Text>
          <Text style={styles.headerTitle}>New Undertime Request</Text>
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
              Undertime requests should be lodged prior to early departure or within policy grace limits.
            </Text>
          </View>

          {/* Main Card */}
          <View style={styles.card}>
            <LinearGradient
              colors={['#10b981', '#139D9E', '#08697A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.cardAccentBar}
            />

            {/* Section 1: Target Date */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionTitle}>EFFECTIVE DATE</Text>
            </View>

            <View style={styles.dateInputWrapperFull}>
              {Platform.OS === 'web' ? (
                <View style={[styles.dateBox, date ? styles.dateBoxFilled : null]}>
                  <Feather 
                    name="calendar" 
                    size={15} 
                    color={date ? theme.primaryLight : theme.textMuted} 
                    style={styles.inputIcon} 
                  />
                  <View style={styles.dateTextContainer}>
                    <Text style={[styles.dateValueText, !date && styles.datePlaceholderText]}>
                      {date ? formatHumanDate(date) : 'Select Undertime Date'}
                    </Text>
                    {date ? <Text style={styles.dateIsoSubtext}>{date}</Text> : null}
                  </View>
                  {createElement('input', {
                    type: 'date',
                    value: date,
                    onChange: (e: any) => handleDateChangePicker(null, new Date(e.target.value)),
                    onClick: (e: any) => {
                      try { if (e.target && typeof e.target.showPicker === 'function') e.target.showPicker(); } catch (err) {}
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
                  style={[styles.dateBox, date ? styles.dateBoxFilled : null]} 
                  onPress={() => setShowDatePicker(true)} 
                  activeOpacity={0.7}
                >
                  <Feather 
                    name="calendar" 
                    size={15} 
                    color={date ? theme.primaryLight : theme.textMuted} 
                    style={styles.inputIcon} 
                  />
                  <View style={styles.dateTextContainer}>
                    <Text style={[styles.dateValueText, !date && styles.datePlaceholderText]}>
                      {date ? formatHumanDate(date) : 'Select Undertime Date'}
                    </Text>
                    {date ? <Text style={styles.dateIsoSubtext}>{date}</Text> : null}
                  </View>
                </TouchableOpacity>
              )}

              {showDatePicker && Platform.OS !== 'web' && (
                <DateTimePicker 
                  value={parseDateString(date)} 
                  mode="date" 
                  display="default" 
                  onChange={handleDateChangePicker} 
                />
              )}
            </View>

            {/* Section 2: Time Range */}
            <View style={[styles.sectionHeader, { marginTop: 20 }]}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionTitle}>TIME DURATION</Text>
            </View>

            <View style={styles.timeRow}>
              {/* Start Time */}
              <View style={styles.timeCol}>
                <Text style={styles.inputFieldLabel}>START TIME</Text>
                {Platform.OS === 'web' ? (
                  <View style={[styles.dateBox, startTime ? styles.dateBoxFilled : null]}>
                    <Feather 
                      name="clock" 
                      size={15} 
                      color={startTime ? theme.primaryLight : theme.textMuted} 
                      style={styles.inputIcon} 
                    />
                    <View style={styles.dateTextContainer}>
                      <Text style={[styles.dateValueText, !startTime && styles.datePlaceholderText]}>
                        {startTime ? formatHumanTime(startTime) : 'Select Start'}
                      </Text>
                      {startTime ? <Text style={styles.dateIsoSubtext}>{startTime}</Text> : null}
                    </View>
                    {createElement('input', {
                      type: 'time',
                      value: startTime,
                      onChange: (e: any) => setStartTime(e.target.value),
                      onClick: (e: any) => {
                        try { if (e.target && typeof e.target.showPicker === 'function') e.target.showPicker(); } catch (err) {}
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
                    style={[styles.dateBox, startTime ? styles.dateBoxFilled : null]} 
                    onPress={() => setShowStartTimePicker(true)} 
                    activeOpacity={0.7}
                  >
                    <Feather 
                      name="clock" 
                      size={15} 
                      color={startTime ? theme.primaryLight : theme.textMuted} 
                      style={styles.inputIcon} 
                    />
                    <View style={styles.dateTextContainer}>
                      <Text style={[styles.dateValueText, !startTime && styles.datePlaceholderText]}>
                        {startTime ? formatHumanTime(startTime) : 'Select Start'}
                      </Text>
                      {startTime ? <Text style={styles.dateIsoSubtext}>{startTime}</Text> : null}
                    </View>
                  </TouchableOpacity>
                )}

                {showStartTimePicker && Platform.OS !== 'web' && (
                  <DateTimePicker 
                    value={parseTimeString(startTime)} 
                    mode="time" 
                    display="default" 
                    onChange={(e: any, d?: Date) => handleTimeChangePicker(e, d, true)} 
                  />
                )}
              </View>

              {/* End Time */}
              <View style={styles.timeCol}>
                <Text style={styles.inputFieldLabel}>END TIME</Text>
                {Platform.OS === 'web' ? (
                  <View style={[styles.dateBox, endTime ? styles.dateBoxFilled : null]}>
                    <Feather 
                      name="clock" 
                      size={15} 
                      color={endTime ? theme.primaryLight : theme.textMuted} 
                      style={styles.inputIcon} 
                    />
                    <View style={styles.dateTextContainer}>
                      <Text style={[styles.dateValueText, !endTime && styles.datePlaceholderText]}>
                        {endTime ? formatHumanTime(endTime) : 'Select End'}
                      </Text>
                      {endTime ? <Text style={styles.dateIsoSubtext}>{endTime}</Text> : null}
                    </View>
                    {createElement('input', {
                      type: 'time',
                      value: endTime,
                      onChange: (e: any) => setEndTime(e.target.value),
                      onClick: (e: any) => {
                        try { if (e.target && typeof e.target.showPicker === 'function') e.target.showPicker(); } catch (err) {}
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
                    style={[styles.dateBox, endTime ? styles.dateBoxFilled : null]} 
                    onPress={() => setShowEndTimePicker(true)} 
                    activeOpacity={0.7}
                  >
                    <Feather 
                      name="clock" 
                      size={15} 
                      color={endTime ? theme.primaryLight : theme.textMuted} 
                      style={styles.inputIcon} 
                    />
                    <View style={styles.dateTextContainer}>
                      <Text style={[styles.dateValueText, !endTime && styles.datePlaceholderText]}>
                        {endTime ? formatHumanTime(endTime) : 'Select End'}
                      </Text>
                      {endTime ? <Text style={styles.dateIsoSubtext}>{endTime}</Text> : null}
                    </View>
                  </TouchableOpacity>
                )}

                {showEndTimePicker && Platform.OS !== 'web' && (
                  <DateTimePicker 
                    value={parseTimeString(endTime)} 
                    mode="time" 
                    display="default" 
                    onChange={(e: any, d?: Date) => handleTimeChangePicker(e, d, false)} 
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
                placeholder="State specific reason for early departure or undertime..."
                placeholderTextColor={theme.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={reason}
                onChangeText={setReason}
              />
              <View style={styles.charCountRow}>
                <Text style={styles.charCountHint}>Provide concise context for your supervisor</Text>
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
                    <Text style={styles.submitButtonText}>Submitting Undertime Request...</Text>
                  </>
                ) : (
                  <>
                    <Feather name="send" size={16} color="#ffffff" style={{ marginRight: 8 }} />
                    <Text style={styles.submitButtonText}>Submit Undertime Request</Text>
                  </>
                )}
              </LinearGradient>
            ) : (
              <View style={styles.disabledInner}>
                <Feather name="send" size={16} color={theme.textMuted} style={{ marginRight: 8 }} />
                <Text style={[styles.submitButtonText, { color: theme.textMuted }]}>
                  {isSubmitting ? 'Submitting...' : 'Submit Undertime Request'}
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
  dateInputWrapperFull: {
    width: '100%',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeCol: {
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
