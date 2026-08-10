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
  const styles = getStyles(theme);
  const [logs, setLogs] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        let apiUrl = `http://192.168.100.31/atech_prime/backend/public/api/attendance/my-logs/history`;
        if (Platform.OS === 'web') {
          apiUrl = `http://${window.location.hostname}/atech_prime/backend/public/api/attendance/my-logs/history`;
        }
          
        const response = await fetch(apiUrl, {
          method: 'GET',
          cache: 'no-store', // Prevent aggressive caching
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setLogs(Array.isArray(data) ? data : []);
        } else {
          console.error(`HTTP Error: ${response.status}`);
        }
      } catch (error) {
        console.error('Failed to fetch logs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [token]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const getStatusColor = (timeIn: string | null, timeOut: string | null) => {
    if (timeIn && timeOut) return theme.success;
    if (timeIn && !timeOut) return theme.warning;
    return theme.error;
  };

  const getStatusText = (timeIn: string | null, timeOut: string | null) => {
    if (timeIn && timeOut) return 'Completed';
    if (timeIn && !timeOut) return 'Missing Out';
    if (!timeIn && timeOut) return 'Missing In';
    return 'Absent';
  };

  return (
    <LinearGradient colors={theme.backgroundGradient as any} style={styles.container}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      
      {/* Decorative Background Elements */}
      <View style={styles.glow1} />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Feather name="arrow-left" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Attendance History</Text>
        <TouchableOpacity style={styles.modifyButton} onPress={onNavigateToModificationRequests}>
          <Feather name="list" size={20} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.subtitleContainer}>
        <Text style={styles.subtitleText}>Showing last 30 days</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={styles.loadingText}>Loading attendance logs...</Text>
          </View>
        ) : logs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="calendar" size={48} color={theme.textSecondary} style={styles.emptyIcon} />
            <Text style={styles.emptyText}>No attendance records found.</Text>
          </View>
        ) : (
          logs.map((record, index) => (
            <View key={index} style={styles.logCard}>
              <View style={styles.logHeader}>
                <View style={styles.dateRow}>
                  <Feather name="calendar" size={16} color={theme.textSecondary} />
                  <Text style={styles.logDate}>{formatDate(record.date)}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[
                    styles.statusBadge, 
                    { borderColor: getStatusColor(record.timeIn, record.timeOut) }
                  ]}>
                    <Text style={[
                      styles.statusText, 
                      { color: getStatusColor(record.timeIn, record.timeOut) }
                    ]}>
                      {getStatusText(record.timeIn, record.timeOut)}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={{ marginLeft: 12 }} 
                    onPress={() => onNavigateToForm(record.date)}
                  >
                    <Feather name="edit-3" size={18} color={theme.primary} />
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.timeGrid}>
                <View style={styles.timeBlock}>
                  <Text style={styles.timeLabel}>Time In</Text>
                  <Text style={[styles.timeValue, !record.timeIn && styles.timeMissing]}>
                    {record.timeIn || '--:--'}
                  </Text>
                </View>
                <View style={styles.timeDivider} />
                <View style={styles.timeBlock}>
                  <Text style={styles.timeLabel}>Time Out</Text>
                  <Text style={[styles.timeValue, !record.timeOut && styles.timeMissing]}>
                    {record.timeOut || '--:--'}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  glow1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: theme.primary,
    opacity: 0.1,
    ...Platform.select({
      web: { filter: 'blur(60px)' }
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 10,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 0, // Enforcing Anti-AI Slop Rule (sharp edges)
  },
  modifyButton: {
    width: 40,
    height: 40,
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.primary,
    borderRadius: 0, // Enforcing Anti-AI Slop Rule
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  subtitleContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  subtitleText: {
    color: theme.textSecondary,
    fontSize: 14,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: theme.textSecondary,
    fontSize: 14,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 0, // Enforcing Anti-AI Slop Rule
    marginTop: 20,
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyText: {
    color: theme.textSecondary,
    fontSize: 16,
  },
  logCard: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
    marginBottom: 16,
    borderRadius: 0, // Enforcing Anti-AI Slop Rule
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logDate: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderRadius: 0, // Enforcing Anti-AI Slop Rule
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  timeGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeBlock: {
    flex: 1,
  },
  timeDivider: {
    width: 1,
    height: 30,
    backgroundColor: theme.border,
    marginHorizontal: 16,
  },
  timeLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeValue: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  timeMissing: {
    color: theme.textSecondary,
    opacity: 0.5,
  },
});
