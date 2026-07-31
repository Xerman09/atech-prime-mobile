import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';

interface TimeInOutScreenProps {
  onBack: () => void;
}

export default function TimeInOutScreen({ onBack }: TimeInOutScreenProps) {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [status, setStatus] = useState<'Out' | 'In'>('Out');
  const [lastActionTime, setLastActionTime] = useState<string | null>(null);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      
      // Time formatting (e.g., 08:45:30 AM)
      const timeOptions: Intl.DateTimeFormatOptions = { 
        hour: '2-digit', minute: '2-digit', second: '2-digit' 
      };
      setCurrentTime(now.toLocaleTimeString(undefined, timeOptions));
      
      // Date formatting (e.g., July 31, 2026)
      const dateOptions: Intl.DateTimeFormatOptions = { 
        year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' 
      };
      setCurrentDate(now.toLocaleDateString(undefined, dateOptions));
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleTimeAction = (action: 'In' | 'Out') => {
    // In a real app, this would make an API call to record attendance
    setStatus(action);
    setLastActionTime(currentTime);
  };

  return (
    <LinearGradient
      colors={['#020617', '#0f172a', '#020617']}
      style={styles.container}
    >
      <StatusBar style="light" />
      
      {/* Decorative Background Elements */}
      <View style={styles.glow1} />
      <View style={styles.glow2} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Feather name="arrow-left" size={24} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Attendance</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        
        {/* Clock Display */}
        <View style={styles.clockContainer}>
          <Text style={styles.dateText}>{currentDate}</Text>
          <Text style={styles.timeText}>{currentTime}</Text>
          <View style={[styles.statusBadge, status === 'In' ? styles.statusIn : styles.statusOut]}>
            <View style={[styles.statusDot, { backgroundColor: status === 'In' ? '#22c55e' : '#ef4444' }]} />
            <Text style={styles.statusText}>Currently {status}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, status === 'In' && styles.actionButtonDisabled]}
            activeOpacity={0.8}
            onPress={() => handleTimeAction('In')}
            disabled={status === 'In'}
          >
            <LinearGradient
              colors={status === 'In' ? ['#334155', '#1e293b'] : ['#059669', '#10b981']}
              style={styles.gradientButton}
            >
              <Feather name="log-in" size={24} color={status === 'In' ? '#94a3b8' : '#ffffff'} />
              <Text style={[styles.buttonText, status === 'In' && { color: '#94a3b8' }]}>TIME IN</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, status === 'Out' && styles.actionButtonDisabled]}
            activeOpacity={0.8}
            onPress={() => handleTimeAction('Out')}
            disabled={status === 'Out'}
          >
            <LinearGradient
              colors={status === 'Out' ? ['#334155', '#1e293b'] : ['#e11d48', '#f43f5e']}
              style={styles.gradientButton}
            >
              <Feather name="log-out" size={24} color={status === 'Out' ? '#94a3b8' : '#ffffff'} />
              <Text style={[styles.buttonText, status === 'Out' && { color: '#94a3b8' }]}>TIME OUT</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Logs */}
        <Text style={styles.sectionTitle}>TODAY'S LOG</Text>
        <View style={styles.logCard}>
          {lastActionTime ? (
            <View style={styles.logItem}>
              <View style={styles.logIcon}>
                <Feather 
                  name={status === 'In' ? 'log-in' : 'log-out'} 
                  size={16} 
                  color={status === 'In' ? '#22c55e' : '#ef4444'} 
                />
              </View>
              <View style={styles.logTextContainer}>
                <Text style={styles.logTitle}>Time {status}</Text>
                <Text style={styles.logTime}>{lastActionTime}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.emptyLogText}>No records for today yet.</Text>
          )}
        </View>

      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  glow1: {
    position: 'absolute',
    top: -50,
    left: -100,
    width: 300,
    height: 300,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 150,
    transform: [{ scale: 2 }],
  },
  glow2: {
    position: 'absolute',
    bottom: -100,
    right: -100,
    width: 300,
    height: 300,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderRadius: 150,
    transform: [{ scale: 2 }],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51, 65, 85, 0.5)',
    backgroundColor: 'rgba(2, 6, 23, 0.5)',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  clockContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderRadius: 0, // Sharp corners
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  dateText: {
    color: '#94a3b8',
    fontSize: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  timeText: {
    color: '#f8fafc',
    fontSize: 48,
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 0, // Sharp corners
  },
  statusIn: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  statusOut: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '500',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  actionButton: {
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  actionButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  gradientButton: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 0, // Sharp corners
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 8,
  },
  sectionTitle: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  logCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
    borderRadius: 0, // Sharp corners
    padding: 20,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logIcon: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.8)',
    borderRadius: 0,
    marginRight: 16,
  },
  logTextContainer: {
    flex: 1,
  },
  logTitle: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  logTime: {
    color: '#94a3b8',
    fontSize: 13,
  },
  emptyLogText: {
    color: '#64748b',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 10,
  },
});
