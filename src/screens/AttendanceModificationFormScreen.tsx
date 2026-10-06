import React, { useState, createElement } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, 
  TextInput, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme, ThemeColors } from '../theme/ThemeContext';

interface AttendanceModificationFormScreenProps {
  token: string | null;
  initialDate?: string;
  onBack: () => void;
  onSubmitSuccess: () => void;
}

export default function AttendanceModificationFormScreen({ token, initialDate, onBack, onSubmitSuccess }: AttendanceModificationFormScreenProps) {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);
  
  const [date, setDate] = useState(initialDate || '');
  const [timeIn, setTimeIn] = useState('');
  const [timeOut, setTimeOut] = useState('');
  const [reason, setReason] = useState('');
  const [files, setFiles] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  const handlePickDocuments = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: true,
        type: '*/*',
      });
      if (result.canceled) return;
      setFiles(prev => [...prev, ...result.assets]);
    } catch (e) {
      console.error(e);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setErrorMsg(null);
    if (!token) {
      setErrorMsg('You are not properly logged in. Please log out and log back in.');
      return;
    }
    if (!date) {
      setErrorMsg('Attendance date is required.');
      return;
    }
    if (!timeIn && !timeOut) {
      setErrorMsg('Please specify either Requested Time In or Requested Time Out.');
      return;
    }
    if (!reason.trim()) {
      setErrorMsg('Please provide a reason or justification for this modification.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('date', date);
      formData.append('requested_time_in', timeIn);
      formData.append('requested_time_out', timeOut);
      formData.append('reason', reason.trim());

      files.forEach((file) => {
        if (Platform.OS === 'web') {
          formData.append('attachments[]', file.file);
        } else {
          formData.append('attachments[]', {
            uri: file.uri,
            name: file.name,
            type: file.mimeType || 'application/octet-stream'
          } as any);
        }
      });

      const apiUrl = Platform.OS === 'web' 
        ? `http://${window.location.hostname}/atech_prime/backend/public/api/attendance/modification-requests`
        : `http://192.168.100.11/atech_prime/backend/public/api/attendance/modification-requests`;
        
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Authorization': `Bearer ${token}`
        },
        body: formData,
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to submit modification request');
      
      setSubmitted(true);
    } catch (error: any) {
      setErrorMsg(error.message || 'Failed to submit modification request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormComplete = Boolean(date && (timeIn || timeOut) && reason.trim());

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
            <Text style={styles.headerSubtitle}>ATTENDANCE CORRECTION</Text>
            <Text style={styles.headerTitle}>Modification Request</Text>
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
              Your attendance adjustment request for {formatHumanDate(date)} has been submitted to your supervisor and HR for approval.
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
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
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
          <Text style={styles.headerSubtitle}>TIMEKEEPING & AUDIT</Text>
          <Text style={styles.headerTitle}>New Modification Request</Text>
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
              Time adjustments are audited against system logs. Please attach supporting documents (e.g. punch screenshots, slips) when possible.
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

            {/* Section 1: Attendance Date */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionTitle}>ATTENDANCE DATE</Text>
              <Text style={styles.requiredIndicator}>*Required</Text>
            </View>

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
                    {date ? formatHumanDate(date) : 'Select Attendance Date'}
                  </Text>
                  {date ? <Text style={styles.dateIsoSubtext}>{date}</Text> : null}
                </View>
                {createElement('input', {
                  type: 'date',
                  value: date,
                  onChange: (e: any) => setDate(e.target.value),
                  onClick: (e: any) => {
                    try { if (e.target && typeof e.target.showPicker === 'function') e.target.showPicker(); } catch (err) {}
                  },
                  style: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }
                })}
              </View>
            ) : (
              <View style={styles.dateBox}>
                <Feather name="calendar" size={15} color={theme.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.inputField}
                  value={date}
                  onChangeText={setDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={theme.textMuted}
                />
              </View>
            )}

            {/* Section 2: Adjusted Time Stamps */}
            <View style={[styles.sectionHeader, { marginTop: 24 }]}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionTitle}>ADJUSTED TIME STAMPS</Text>
            </View>

            <View style={styles.timeRow}>
              {/* Requested Time In */}
              <View style={styles.timeCol}>
                <Text style={styles.inputFieldLabel}>REQUESTED TIME IN</Text>
                {Platform.OS === 'web' ? (
                  <View style={[styles.timeBox, timeIn ? styles.timeBoxFilled : null]}>
                    <Feather name="clock" size={14} color={timeIn ? theme.primaryLight : theme.textMuted} style={styles.inputIcon} />
                    <View style={styles.dateTextContainer}>
                      <Text style={[styles.dateValueText, !timeIn && styles.datePlaceholderText]}>
                        {timeIn ? formatHumanTime(timeIn) : '08:00 AM'}
                      </Text>
                      {timeIn ? <Text style={styles.dateIsoSubtext}>{timeIn}</Text> : null}
                    </View>
                    {createElement('input', {
                      type: 'time',
                      value: timeIn,
                      onChange: (e: any) => setTimeIn(e.target.value),
                      onClick: (e: any) => {
                        try { if (e.target && typeof e.target.showPicker === 'function') e.target.showPicker(); } catch (err) {}
                      },
                      style: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }
                    })}
                  </View>
                ) : (
                  <View style={styles.timeBox}>
                    <Feather name="clock" size={14} color={theme.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.inputField}
                      value={timeIn}
                      onChangeText={setTimeIn}
                      placeholder="08:00"
                      placeholderTextColor={theme.textMuted}
                    />
                  </View>
                )}
              </View>

              {/* Requested Time Out */}
              <View style={styles.timeCol}>
                <Text style={styles.inputFieldLabel}>REQUESTED TIME OUT</Text>
                {Platform.OS === 'web' ? (
                  <View style={[styles.timeBox, timeOut ? styles.timeBoxFilled : null]}>
                    <Feather name="clock" size={14} color={timeOut ? theme.primaryLight : theme.textMuted} style={styles.inputIcon} />
                    <View style={styles.dateTextContainer}>
                      <Text style={[styles.dateValueText, !timeOut && styles.datePlaceholderText]}>
                        {timeOut ? formatHumanTime(timeOut) : '05:00 PM'}
                      </Text>
                      {timeOut ? <Text style={styles.dateIsoSubtext}>{timeOut}</Text> : null}
                    </View>
                    {createElement('input', {
                      type: 'time',
                      value: timeOut,
                      onChange: (e: any) => setTimeOut(e.target.value),
                      onClick: (e: any) => {
                        try { if (e.target && typeof e.target.showPicker === 'function') e.target.showPicker(); } catch (err) {}
                      },
                      style: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }
                    })}
                  </View>
                ) : (
                  <View style={styles.timeBox}>
                    <Feather name="clock" size={14} color={theme.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.inputField}
                      value={timeOut}
                      onChangeText={setTimeOut}
                      placeholder="17:00"
                      placeholderTextColor={theme.textMuted}
                    />
                  </View>
                )}
              </View>
            </View>

            {/* Section 3: Reason / Justification */}
            <View style={[styles.sectionHeader, { marginTop: 24 }]}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionTitle}>REASON & JUSTIFICATION</Text>
              <Text style={styles.requiredIndicator}>*Required</Text>
            </View>

            <View style={styles.textAreaWrapper}>
              <TextInput
                style={styles.textArea}
                value={reason}
                onChangeText={setReason}
                placeholder="Explain reason for missing or incorrect time logs (e.g. system glitch, official offsite duty)..."
                placeholderTextColor={theme.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <View style={styles.charCountRow}>
                <Text style={styles.charCountHint}>Provide detailed explanation for supervisor audit</Text>
                <Text style={styles.charCount}>{reason.length} chars</Text>
              </View>
            </View>

            {/* Section 4: Supporting Documents */}
            <View style={[styles.sectionHeader, { marginTop: 24 }]}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionTitle}>SUPPORTING DOCUMENTS (OPTIONAL)</Text>
            </View>

            <TouchableOpacity 
              style={styles.uploadBtn} 
              onPress={handlePickDocuments}
              activeOpacity={0.8}
            >
              <Feather name="upload-cloud" size={18} color={theme.primaryLight} />
              <Text style={styles.uploadBtnText}>Upload Verification Files or Photos</Text>
            </TouchableOpacity>

            {files.length > 0 && (
              <View style={styles.fileList}>
                {files.map((f, i) => (
                  <View key={i} style={styles.fileItem}>
                    <Feather name="file" size={14} color={theme.primaryLight} style={{ marginRight: 8 }} />
                    <Text style={styles.fileName} numberOfLines={1}>{f.name}</Text>
                    <TouchableOpacity onPress={() => removeFile(i)} style={styles.removeFileBtn} activeOpacity={0.7}>
                      <Feather name="x" size={14} color={theme.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

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
                    <Text style={styles.submitButtonText}>Submitting Modification...</Text>
                  </>
                ) : (
                  <>
                    <Feather name="send" size={16} color="#ffffff" style={{ marginRight: 8 }} />
                    <Text style={styles.submitButtonText}>Submit Modification Request</Text>
                  </>
                )}
              </LinearGradient>
            ) : (
              <View style={styles.disabledInner}>
                <Feather name="send" size={16} color={theme.textMuted} style={{ marginRight: 8 }} />
                <Text style={[styles.submitButtonText, { color: theme.textMuted }]}>
                  {isSubmitting ? 'Submitting...' : 'Submit Modification Request'}
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
  inputField: {
    flex: 1,
    color: theme.textPrimary,
    fontSize: 13,
    fontWeight: '500',
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
  timeBox: {
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
  timeBoxFilled: {
    borderColor: isDarkMode ? 'rgba(19, 157, 158, 0.4)' : '#cbd5e1',
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
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderWidth: 1,
    borderColor: isDarkMode ? 'rgba(19, 157, 158, 0.4)' : '#94a3b8',
    borderStyle: 'dashed',
    backgroundColor: theme.tealTint,
    borderRadius: 0,
  },
  uploadBtnText: {
    marginLeft: 8,
    color: theme.primaryLight,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.3,
  },
  fileList: {
    marginTop: 10,
    gap: 6,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.inputBg,
    borderRadius: 0,
  },
  fileName: {
    flex: 1,
    color: theme.textPrimary,
    fontSize: 12,
    fontWeight: '500',
  },
  removeFileBtn: {
    padding: 4,
    marginLeft: 8,
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
