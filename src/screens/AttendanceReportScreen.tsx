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
    if (timeIn && timeOut) return { text: 'COMPLETE', color: theme.emerald, bg: theme.emeraldTint };
    if (timeIn && !timeOut) return { text: 'NO TIME OUT', color: theme.amber, bg: theme.amberTint };
    if (!timeIn && timeOut) return { text: 'NO TIME IN', color: theme.amber, bg: theme.amberTint };
    return { text: 'ABSENT', color: theme.rose, bg: theme.roseTint };
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
          <Text style={styles.headerTitle}>Attendance History</Text>
          <Text style={styles.headerSubtitle}>Official Workstation Ledger</Text>
        </View>
        <TouchableOpacity style={styles.filterBtn} onPress={onNavigateToModificationRequests}>
          <Feather name="git-pull-request" size={16} color={theme.primaryLight} style={{ marginRight: 6 }} />
          <Text style={styles.filterBtnText}>Requests</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.subheader}>
        <View style={styles.subheaderBadge}>
          <Feather name="calendar" size={12} color={theme.primaryLight} style={{ marginRight: 5 }} />
          <Text style={styles.subheaderText}>Showing Past 30 Days Audit Records</Text>
        </View>
        <Text style={styles.recordCountText}>{logs.length} RECORDS</Text>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={theme.primaryLight} />
          <Text style={styles.loadingText}>Fetching attendance ledger...</Text>
        </View>
      ) : logs.length === 0 ? (
        <View style={styles.centerBox}>
          <View style={styles.emptyIcon}><Feather name="calendar" size={32} color={theme.textMuted} /></View>
          <Text style={styles.emptyTitle}>No records in ledger</Text>
          <Text style={styles.emptySubtitle}>Punch logs will appear here once registered through the portal.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          {logs.map((record, idx) => {
            const status = getStatus(record.timeIn, record.timeOut);
            return (
              <View key={idx} style={[styles.logCard, { borderLeftColor: status.color }]}>
                <View style={styles.logCardHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[styles.logDateDot, { backgroundColor: status.color }]} />
                    <Text style={styles.logDate}>{formatDate(record.date)}</Text>
                  </View>
                  <View style={styles.logRight}>
                    <View style={[styles.statusBadge, { borderColor: status.color + '50', backgroundColor: status.bg }]}>
                      <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
                    </View>
                    <TouchableOpacity style={styles.editBtn} onPress={() => onNavigateToForm(record.date)}>
                      <Feather name="edit-3" size={14} color={theme.primaryLight} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.timeRow}>
                  <View style={styles.timeBlock}>
                    <Text style={styles.timeBlockLabel}>TIME IN</Text>
                    <Text style={[styles.timeBlockValue, !record.timeIn ? { color: theme.textMuted } : { color: theme.emerald }]}>
                      {record.timeIn || '--:--'}
                    </Text>
                  </View>
                  <View style={styles.timeSep} />
                  <View style={styles.timeBlock}>
                    <Text style={styles.timeBlockLabel}>TIME OUT</Text>
                    <Text style={[styles.timeBlockValue, !record.timeOut ? { color: theme.textMuted } : { color: theme.primaryLight }]}>
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
  filterBtn: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6,
    backgroundColor: theme.tealTint, borderWidth: 1, borderColor: theme.border,
  },
  filterBtnText: { color: theme.primaryLight, fontSize: 11, fontWeight: '700' },
  subheader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border,
    backgroundColor: theme.tealTint,
  },
  subheaderBadge: { flexDirection: 'row', alignItems: 'center' },
  subheaderText: { color: theme.textSecondary, fontSize: 11, fontWeight: '600' },
  recordCountText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, color: theme.primaryLight },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  loadingText: { color: theme.textMuted, fontSize: 13, marginTop: 12 },
  emptyIcon: { width: 56, height: 56, backgroundColor: theme.tealTint, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { color: theme.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 6 },
  emptySubtitle: { color: theme.textMuted, fontSize: 12, textAlign: 'center' },
  body: { padding: 20 },
  logCard: {
    backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border,
    borderLeftWidth: 3.5, marginBottom: 12,
  },
  logCardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.border,
  },
  logDateDot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
  logDate: { color: theme.textPrimary, fontSize: 13, fontWeight: '700' },
  logRight: { flexDirection: 'row', alignItems: 'center' },
  statusBadge: { borderWidth: 1, paddingHorizontal: 7, paddingVertical: 2 },
  statusText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  editBtn: { padding: 6, marginLeft: 8 },
  timeRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  timeBlock: { flex: 1 },
  timeSep: { width: 1, height: 32, backgroundColor: theme.border, marginHorizontal: 16 },
  timeBlockLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1, color: theme.textMuted, marginBottom: 4 },
  timeBlockValue: { fontSize: 18, fontWeight: '600', letterSpacing: 0.5 },
});
