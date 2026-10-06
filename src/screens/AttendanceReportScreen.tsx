import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

interface AttendanceReportScreenProps {
  token: string | null;
  onBack: () => void;
  onNavigateToModificationRequests: () => void;
  onNavigateToForm: (date: string) => void;
}

interface AttendanceRecord {
  date: string;
  timeIn: string | null;
  timeOut: string | null;
}

export default function AttendanceReportScreen({ token, onBack, onNavigateToModificationRequests, onNavigateToForm }: AttendanceReportScreenProps) {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);
  const [logs, setLogs] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      if (!token) { setLoading(false); return; }
      try {
        let url = `http://192.168.100.31/atech_prime/backend/public/api/attendance/my-logs/history`;
        if (Platform.OS === 'web') url = `http://${window.location.hostname}/atech_prime/backend/public/api/attendance/my-logs/history`;
        const res = await fetch(url, { cache: 'no-store', headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` } });
        if (res.ok) { const d = await res.json(); setLogs(Array.isArray(d) ? d : []); }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetchLogs();
  }, [token]);

  const formatDate = (ds: string) => {
    const d = new Date(ds);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatus = (timeIn: string | null, timeOut: string | null) => {
    if (timeIn && timeOut) return { text: 'Complete', color: theme.success };
    if (timeIn && !timeOut) return { text: 'No Out', color: theme.warning };
    if (!timeIn && timeOut) return { text: 'No In', color: theme.warning };
    return { text: 'Absent', color: theme.error };
  };

  return (
    <View style={styles.container}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <LinearGradient colors={theme.backgroundGradient as any} style={StyleSheet.absoluteFillObject} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Feather name="arrow-left" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Attendance History</Text>
        <TouchableOpacity style={styles.filterBtn} onPress={onNavigateToModificationRequests}>
          <Feather name="list" size={18} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.subheader}>
        <Feather name="calendar" size={13} color={theme.textMuted} style={{ marginRight: 6 }} />
        <Text style={styles.subheaderText}>Showing last 30 days</Text>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Loading records...</Text>
        </View>
      ) : logs.length === 0 ? (
        <View style={styles.centerBox}>
          <View style={styles.emptyIcon}><Feather name="calendar" size={32} color={theme.textMuted} /></View>
          <Text style={styles.emptyTitle}>No records found</Text>
          <Text style={styles.emptySubtitle}>Attendance logs will appear here once available.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          {logs.map((record, idx) => {
            const status = getStatus(record.timeIn, record.timeOut);
            return (
              <View key={idx} style={styles.logCard}>
                <View style={styles.logCardHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={styles.logDateDot} />
                    <Text style={styles.logDate}>{formatDate(record.date)}</Text>
                  </View>
                  <View style={styles.logRight}>
                    <View style={[styles.statusBadge, { borderColor: status.color + '50', backgroundColor: status.color + '12' }]}>
                      <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
                    </View>
                    <TouchableOpacity style={styles.editBtn} onPress={() => onNavigateToForm(record.date)}>
                      <Feather name="edit-3" size={14} color={theme.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.timeRow}>
                  <View style={styles.timeBlock}>
                    <Text style={styles.timeBlockLabel}>TIME IN</Text>
                    <Text style={[styles.timeBlockValue, !record.timeIn && { color: theme.textMuted }]}>
                      {record.timeIn || '--:--'}
                    </Text>
                  </View>
                  <View style={styles.timeSep} />
                  <View style={styles.timeBlock}>
                    <Text style={styles.timeBlockLabel}>TIME OUT</Text>
                    <Text style={[styles.timeBlockValue, !record.timeOut && { color: theme.textMuted }]}>
                      {record.timeOut || '--:--'}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </View>
  );
}

const getStyles = (theme: any, isDarkMode: boolean) => StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 56 : 36, paddingHorizontal: 20, paddingBottom: 12,
  },
  backBtn: { padding: 8, backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border, borderRadius: 0 },
  headerTitle: { color: theme.textPrimary, fontSize: 17, fontWeight: '700' },
  filterBtn: { padding: 8, backgroundColor: theme.tealTint, borderWidth: 1, borderColor: theme.border, borderRadius: 0 },
  subheader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: theme.border },
  subheaderText: { color: theme.textMuted, fontSize: 13 },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  loadingText: { color: theme.textMuted, fontSize: 14, marginTop: 12 },
  emptyIcon: { width: 64, height: 64, backgroundColor: theme.tealTint, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderRadius: 0 },
  emptyTitle: { color: theme.textPrimary, fontSize: 16, fontWeight: '600', marginBottom: 6 },
  emptySubtitle: { color: theme.textMuted, fontSize: 13, textAlign: 'center' },
  body: { padding: 20 },
  logCard: { backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border, borderRadius: 0, marginBottom: 12 },
  logCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: theme.border },
  logDateDot: { width: 6, height: 6, backgroundColor: theme.primary, borderRadius: 3, marginRight: 10 },
  logDate: { color: theme.textPrimary, fontSize: 14, fontWeight: '600' },
  logRight: { flexDirection: 'row', alignItems: 'center' },
  statusBadge: { borderWidth: 1, borderRadius: 0, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  editBtn: { padding: 6, marginLeft: 10 },
  timeRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  timeBlock: { flex: 1 },
  timeSep: { width: 1, height: 32, backgroundColor: theme.border, marginHorizontal: 16 },
  timeBlockLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, color: theme.textMuted, marginBottom: 4 },
  timeBlockValue: { fontSize: 20, fontWeight: '300', color: theme.textPrimary, letterSpacing: 0.5 },
});

