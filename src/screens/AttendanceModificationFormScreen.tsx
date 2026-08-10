import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, 
  TextInput, ActivityIndicator, createElement
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
    if (!date) { alert('Date is required (YYYY-MM-DD)'); return; }
    if (!timeIn && !timeOut) { alert('Provide either Time In or Time Out (HH:MM)'); return; }
    
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('date', date);
      formData.append('requested_time_in', timeIn);
      formData.append('requested_time_out', timeOut);
      formData.append('reason', reason);

      files.forEach((file, index) => {
        if (Platform.OS === 'web') {
          // File object for web
          formData.append('attachments[]', file.file);
        } else {
          // For native
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
      if (!response.ok) throw new Error(data.error || 'Failed to submit');
      
      onSubmitSuccess();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={theme.backgroundGradient as any} style={styles.container}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <View style={styles.glow1} />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Feather name="arrow-left" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Modification</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.formCard}>
          
          <Text style={styles.label}>DATE (YYYY-MM-DD)</Text>
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
              placeholder="e.g. 2026-08-01"
              placeholderTextColor={theme.textMuted}
            />
          )}

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.label}>TIME IN (HH:MM 24h)</Text>
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
              <Text style={styles.label}>TIME OUT (HH:MM 24h)</Text>
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
            placeholder="Explain why you are modifying your time..."
            placeholderTextColor={theme.textMuted}
            multiline
            numberOfLines={4}
          />

          <Text style={styles.label}>ATTACHMENTS</Text>
          <TouchableOpacity style={styles.uploadButton} onPress={handlePickDocuments}>
            <Feather name="upload-cloud" size={20} color={theme.primary} />
            <Text style={styles.uploadText}>Select Files</Text>
          </TouchableOpacity>

          {files.length > 0 && (
            <View style={styles.fileList}>
              {files.map((f, i) => (
                <View key={i} style={styles.fileItem}>
                  <Text style={styles.fileName} numberOfLines={1}>{f.name}</Text>
                  <TouchableOpacity onPress={() => removeFile(i)}>
                    <Feather name="x" size={16} color={theme.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>SUBMIT REQUEST</Text>}
          </TouchableOpacity>
          
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1 },
  glow1: {
    position: 'absolute', top: -100, right: -100, width: 300, height: 300,
    borderRadius: 150, backgroundColor: theme.primary, opacity: 0.1,
    ...Platform.select({ web: { filter: 'blur(60px)' } })
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingHorizontal: 20, paddingBottom: 20, zIndex: 10,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 0, backgroundColor: theme.surface,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: theme.textPrimary },
  scrollContent: { padding: 20, paddingBottom: 40 },
  formCard: {
    backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border,
    padding: 20, borderRadius: 0
  },
  row: { flexDirection: 'row' },
  label: { fontSize: 12, fontWeight: '700', color: theme.textSecondary, marginBottom: 8, marginTop: 16 },
  input: {
    borderWidth: 1, borderColor: theme.border, backgroundColor: theme.background,
    color: theme.textPrimary, padding: 12, fontSize: 16, borderRadius: 0
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  uploadButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 12, borderWidth: 1, borderColor: theme.primary, borderStyle: 'dashed',
    borderRadius: 0, marginTop: 8
  },
  uploadText: { marginLeft: 8, color: theme.primary, fontWeight: '600' },
  fileList: { marginTop: 12 },
  fileItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 12, borderWidth: 1, borderColor: theme.border, marginBottom: 8, borderRadius: 0
  },
  fileName: { flex: 1, color: theme.textPrimary, marginRight: 12 },
  submitButton: {
    backgroundColor: theme.primary, padding: 16, alignItems: 'center',
    marginTop: 24, borderRadius: 0
  },
  submitButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 16 }
});
