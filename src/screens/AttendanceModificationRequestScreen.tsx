import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, ActivityIndicator, Linking
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

interface AttendanceModificationRequestScreenProps {
  token: string | null;
  onBack: () => void;
  onNavigateToForm: () => void;
}

export default function AttendanceModificationRequestScreen({ token, onBack, onNavigateToForm }: AttendanceModificationRequestScreenProps) {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      if (!token) return;
      try {
        let apiUrl = `http://192.168.100.31/atech_prime/backend/public/api/attendance/my-modification-requests`;
        if (Platform.OS === 'web') apiUrl = `http://${window.location.hostname}/atech_prime/backend/public/api/attendance/my-modification-requests`;
          
        const response = await fetch(apiUrl, {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          cache: 'no-store'
        });
        
        if (response.ok) {
          const data = await response.json();
          setRequests(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, [token]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return theme.success;
      case 'Rejected': return theme.error;
      default: return theme.warning;
    }
  };

  const handleOpenAttachment = (path: string) => {
    let baseUrl = `http://192.168.100.31/atech_prime/backend/public/`;
    if (Platform.OS === 'web') baseUrl = `http://${window.location.hostname}/atech_prime/backend/public/`;
    Linking.openURL(baseUrl + path);
  };

  return (
    <LinearGradient colors={theme.backgroundGradient as any} style={styles.container}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <View style={styles.glow1} />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Feather name="arrow-left" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Modification Requests</Text>
        <TouchableOpacity style={styles.addButton} onPress={onNavigateToForm}>
          <Feather name="plus" size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
        ) : requests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="edit-3" size={48} color={theme.textSecondary} style={{ marginBottom: 16, opacity: 0.5 }} />
            <Text style={{ color: theme.textSecondary }}>No modification requests found.</Text>
          </View>
        ) : (
          requests.map((req) => (
            <View key={req.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.dateText}>{req.date}</Text>
                <View style={[styles.statusBadge, { borderColor: getStatusColor(req.status) }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(req.status) }]}>{req.status}</Text>
                </View>
              </View>
              
              <View style={styles.timesContainer}>
                <View style={styles.timeBlock}>
                  <Text style={styles.timeLabel}>Req. Time In</Text>
                  <Text style={styles.timeValue}>{req.requested_time_in || '--:--'}</Text>
                </View>
                <View style={styles.timeBlock}>
                  <Text style={styles.timeLabel}>Req. Time Out</Text>
                  <Text style={styles.timeValue}>{req.requested_time_out || '--:--'}</Text>
                </View>
              </View>

              <Text style={styles.reasonText}>{req.reason || 'No reason provided.'}</Text>

              {req.attachments && req.attachments.length > 0 && (
                <View style={styles.attachmentsContainer}>
                  <Text style={styles.attachmentTitle}>Attachments:</Text>
                  {req.attachments.map((att: any, idx: number) => (
                    <TouchableOpacity key={idx} onPress={() => handleOpenAttachment(att.file_path)}>
                      <Text style={styles.attachmentLink}>{att.file_name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ))
        )}
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
  addButton: {
    width: 40, height: 40, borderRadius: 0, backgroundColor: theme.surface,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.primary,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: theme.textPrimary },
  scrollContent: { padding: 20, paddingBottom: 40 },
  emptyContainer: { padding: 40, alignItems: 'center', borderWidth: 1, borderColor: theme.border, borderRadius: 0 },
  card: {
    backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border,
    padding: 16, marginBottom: 16, borderRadius: 0
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  dateText: { fontSize: 16, fontWeight: '700', color: theme.textPrimary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderRadius: 0 },
  statusText: { fontSize: 12, fontWeight: '700' },
  timesContainer: { flexDirection: 'row', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.border, paddingBottom: 12 },
  timeBlock: { flex: 1 },
  timeLabel: { fontSize: 12, color: theme.textSecondary, marginBottom: 4 },
  timeValue: { fontSize: 16, fontWeight: '700', color: theme.textPrimary },
  reasonText: { fontSize: 14, color: theme.textSecondary, fontStyle: 'italic', marginBottom: 12 },
  attachmentsContainer: { marginTop: 8 },
  attachmentTitle: { fontSize: 12, fontWeight: '700', color: theme.textPrimary, marginBottom: 4 },
  attachmentLink: { color: theme.primary, fontSize: 14, textDecorationLine: 'underline', marginBottom: 4 }
});
