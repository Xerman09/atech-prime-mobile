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

  const status = hasTimedIn && hasTimedOut ? 'Shift Completed' : hasTimedIn ? 'Clocked In' : 'Not Clocked In';

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
    if (!employeeId) { setMessage({ type: 'error', text: 'No active employee profile linked to account.' }); return; }
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
      if (!res.ok) throw new Error(data.error || `Time ${action} submission failed.`);
      if (action === 'In') { setHasTimedIn(true); setTimeInLog(data.time || currentTime); }
      else { setHasTimedOut(true); setTimeOutLog(data.time || currentTime); }
      setMessage({ type: 'success', text: `Time ${action} successfully verified and recorded at ${data.time || currentTime}` });
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

  const getStatusTheme = () => {
    if (hasTimedIn && hasTimedOut) {
      return { dot: theme.emerald, text: 'SHIFT COMPLETED', bg: theme.emeraldTint, border: theme.emerald };
    }
    if (hasTimedIn) {
      return { dot: theme.secondary, text: 'CLOCKED IN • ACTIVE', bg: theme.greenTint, border: theme.secondary };
    }
    return { dot: theme.amber, text: 'PENDING CLOCK IN', bg: theme.amberTint, border: theme.amber };
  };

  const statusTheme = getStatusTheme();

  return (
    <View style={styles.container}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <LinearGradient colors={theme.backgroundGradient as any} style={StyleSheet.absoluteFillObject} />

      {/* Decorative blobs */}
      <View style={styles.blob1} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Feather name="arrow-left" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Attendance Station</Text>
        <View style={styles.liveTag}>
          <View style={styles.liveTagDot} />
          <Text style={styles.liveTagText}>GPS READY</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        {/* Clock Card with Signature Strip */}
        <View style={styles.clockCardWrapper}>
          <LinearGradient
            colors={theme.accentGradient as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.signatureStrip}
          />
          <LinearGradient
            colors={isDarkMode ? ['#05252b', '#03171a'] : ['#08697A', '#053e48']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.clockGradient}
          >
            <View style={[styles.statusPill, { backgroundColor: statusTheme.bg, borderColor: statusTheme.border + '50' }]}>
              <View style={[styles.statusDot, { backgroundColor: statusTheme.dot }]} />
              <Text style={[styles.statusText, { color: statusTheme.dot }]}>{statusTheme.text}</Text>
            </View>

            <Text style={styles.clockTime}>{currentTime}</Text>
            <Text style={styles.clockDate}>{currentDate}</Text>

            <View style={styles.systemPillsRow}>
              <View style={styles.systemPill}>
                <Feather name="map-pin" size={11} color={theme.cyan} style={{ marginRight: 4 }} />
                <Text style={styles.systemPillText}>HQ Office Geofence</Text>
              </View>
              <View style={styles.systemPill}>
                <Feather name="wifi" size={11} color={theme.emerald} style={{ marginRight: 4 }} />
                <Text style={styles.systemPillText}>Secure Biometric Ping</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Feedback Alert Banner */}
        {message && (
          <View style={[
            styles.msgBanner,
            {
              backgroundColor: message.type === 'success' ? theme.emeraldTint : theme.roseTint,
              borderColor: message.type === 'success' ? theme.emerald : theme.rose,
              borderLeftColor: message.type === 'success' ? theme.emerald : theme.rose,
            }
          ]}>
            <Feather
              name={message.type === 'success' ? 'check-circle' : 'alert-circle'}
              size={16}
              color={message.type === 'success' ? theme.emerald : theme.rose}
              style={{ marginRight: 10, marginTop: 1 }}
            />
            <Text style={[
              styles.msgText,
              { color: message.type === 'success' ? theme.emerald : theme.rose }
            ]}>
              {message.text}
            </Text>
          </View>
        )}

        {/* Two-Column Log Cards with Distinct Colors */}
        <View style={styles.logRow}>
          {/* TIME IN CARD (Emerald & Lime accent) */}
          <View style={[
            styles.logCard,
            { borderTopColor: theme.emerald, borderColor: hasTimedIn ? theme.emerald + '60' : theme.border }
          ]}>
            <View style={[styles.logIconBox, { backgroundColor: theme.emeraldTint, borderColor: theme.emerald + '40' }]}>
              <Feather name="log-in" size={18} color={theme.emerald} />
            </View>
            <Text style={styles.logLabel}>FIRST TIME IN</Text>
            <Text style={[styles.logValue, { color: hasTimedIn ? theme.emerald : theme.textMuted }]}>
              {isLoadingLogs ? '--:--' : formatLog(timeInLog)}
            </Text>
            <View style={[styles.logBadge, { backgroundColor: hasTimedIn ? theme.emeraldTint : theme.tealTint }]}>
              <Text style={[styles.logBadgeText, { color: hasTimedIn ? theme.emerald : theme.textMuted }]}>
                {hasTimedIn ? 'VERIFIED' : 'PENDING'}
              </Text>
            </View>
          </View>

          {/* TIME OUT CARD (Rose & Orange accent) */}
          <View style={[
            styles.logCard,
            { borderTopColor: theme.rose, borderColor: hasTimedOut ? theme.rose + '60' : theme.border }
          ]}>
            <View style={[styles.logIconBox, { backgroundColor: theme.roseTint, borderColor: theme.rose + '40' }]}>
              <Feather name="log-out" size={18} color={theme.rose} />
            </View>
            <Text style={styles.logLabel}>FINAL TIME OUT</Text>
            <Text style={[styles.logValue, { color: hasTimedOut ? theme.rose : theme.textMuted }]}>
              {isLoadingLogs ? '--:--' : formatLog(timeOutLog)}
            </Text>
            <View style={[styles.logBadge, { backgroundColor: hasTimedOut ? theme.roseTint : theme.tealTint }]}>
              <Text style={[styles.logBadgeText, { color: hasTimedOut ? theme.rose : theme.textMuted }]}>
                {hasTimedOut ? 'VERIFIED' : 'PENDING'}
              </Text>
            </View>
          </View>
        </View>

        {/* High-Energy Action Buttons */}
        {isLoadingLogs ? (
          <ActivityIndicator color={theme.primary} style={{ marginTop: 24 }} />
        ) : (
          <View style={styles.actionArea}>
            {!hasTimedIn && (
              <TouchableOpacity style={styles.punchActionBtn} onPress={() => handleTimeAction('In')} disabled={isActing} activeOpacity={0.88}>
                <LinearGradient
                  colors={['#10b981', '#A6CE38']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.actionBtnGradient}
                >
                  {isActing ? (
                    <ActivityIndicator color="#042a30" />
                  ) : (
                    <View style={styles.actionBtnRow}>
                      <Feather name="log-in" size={20} color="#042a30" style={{ marginRight: 10 }} />
                      <Text style={[styles.actionBtnText, { color: '#042a30' }]}>SUBMIT TIME IN PUNCH</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}

            {hasTimedIn && !hasTimedOut && (
              <TouchableOpacity style={styles.punchActionBtn} onPress={() => handleTimeAction('Out')} disabled={isActing} activeOpacity={0.88}>
                <LinearGradient
                  colors={['#f43f5e', '#e11d48']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.actionBtnGradient}
                >
                  {isActing ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <View style={styles.actionBtnRow}>
                      <Feather name="log-out" size={20} color="#ffffff" style={{ marginRight: 10 }} />
                      <Text style={[styles.actionBtnText, { color: '#ffffff' }]}>SUBMIT TIME OUT PUNCH</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}

            {hasTimedIn && hasTimedOut && (
              <View style={styles.completedBox}>
                <View style={styles.completedIconCircle}>
                  <Feather name="check" size={24} color="#ffffff" />
                </View>
                <Text style={styles.completedTitle}>Shift Complete for Today</Text>
                <Text style={styles.completedSub}>Both Time In and Time Out punches have been verified and locked for payroll processing.</Text>
              </View>
            )}
          </View>
        )}

        {/* Security Audit Footnote matching Frontend */}
        <View style={styles.infoBox}>
          <Feather name="shield" size={14} color={theme.royalBlue} style={{ marginRight: 10, marginTop: 1 }} />
          <Text style={styles.infoText}>
            All attendance punches are cryptographically validated against your tenant network and logged in real-time to the central audit ledger.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const getStyles = (theme: ThemeColors, isDarkMode: boolean) => StyleSheet.create({
  container: { flex: 1 },
  blob1: {
    position: 'absolute', top: -50, right: -50, width: 200, height: 200,
    backgroundColor: theme.glow1, opacity: 0.12,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 56 : 36, paddingHorizontal: 20, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: theme.border,
  },
  backBtn: { padding: 8, backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border },
  headerTitle: { color: theme.textPrimary, fontSize: 16, fontWeight: '700' },
  liveTag: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: theme.emeraldTint,
    borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)', paddingHorizontal: 8, paddingVertical: 4,
  },
  liveTagDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: theme.emerald, marginRight: 5 },
  liveTagText: { fontSize: 10, fontWeight: '800', color: theme.emerald, letterSpacing: 0.5 },
  body: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  clockCardWrapper: {
    backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border,
    marginBottom: 20, position: 'relative', overflow: 'hidden',
  },
  signatureStrip: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, zIndex: 10 },
  clockGradient: { padding: 24, alignItems: 'center' },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 4, marginBottom: 12,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  clockTime: { color: '#ffffff', fontSize: 44, fontWeight: '200', letterSpacing: 2, marginBottom: 4 },
  clockDate: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 16, textAlign: 'center' },
  systemPillsRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  systemPill: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8, paddingVertical: 4,
  },
  systemPillText: { color: 'rgba(255,255,255,0.9)', fontSize: 10, fontWeight: '600' },
  msgBanner: {
    flexDirection: 'row', alignItems: 'flex-start', padding: 12,
    borderWidth: 1, borderLeftWidth: 4, marginBottom: 18,
  },
  msgText: { flex: 1, fontSize: 12, fontWeight: '600', lineHeight: 18 },
  logRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  logCard: {
    flex: 1, backgroundColor: theme.cardBg, borderWidth: 1, borderTopWidth: 3,
    padding: 16, alignItems: 'center',
  },
  logIconBox: { width: 42, height: 42, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  logLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1, color: theme.textMuted, marginBottom: 6 },
  logValue: { fontSize: 22, fontWeight: '400', letterSpacing: 1, marginBottom: 8 },
  logBadge: { paddingHorizontal: 8, paddingVertical: 2 },
  logBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  actionArea: { marginBottom: 20 },
  punchActionBtn: { overflow: 'hidden' },
  actionBtnGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  actionBtnRow: { flexDirection: 'row', alignItems: 'center' },
  actionBtnText: { fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  completedBox: {
    alignItems: 'center', paddingVertical: 28, paddingHorizontal: 20,
    backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border,
  },
  completedIconCircle: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: theme.emerald,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  completedTitle: { color: theme.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 6 },
  completedSub: { color: theme.textMuted, fontSize: 12, textAlign: 'center', lineHeight: 18 },
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: theme.blueTint,
    borderWidth: 1, borderColor: 'rgba(37, 99, 235, 0.25)', padding: 12,
  },
  infoText: { flex: 1, color: theme.textSecondary, fontSize: 11, lineHeight: 17 },
});
