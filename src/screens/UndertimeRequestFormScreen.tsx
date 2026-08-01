import React, { useState, createElement } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, TextInput
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

interface UndertimeRequestFormScreenProps {
  onBack: () => void;
  onSubmitSuccess: () => void;
  token?: string | null;
  employeeId?: number | null;
}

export default function UndertimeRequestFormScreen({ onBack, onSubmitSuccess, token, employeeId }: UndertimeRequestFormScreenProps) {
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
    
    setIsSubmitting(true);
    setErrorMsg(null);
    
    try {
      const url = Platform.OS === 'web' 
        ? 'http://localhost/atech_prime/backend/public/api/undertime-requests'
        : 'http://192.168.100.31/atech_prime/backend/public/api/undertime-requests';
        
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
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

  if (submitted) {
    return (
      <LinearGradient colors={['#020617', '#0f172a', '#020617']} style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onSubmitSuccess}>
            <Feather name="arrow-left" size={24} color="#f8fafc" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Undertime Request</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.successContainer}>
          <View style={styles.successIconWrapper}>
            <Feather name="check" size={48} color="#22c55e" />
          </View>
          <Text style={styles.successTitle}>Request Submitted</Text>
          <Text style={styles.successDesc}>Your undertime request has been sent to HR for approval.</Text>
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
      <View style={styles.glow1} />
      <View style={styles.glow2} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Feather name="arrow-left" size={24} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Undertime Request</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>DATE AND TIME</Text>
          
          {/* Date Input */}
          <View style={styles.dateInputWrapperFull}>
            <Text style={styles.label}>Date</Text>
            {Platform.OS === 'web' ? (
              <View style={[styles.inputContainer, { position: 'relative', paddingRight: 0 }]}>
                <Feather name="calendar" size={16} color="#64748b" style={styles.inputIcon} />
                <Text style={[styles.input, { paddingTop: 14 }]}>
                  {date || 'YYYY-MM-DD'}
                </Text>
                {createElement('input', {
                  type: 'date',
                  value: date,
                  onChange: (e: any) => handleDateChangePicker(null, new Date(e.target.value)),
                  onClick: (e: any) => {
                    try { if (e.target && typeof e.target.showPicker === 'function') e.target.showPicker(); } catch (err) {}
                  },
                  style: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }
                })}
              </View>
            ) : (
              <TouchableOpacity style={styles.inputContainer} onPress={() => setShowDatePicker(true)} activeOpacity={0.7}>
                <Feather name="calendar" size={16} color="#64748b" style={styles.inputIcon} />
                <Text style={[styles.input, { paddingTop: 14 }]}>{date || 'YYYY-MM-DD'}</Text>
              </TouchableOpacity>
            )}
            {showDatePicker && Platform.OS !== 'web' && (
              <DateTimePicker value={parseDateString(date)} mode="date" display="default" onChange={handleDateChangePicker} />
            )}
          </View>

          <View style={styles.dateRow}>
            {/* Start Time Input */}
            <View style={styles.dateInputWrapper}>
              <Text style={styles.label}>Start Time</Text>
              {Platform.OS === 'web' ? (
                <View style={[styles.inputContainer, { position: 'relative', paddingRight: 0 }]}>
                  <Feather name="clock" size={16} color="#64748b" style={styles.inputIcon} />
                  <Text style={[styles.input, { paddingTop: 14 }]}>
                    {startTime || 'HH:MM'}
                  </Text>
                  {createElement('input', {
                    type: 'time',
                    value: startTime,
                    onChange: (e: any) => setStartTime(e.target.value),
                    onClick: (e: any) => {
                      try { if (e.target && typeof e.target.showPicker === 'function') e.target.showPicker(); } catch (err) {}
                    },
                    style: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }
                  })}
                </View>
              ) : (
                <TouchableOpacity style={styles.inputContainer} onPress={() => setShowStartTimePicker(true)} activeOpacity={0.7}>
                  <Feather name="clock" size={16} color="#64748b" style={styles.inputIcon} />
                  <Text style={[styles.input, { paddingTop: 14 }]}>{startTime || 'HH:MM'}</Text>
                </TouchableOpacity>
              )}
              {showStartTimePicker && Platform.OS !== 'web' && (
                <DateTimePicker value={parseTimeString(startTime)} mode="time" display="default" onChange={(e: any, d?: Date) => handleTimeChangePicker(e, d, true)} />
              )}
            </View>

            {/* End Time Input */}
            <View style={styles.dateInputWrapper}>
              <Text style={styles.label}>End Time</Text>
              {Platform.OS === 'web' ? (
                <View style={[styles.inputContainer, { position: 'relative', paddingRight: 0 }]}>
                  <Feather name="clock" size={16} color="#64748b" style={styles.inputIcon} />
                  <Text style={[styles.input, { paddingTop: 14 }]}>
                    {endTime || 'HH:MM'}
                  </Text>
                  {createElement('input', {
                    type: 'time',
                    value: endTime,
                    onChange: (e: any) => setEndTime(e.target.value),
                    onClick: (e: any) => {
                      try { if (e.target && typeof e.target.showPicker === 'function') e.target.showPicker(); } catch (err) {}
                    },
                    style: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }
                  })}
                </View>
              ) : (
                <TouchableOpacity style={styles.inputContainer} onPress={() => setShowEndTimePicker(true)} activeOpacity={0.7}>
                  <Feather name="clock" size={16} color="#64748b" style={styles.inputIcon} />
                  <Text style={[styles.input, { paddingTop: 14 }]}>{endTime || 'HH:MM'}</Text>
                </TouchableOpacity>
              )}
              {showEndTimePicker && Platform.OS !== 'web' && (
                <DateTimePicker value={parseTimeString(endTime)} mode="time" display="default" onChange={(e: any, d?: Date) => handleTimeChangePicker(e, d, false)} />
              )}
            </View>
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>REASON</Text>
          <View style={[styles.inputContainer, styles.textAreaContainer]}>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Provide details about your undertime request..."
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
            (!date || !startTime || !endTime || !reason || isSubmitting) && styles.submitButtonDisabled
          ]} 
          onPress={handleSubmit}
          disabled={!date || !startTime || !endTime || !reason || isSubmitting}
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
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderRadius: 150,
    transform: [{ scale: 2 }],
  },
  glow2: {
    position: 'absolute',
    bottom: -100,
    right: -100,
    width: 300,
    height: 300,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
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
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateInputWrapper: {
    width: '48%',
  },
  dateInputWrapperFull: {
    width: '100%',
    marginBottom: 16,
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
    backgroundColor: '#38bdf8',
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
    color: '#020617',
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
