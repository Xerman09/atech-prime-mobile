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
      setErrorMsg('Date is required (YYYY-MM-DD)');
      return;
    }
    if (!timeIn && !timeOut) {
      setErrorMsg('Please provide either Requested Time In or Time Out');
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
      if (!response.ok) throw new Error(data.error || 'Failed to submit request');
      
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

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Feather name="arrow-left" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Modification Request</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          {/* Top subtle accent */}
          <LinearGradient
            colors={theme.primaryGradient as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cardTopStrip}
          />

          {errorMsg ? (
            <View style={styles.errorBox}>
              <Feather name="alert-circle" size={16} color={theme.error} style={{ marginRight: 8 }} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          <Text style={styles.label}>ATTENDANCE DATE</Text>
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
              <Text style={styles.label}>TIME IN (HH:MM)</Text>
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
              <Text style={styles.label}>TIME OUT (HH:MM)</Text>
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
            placeholder="Explain reason for modification..."
            placeholderTextColor={theme.textMuted}
            multiline
            numberOfLines={4}
          />

          <Text style={styles.label}>ATTACHMENTS (OPTIONAL)</Text>
          <TouchableOpacity style={styles.uploadBtn} onPress={handlePickDocuments}>
            <Feather name="upload-cloud" size={18} color={theme.primary} />
            <Text style={styles.uploadBtnText}>Select Files</Text>
          </TouchableOpacity>

          {files.length > 0 && (
            <View style={styles.fileList}>
              {files.map((f, i) => (
                <View key={i} style={styles.fileItem}>
                  <Feather name="file" size={14} color={theme.textMuted} style={{ marginRight: 8 }} />
                  <Text style={styles.fileName} numberOfLines={1}>{f.name}</Text>
                  <TouchableOpacity onPress={() => removeFile(i)} style={{ padding: 4 }}>
                    <Feather name="x" size={16} color={theme.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity 
            style={[styles.submitBtn, loading && { opacity: 0.7 }]} 
            onPress={handleSubmit} 
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>SUBMIT REQUEST</Text>
            )}
          </TouchableOpacity>
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 56 : 36, paddingHorizontal: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: theme.border,
  },
  backBtn: {
    padding: 8, backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border, borderRadius: 0
  },
  headerTitle: { color: theme.textPrimary, fontSize: 17, fontWeight: '700' },
  scrollContent: { padding: 20 },
  formCard: {
    backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border,
    padding: 20, borderRadius: 0, position: 'relative', overflow: 'hidden'
  },
  cardTopStrip: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 3
  },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: theme.redTint,
    borderWidth: 1, borderColor: theme.error, padding: 12, marginBottom: 16, borderRadius: 0
  },
  errorText: { color: theme.error, fontSize: 13, flex: 1 },
  row: { flexDirection: 'row' },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, color: theme.textMuted, marginBottom: 8, marginTop: 16 },
  input: {
    borderWidth: 1, borderColor: theme.border, backgroundColor: theme.inputBg,
    color: theme.textPrimary, padding: 12, fontSize: 14, borderRadius: 0
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 12, borderWidth: 1, borderColor: theme.primary, borderStyle: 'dashed',
    borderRadius: 0, backgroundColor: theme.tealTint
  },
  uploadBtnText: { marginLeft: 8, color: theme.primary, fontWeight: '600', fontSize: 13 },
  fileList: { marginTop: 10 },
  fileItem: {
    flexDirection: 'row', alignItems: 'center', padding: 10,
    borderWidth: 1, borderColor: theme.border, backgroundColor: theme.inputBg,
    marginBottom: 6, borderRadius: 0
  },
  fileName: { flex: 1, color: theme.textPrimary, fontSize: 13 },
  submitBtn: {
    backgroundColor: theme.primary, padding: 14, alignItems: 'center',
    marginTop: 24, borderRadius: 0
  },
  submitBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 14, letterSpacing: 1 }
});
