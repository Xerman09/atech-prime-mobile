import React, { useState, createElement } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, 
  TextInput, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '../theme/ThemeContext';

interface AttendanceModificationFormScreenProps {
  token: string | null;
  initialDate?: string;
  onBack: () => void;
  onSubmitSuccess: () => void;
}

export default function AttendanceModificationFormScreen({ token, initialDate, onBack, onSubmitSuccess }: AttendanceModificationFormScreenProps) {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);
  
  const [date, setDate] = useState(initialDate || '');
  const [timeIn, setTimeIn] = useState('');
  const [timeOut, setTimeOut] = useState('');
  const [reason, setReason] = useState('');
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
    if (!date) {
      setErrorMsg('Attendance date is required (YYYY-MM-DD)');
      return;
    }
    if (!timeIn && !timeOut) {
      setErrorMsg('Please specify either Requested Time In or Requested Time Out');
      return;
    }
    
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('date', date);
      formData.append('requested_time_in', timeIn);
      formData.append('requested_time_out', timeOut);
      formData.append('reason', reason);

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

      let apiUrl = `http://192.168.100.31/atech_prime/backend/public/api/attendance/modification-requests`;
      if (Platform.OS === 'web') apiUrl = `http://${window.location.hostname}/atech_prime/backend/public/api/attendance/modification-requests`;
        
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to submit modification request');
      
      onSubmitSuccess();
    } catch (error: any) {
      setErrorMsg(error.message || 'Failed to submit modification request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <LinearGradient colors={theme.backgroundGradient as any} style={StyleSheet.absoluteFillObject} />

      {/* Signature Top Gradient Strip */}
      <LinearGradient
        colors={theme.accentGradient as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.signatureStrip}
      />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Feather name="arrow-left" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>New Modification Request</Text>
          <Text style={styles.headerSubtitle}>Submit attendance adjustment</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          {/* Subtle Top Accent */}
          <LinearGradient
            colors={theme.accentGradient as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cardTopStrip}
          />

          {errorMsg ? (
            <View style={styles.errorBox}>
              <Feather name="alert-circle" size={16} color={theme.rose} style={{ marginRight: 8, marginTop: 1 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.errorTitle}>Validation Error</Text>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            </View>
          ) : null}

          <Text style={styles.label}>ATTENDANCE DATE (YYYY-MM-DD)</Text>
          {Platform.OS === 'web' ? (
            <View style={{ position: 'relative' }}>
              <TextInput
                style={styles.input}
                value={date}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.textMuted}
                editable={false}
              />
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
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.textMuted}
            />
          )}

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.label}>REQUESTED TIME IN</Text>
              {Platform.OS === 'web' ? (
                <View style={{ position: 'relative' }}>
                  <TextInput
                    style={styles.input}
                    value={timeIn}
                    placeholder="08:00"
                    placeholderTextColor={theme.textMuted}
                    editable={false}
                  />
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
                <TextInput
                  style={styles.input}
                  value={timeIn}
                  onChangeText={setTimeIn}
                  placeholder="08:00"
                  placeholderTextColor={theme.textMuted}
                />
              )}
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.label}>REQUESTED TIME OUT</Text>
              {Platform.OS === 'web' ? (
                <View style={{ position: 'relative' }}>
                  <TextInput
                    style={styles.input}
                    value={timeOut}
                    placeholder="17:00"
                    placeholderTextColor={theme.textMuted}
                    editable={false}
                  />
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
                <TextInput
                  style={styles.input}
                  value={timeOut}
                  onChangeText={setTimeOut}
                  placeholder="17:00"
                  placeholderTextColor={theme.textMuted}
                />
              )}
            </View>
          </View>

          <Text style={styles.label}>REASON / JUSTIFICATION</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={reason}
            onChangeText={setReason}
            placeholder="Explain why this adjustment is being requested..."
            placeholderTextColor={theme.textMuted}
            multiline
            numberOfLines={4}
          />

          <Text style={styles.label}>SUPPORTING DOCUMENTS (OPTIONAL)</Text>
          <TouchableOpacity style={styles.uploadBtn} onPress={handlePickDocuments}>
            <Feather name="upload-cloud" size={18} color={theme.royalBlue} />
            <Text style={styles.uploadBtnText}>Upload Files / Photos</Text>
          </TouchableOpacity>

          {files.length > 0 && (
            <View style={styles.fileList}>
              {files.map((f, i) => (
                <View key={i} style={styles.fileItem}>
                  <Feather name="file" size={14} color={theme.royalBlue} style={{ marginRight: 8 }} />
                  <Text style={styles.fileName} numberOfLines={1}>{f.name}</Text>
                  <TouchableOpacity onPress={() => removeFile(i)} style={{ padding: 4 }}>
                    <Feather name="x" size={16} color={theme.rose} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity 
            style={[styles.submitBtn, loading && { opacity: 0.7 }]} 
            onPress={handleSubmit} 
            disabled={loading}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={['#10b981', '#08697A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitBtnGradient}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.submitBtnRow}>
                  <Feather name="send" size={16} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={styles.submitBtnText}>SUBMIT REQUEST</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1 },
  signatureStrip: { height: 3, width: '100%' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 30, paddingHorizontal: 20, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: theme.border,
  },
  backBtn: { padding: 8, backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border },
  headerTitleWrap: { flex: 1, marginHorizontal: 12 },
  headerTitle: { color: theme.textPrimary, fontSize: 16, fontWeight: '700' },
  headerSubtitle: { color: theme.textMuted, fontSize: 11 },
  scrollContent: { padding: 20 },
  formCard: {
    backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border,
    padding: 20, position: 'relative', overflow: 'hidden',
  },
  cardTopStrip: { position: 'absolute', top: 0, left: 0, right: 0, height: 3 },
  errorBox: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: theme.roseTint,
    borderLeftWidth: 4, borderLeftColor: theme.rose, borderWidth: 1, borderColor: 'rgba(244, 63, 94, 0.3)',
    padding: 12, marginBottom: 16,
  },
  errorTitle: { color: theme.rose, fontSize: 11, fontWeight: '800', letterSpacing: 0.5, marginBottom: 2 },
  errorText: { color: theme.textPrimary, fontSize: 12, lineHeight: 16 },
  row: { flexDirection: 'row' },
  label: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, color: theme.textMuted, marginBottom: 8, marginTop: 16 },
  input: {
    borderWidth: 1, borderColor: theme.border, backgroundColor: theme.inputBg,
    color: theme.textPrimary, padding: 12, fontSize: 14,
  },
  textArea: { height: 95, textAlignVertical: 'top' },
  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 12, borderWidth: 1, borderColor: theme.royalBlue, borderStyle: 'dashed',
    backgroundColor: theme.blueTint,
  },
  uploadBtnText: { marginLeft: 8, color: theme.royalBlue, fontWeight: '700', fontSize: 13 },
  fileList: { marginTop: 10 },
  fileItem: {
    flexDirection: 'row', alignItems: 'center', padding: 10,
    borderWidth: 1, borderColor: theme.border, backgroundColor: theme.inputBg,
    marginBottom: 6,
  },
  fileName: { flex: 1, color: theme.textPrimary, fontSize: 13 },
  submitBtn: { marginTop: 24, overflow: 'hidden' },
  submitBtnGradient: { paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  submitBtnRow: { flexDirection: 'row', alignItems: 'center' },
  submitBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 13, letterSpacing: 1 },
});
