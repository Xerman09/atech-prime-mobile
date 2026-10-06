import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useTheme, ThemeColors } from '../theme/ThemeContext';

interface TimeInOutScreenProps {
  onBack: () => void;
  employeeId: number | null;
  token: string | null;
}

export default function TimeInOutScreen({ onBack, employeeId, token }: TimeInOutScreenProps) {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [hasTimedIn, setHasTimedIn] = useState(false);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [timeInLog, setTimeInLog] = useState<string | null>(null);
  const [timeOutLog, setTimeOutLog] = useState<string | null>(null);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [isActing, setIsActing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const status = hasTimedIn && hasTimedOut ? 'Completed' : hasTimedIn ? 'In Progress' : 'Not Started';

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDate(now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchTodayLogs = async () => {
      if (!token) { setIsLoadingLogs(false); return; }
      try {
        const url = Platform.OS === 'web'
          ? `http://${window.location.hostname}/atech_prime/backend/public/api/attendance/my-logs/today`
          : 'http://192.168.100.31/atech_prime/backend/public/api/attendance/my-logs/today';
        const res = await fetch(url, { headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          if (data.hasTimedIn) { setHasTimedIn(true); setTimeInLog(data.timeInLog); }
          if (data.hasTimedOut) { setHasTimedOut(true); setTimeOutLog(data.timeOutLog); }
        }
      } catch (e) { console.error(e); } finally { setIsLoadingLogs(false); }
    };
    fetchTodayLogs();
  }, [token]);

  const handleTimeAction = async (action: 'In' | 'Out') => {
    if (!employeeId) { setMessage({ type: 'error', text: 'Employee ID not found.' }); return; }
    setIsActing(true);
    setMessage(null);
    try {
      const url = Platform.OS === 'web'
        ? `http://${window.location.hostname}/atech_prime/backend/public/api/attendance/tap`
        : 'http://192.168.100.31/atech_prime/backend/public/api/attendance/tap';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ employee_id: employeeId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Time ${action} failed.`);
      if (action === 'In') { setHasTimedIn(true); setTimeInLog(data.time || currentTime); }
      else { setHasTimedOut(true); setTimeOutLog(data.time || currentTime); }
      setMessage({ type: 'success', text: `Time ${action} recorded at ${data.time || currentTime}` });
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    } finally { setIsActing(false); }
  };

  const formatLog = (log: string | null) => {
    if (!log) return '--:--';
    const d = new Date(log);
    if (isNaN(d.getTime())) return log;
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const statusColor = hasTimedIn && hasTimedOut ? theme.success : hasTimedIn ? theme.warning : theme.textMuted;

  return (
    <View style={styles.container}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <LinearGradient colors={theme.backgroundGradient as any} style={StyleSheet.absoluteFillObject} />
      <View style={styles.blob1} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Feather name="arrow-left" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Time In / Out</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Clock Card */}
        <LinearGradient colors={theme.primaryGradient as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.clockCard}>
          <Text style={styles.clockTime}>{currentTime}</Text>
          <Text style={styles.clockDate}>{currentDate}</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={styles.statusText}>{status}</Text>
          </View>
        </LinearGradient>

        {/* Feedback message */}
        {message && (
          <View style={[styles.msgBanner, { backgroundColor: message.type === 'success' ? theme.greenTint : theme.redTint, borderColor: message.type === 'success' ? theme.success + '50' : theme.error + '50' }]}>
            <Feather name={message.type === 'success' ? 'check-circle' : 'alert-circle'} size={15} color={message.type === 'success' ? theme.success : theme.error} style={{ marginRight: 8 }} />
            <Text style={[styles.msgText, { color: message.type === 'success' ? theme.success : theme.error }]}>{message.text}</Text>
          </View>
        )}

        {/* Log Cards */}
        <View style={styles.logRow}>
          <View style={[styles.logCard, { borderColor: hasTimedIn ? theme.success + '50' : theme.border }]}>
            <View style={[styles.logIconBox, { backgroundColor: hasTimedIn ? theme.greenTint : theme.tealTint }]}>
              <Feather name="log-in" size={18} color={hasTimedIn ? theme.success : theme.primary} />
            </View>
            <Text style={styles.logLabel}>TIME IN</Text>
            <Text style={[styles.logValue, { color: hasTimedIn ? theme.success : theme.textMuted }]}>{isLoadingLogs ? '--:--' : formatLog(timeInLog)}</Text>
          </View>
          <View style={[styles.logCard, { borderColor: hasTimedOut ? theme.success + '50' : theme.border }]}>
            <View style={[styles.logIconBox, { backgroundColor: hasTimedOut ? theme.greenTint : theme.tealTint }]}>
              <Feather name="log-out" size={18} color={hasTimedOut ? theme.success : theme.primary} />
            </View>
            <Text style={styles.logLabel}>TIME OUT</Text>
            <Text style={[styles.logValue, { color: hasTimedOut ? theme.success : theme.textMuted }]}>{isLoadingLogs ? '--:--' : formatLog(timeOutLog)}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        {isLoadingLogs ? (
          <ActivityIndicator color={theme.primary} style={{ marginTop: 24 }} />
        ) : (
          <View style={styles.actionArea}>
            {!hasTimedIn && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleTimeAction('In')} disabled={isActing} activeOpacity={0.85}>
                <LinearGradient colors={theme.primaryGradient as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.actionBtnGradient}>
                  {isActing ? <ActivityIndicator color="#fff" /> : (
                    <View style={styles.actionBtnRow}>
                      <Feather name="log-in" size={18} color="#fff" style={{ marginRight: 10 }} />
                      <Text style={styles.actionBtnText}>RECORD TIME IN</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}

            {hasTimedIn && !hasTimedOut && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleTimeAction('Out')} disabled={isActing} activeOpacity={0.85}>
                <View style={[styles.actionBtnOutline, { borderColor: theme.error }]}>
                  {isActing ? <ActivityIndicator color={theme.error} /> : (
                    <View style={styles.actionBtnRow}>
                      <Feather name="log-out" size={18} color={theme.error} style={{ marginRight: 10 }} />
                      <Text style={[styles.actionBtnText, { color: theme.error }]}>RECORD TIME OUT</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            )}

            {hasTimedIn && hasTimedOut && (
              <View style={styles.completedBox}>
                <Feather name="check-circle" size={24} color={theme.success} style={{ marginBottom: 8 }} />
                <Text style={styles.completedTitle}>Attendance Recorded</Text>
                <Text style={styles.completedSub}>You have completed your attendance for today.</Text>
              </View>
            )}
          </View>
        )}

        {/* Info note */}
        <View style={styles.infoBox}>
          <Feather name="info" size={13} color={theme.textMuted} style={{ marginRight: 8 }} />
          <Text style={styles.infoText}>Your location and timestamp are automatically recorded for audit purposes.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const getStyles = (theme: ThemeColors, isDarkMode: boolean) => StyleSheet.create({
  container: { flex: 1 },
  blob1: {
    position: 'absolute', top: -50, right: -50, width: 180, height: 180, borderRadius: 90,
    backgroundColor: isDarkMode ? 'rgba(19,157,158,0.07)' : 'rgba(8,105,122,0.05)',
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 56 : 36, paddingHorizontal: 20, paddingBottom: 12,
  },
  backBtn: { padding: 8, backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border, borderRadius: 0 },
  headerTitle: { color: theme.textPrimary, fontSize: 17, fontWeight: '700', letterSpacing: 0.3 },
  body: { paddingHorizontal: 20, paddingBottom: 40 },
  clockCard: { padding: 28, marginBottom: 20, borderRadius: 0, alignItems: 'center' },
  clockTime: { color: '#fff', fontSize: 48, fontWeight: '200', letterSpacing: 2, marginBottom: 6 },
  clockDate: { color: 'rgba(255,255,255,0.75)', fontSize: 14, marginBottom: 16, textAlign: 'center' },
  statusRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 0 },
  statusDot: { width: 7, height: 7, borderRadius: 4, marginRight: 8 },
  statusText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  msgBanner: { flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1, borderRadius: 0, marginBottom: 16 },
  msgText: { flex: 1, fontSize: 13, fontWeight: '500' },
  logRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  logCard: { flex: 1, backgroundColor: theme.cardBg, borderWidth: 1, borderRadius: 0, padding: 16, alignItems: 'center' },
  logIconBox: { width: 40, height: 40, borderRadius: 0, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  logLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, color: theme.textMuted, marginBottom: 6 },
  logValue: { fontSize: 22, fontWeight: '300', letterSpacing: 1 },
  actionArea: { marginBottom: 24 },
  actionBtn: { shadowColor: theme.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6 },
  actionBtnGradient: { paddingVertical: 18, alignItems: 'center', justifyContent: 'center', borderRadius: 0 },
  actionBtnOutline: { paddingVertical: 18, alignItems: 'center', justifyContent: 'center', borderRadius: 0, borderWidth: 1.5, backgroundColor: isDarkMode ? 'rgba(239,68,68,0.06)' : 'rgba(220,38,38,0.04)' },
  actionBtnRow: { flexDirection: 'row', alignItems: 'center' },
  actionBtnText: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 1.5 },
  completedBox: { alignItems: 'center', paddingVertical: 32, backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border, borderRadius: 0 },
  completedTitle: { color: theme.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 6 },
  completedSub: { color: theme.textMuted, fontSize: 13, textAlign: 'center', paddingHorizontal: 16 },
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: theme.tealTint, borderWidth: 1, borderColor: theme.border, padding: 12, borderRadius: 0 },
  infoText: { flex: 1, color: theme.textMuted, fontSize: 12, lineHeight: 18 },
});
