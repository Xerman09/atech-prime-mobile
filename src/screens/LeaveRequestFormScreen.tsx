import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, TextInput, Alert, createElement
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

interface LeaveRequestFormScreenProps {
  onBack: () => void;
  onSubmitSuccess: () => void;
  token?: string | null;
  employeeId?: number | null;
}

export default function LeaveRequestFormScreen({ onBack, onSubmitSuccess, token, employeeId }: LeaveRequestFormScreenProps) {
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

  const handleDateChange = (text: string, setDate: (date: string) => void) => {
    let cleaned = text.replace(/\D/g, '');
    let formatted = '';
    
    if (cleaned.length > 0) {
      formatted = cleaned.substring(0, 4);
    }
    if (cleaned.length > 4) {
      formatted += '-' + cleaned.substring(4, 6);
    }
    if (cleaned.length > 6) {
      formatted += '-' + cleaned.substring(6, 8);
    }
    setDate(formatted);
  };

  const handleDateChangePicker = (event: any, selectedDate: Date | undefined, isStart: boolean) => {
    if (Platform.OS !== 'ios') {
      if (isStart) setShowStartPicker(false);
      else setShowEndPicker(false);
    }
    
    if (selectedDate) {
      // Create local date string YYYY-MM-DD
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const formatted = `${year}-${month}-${day}`;
      
      if (isStart) setStartDate(formatted);
      else setEndDate(formatted);
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
    
    setIsSubmitting(true);
    setErrorMsg(null);
    
    try {
      const url = Platform.OS === 'web' 
        ? 'http://localhost/atech_prime/backend/public/api/leave-requests'
        : 'http://192.168.100.31/atech_prime/backend/public/api/leave-requests';
        
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
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

  if (submitted) {
    return (
      <LinearGradient colors={['#020617', '#0f172a', '#020617']} style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onSubmitSuccess}>
            <Feather name="arrow-left" size={24} color="#f8fafc" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Leave Request</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.successContainer}>
          <View style={styles.successIconWrapper}>
            <Feather name="check" size={48} color="#22c55e" />
          </View>
          <Text style={styles.successTitle}>Request Submitted</Text>
          <Text style={styles.successDesc}>Your leave request has been sent to HR for approval.</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={onSubmitSuccess}>
            <Text style={styles.primaryButtonText}>Return to History</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#020617', '#0f172a', '#020617']} style={styles.container}>
      <StatusBar style="light" />
      
      {/* Decorative Background Elements */}
      <View style={styles.glow1} />
      <View style={styles.glow2} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Feather name="arrow-left" size={24} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Leave Request</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>LEAVE TYPE</Text>
          <View style={styles.typeGrid}>
            {['Vacation', 'Sick Leave', 'Emergency'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeButton,
                  leaveType === type && styles.typeButtonActive
                ]}
                onPress={() => setLeaveType(type)}
              >
                <Text 
                  style={[
                    styles.typeButtonText,
                    leaveType === type && styles.typeButtonTextActive
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>DURATION</Text>
          <View style={styles.dateRow}>
            <View style={styles.dateInputWrapper}>
              <Text style={styles.label}>Start Date</Text>
              
              {Platform.OS === 'web' ? (
                <View style={[styles.inputContainer, { position: 'relative', paddingRight: 0 }]}>
                  <Feather name="calendar" size={16} color="#64748b" style={styles.inputIcon} />
                  <Text style={[styles.input, { paddingTop: 14 }]}>
                    {startDate || 'YYYY-MM-DD'}
                  </Text>
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
                  style={styles.inputContainer} 
                  onPress={() => setShowStartPicker(true)}
                  activeOpacity={0.7}
                >
                  <Feather name="calendar" size={16} color="#64748b" style={styles.inputIcon} />
                  <Text style={[styles.input, { paddingTop: 14 }]}>
                    {startDate || 'YYYY-MM-DD'}
                  </Text>
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
            <View style={styles.dateInputWrapper}>
              <Text style={styles.label}>End Date</Text>

              {Platform.OS === 'web' ? (
                <View style={[styles.inputContainer, { position: 'relative', paddingRight: 0 }]}>
                  <Feather name="calendar" size={16} color="#64748b" style={styles.inputIcon} />
                  <Text style={[styles.input, { paddingTop: 14 }]}>
                    {endDate || 'YYYY-MM-DD'}
                  </Text>
                  {createElement('input', {
                    type: 'date',
                    value: endDate,
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
                  style={styles.inputContainer} 
                  onPress={() => setShowEndPicker(true)}
                  activeOpacity={0.7}
                >
                  <Feather name="calendar" size={16} color="#64748b" style={styles.inputIcon} />
                  <Text style={[styles.input, { paddingTop: 14 }]}>
                    {endDate || 'YYYY-MM-DD'}
                  </Text>
                </TouchableOpacity>
              )}

              {showEndPicker && Platform.OS !== 'web' && (
                <DateTimePicker
                  value={parseDateString(endDate)}
                  mode="date"
                  display="default"
                  onChange={(e: any, d?: Date) => handleDateChangePicker(e, d, false)}
                />
              )}

            </View>
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>REASON</Text>
          <View style={[styles.inputContainer, styles.textAreaContainer]}>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Provide details about your leave..."
              placeholderTextColor="#475569"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={reason}
              onChangeText={setReason}
            />
          </View>
        </View>

        {errorMsg && (
          <View style={styles.errorContainer}>
            <Feather name="alert-circle" size={16} color="#ef4444" style={{ marginRight: 8 }} />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        <TouchableOpacity 
          style={[
            styles.submitButton, 
            (!startDate || !endDate || !reason || isSubmitting) && styles.submitButtonDisabled
          ]} 
          onPress={handleSubmit}
          disabled={!startDate || !endDate || !reason || isSubmitting}
        >
          {isSubmitting ? (
            <Text style={styles.submitButtonText}>Submitting...</Text>
          ) : (
            <>
              <Feather name="send" size={18} color="#f8fafc" style={{ marginRight: 8 }} />
              <Text style={styles.submitButtonText}>Submit Request</Text>
            </>
          )}
        </TouchableOpacity>

      </ScrollView>
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
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderRadius: 150,
    transform: [{ scale: 2 }],
  },
  glow2: {
    position: 'absolute',
    bottom: -100,
    right: -100,
    width: 300,
    height: 300,
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
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
    borderBottomColor: 'rgba(51, 65, 85, 0.5)',
    backgroundColor: 'rgba(2, 6, 23, 0.5)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#f8fafc',
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
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
    borderRadius: 0,
    padding: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#64748b',
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
    borderColor: 'rgba(51, 65, 85, 0.5)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 0,
    marginBottom: 8,
  },
  typeButtonActive: {
    borderColor: '#a855f7',
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
  },
  typeButtonText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: '#a855f7',
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
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
    backgroundColor: 'rgba(2, 6, 23, 0.5)',
    borderRadius: 0,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#f8fafc',
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
    backgroundColor: '#a855f7',
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
    color: '#f8fafc',
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
    borderColor: '#22c55e',
  },
  successTitle: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  successDesc: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  primaryButton: {
    backgroundColor: '#38bdf8',
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
    borderColor: '#ef4444',
    padding: 12,
    marginBottom: 24,
  },
  errorText: {
    color: '#f8fafc',
    fontSize: 13,
    flex: 1,
  },
});
