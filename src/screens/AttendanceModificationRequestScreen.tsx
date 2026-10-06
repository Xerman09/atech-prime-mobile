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

  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr === '0000-00-00') return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const handleOpenAttachment = (path: string) => {
    let baseUrl = `http://192.168.100.31/atech_prime/backend/public/`;
    if (Platform.OS === 'web') baseUrl = `http://${window.location.hostname}/atech_prime/backend/public/`;
    Linking.openURL(baseUrl + path);
  };

  return (
    <View style={styles.container}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <LinearGradient colors={theme.backgroundGradient as any} style={StyleSheet.absoluteFillObject} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Feather name="arrow-left" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Modification Requests</Text>
        <TouchableOpacity style={styles.addBtn} onPress={onNavigateToForm}>
          <Feather name="plus" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={styles.centerText}>Loading requests...</Text>
          </View>
        ) : requests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Feather name="edit-3" size={28} color={theme.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No modification requests</Text>
            <Text style={styles.emptySubtitle}>Tap the '+' button above to submit an attendance adjustment.</Text>
          </View>
        ) : (
          requests.map((req) => {
            const statusColor = getStatusColor(req.status);
            return (
              <View key={req.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[styles.dateDot, { backgroundColor: statusColor }]} />
                    <Text style={styles.dateText}>{formatDate(req.date)}</Text>
                  </View>
                  <View style={[styles.statusBadge, { borderColor: statusColor + '60', backgroundColor: statusColor + '15' }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>{req.status}</Text>
                  </View>
                </View>
                
                <View style={styles.timesContainer}>
                  <View style={styles.timeBlock}>
                    <Text style={styles.timeLabel}>REQ. TIME IN</Text>
                    <Text style={[styles.timeValue, !req.requested_time_in && { color: theme.textMuted }]}>
                      {req.requested_time_in || '--:--'}
                    </Text>
                  </View>
                  <View style={styles.timeSep} />
                  <View style={styles.timeBlock}>
                    <Text style={styles.timeLabel}>REQ. TIME OUT</Text>
                    <Text style={[styles.timeValue, !req.requested_time_out && { color: theme.textMuted }]}>
                      {req.requested_time_out || '--:--'}
                    </Text>
                  </View>
                </View>

                {req.reason ? (
                  <View style={styles.reasonBox}>
                    <Text style={styles.reasonLabel}>REASON</Text>
                    <Text style={styles.reasonText}>{req.reason}</Text>
                  </View>
                ) : null}

                {req.attachments && req.attachments.length > 0 && (
                  <View style={styles.attachmentsContainer}>
                    <Text style={styles.attachmentTitle}>ATTACHMENTS</Text>
                    {req.attachments.map((att: any, idx: number) => (
                      <TouchableOpacity key={idx} style={styles.attachmentLink} onPress={() => handleOpenAttachment(att.file_path)}>
                        <Feather name="paperclip" size={12} color={theme.primary} style={{ marginRight: 6 }} />
                        <Text style={styles.attachmentLinkText} numberOfLines={1}>{att.file_name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            );
          })
        )}
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
  addBtn: {
    padding: 8, backgroundColor: theme.primary, borderRadius: 0, alignItems: 'center', justifyContent: 'center'
  },
  headerTitle: { color: theme.textPrimary, fontSize: 17, fontWeight: '700' },
  scrollContent: { padding: 20 },
  centerBox: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  centerText: { marginTop: 12, color: theme.textMuted, fontSize: 13 },
  emptyContainer: {
    padding: 40, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: theme.border, backgroundColor: theme.cardBg, borderRadius: 0, marginTop: 20
  },
  emptyIcon: { width: 56, height: 56, backgroundColor: theme.tealTint, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { color: theme.textPrimary, fontSize: 15, fontWeight: '600', marginBottom: 6 },
  emptySubtitle: { color: theme.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 18 },
  card: {
    backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border,
    padding: 16, marginBottom: 12, borderRadius: 0
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: theme.border },
  dateDot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
  dateText: { fontSize: 14, fontWeight: '700', color: theme.textPrimary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderRadius: 0 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  timesContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  timeBlock: { flex: 1 },
  timeSep: { width: 1, height: 28, backgroundColor: theme.border, marginHorizontal: 16 },
  timeLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, color: theme.textMuted, marginBottom: 4 },
  timeValue: { fontSize: 17, fontWeight: '600', color: theme.textPrimary },
  reasonBox: { backgroundColor: theme.tealTint, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: theme.border },
  reasonLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, color: theme.textMuted, marginBottom: 2 },
  reasonText: { fontSize: 13, color: theme.textSecondary, lineHeight: 18 },
  attachmentsContainer: { marginTop: 6, paddingTop: 8, borderTopWidth: 1, borderTopColor: theme.border },
  attachmentTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, color: theme.textMuted, marginBottom: 6 },
  attachmentLink: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  attachmentLinkText: { color: theme.primary, fontSize: 12, fontWeight: '600', textDecorationLine: 'underline' }
});
