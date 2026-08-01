import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';

interface DashboardScreenProps {
  onLogout: () => void;
  onNavigate: (screen: string) => void;
}

export default function DashboardScreen({ onLogout, onNavigate }: DashboardScreenProps) {
  const [userName, setUserName] = useState<string>('Employee');
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    // In a real app, we would fetch user details from AsyncStorage or context
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    setCurrentDate(now.toLocaleDateString(undefined, options));
  }, []);

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
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{userName}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Feather name="log-out" size={20} color="#f8fafc" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.dateContainer}>
          <Feather name="calendar" size={16} color="#38bdf8" style={styles.dateIcon} />
          <Text style={styles.dateText}>Today is {currentDate}</Text>
        </View>

        <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
        
        <View style={styles.grid}>
          <TouchableOpacity 
            style={styles.card} 
            activeOpacity={0.8}
            onPress={() => onNavigate('attendance')}
          >
            <View style={[styles.iconWrapper, { backgroundColor: 'rgba(56, 189, 248, 0.1)' }]}>
              <Feather name="clock" size={24} color="#38bdf8" />
            </View>
            <Text style={styles.cardTitle}>Time In/Out</Text>
            <Text style={styles.cardDesc}>Record your daily attendance</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.card} 
            activeOpacity={0.8}
            onPress={() => onNavigate('leave_request')}
          >
            <View style={[styles.iconWrapper, { backgroundColor: 'rgba(168, 85, 247, 0.1)' }]}>
              <Feather name="file-text" size={24} color="#a855f7" />
            </View>
            <Text style={styles.cardTitle}>Leave Request</Text>
            <Text style={styles.cardDesc}>Apply for vacation or sick leave</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} activeOpacity={0.8}>
            <View style={[styles.iconWrapper, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
              <Feather name="map" size={24} color="#22c55e" />
            </View>
            <Text style={styles.cardTitle}>Business Trip</Text>
            <Text style={styles.cardDesc}>Request official travel</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.card} 
            activeOpacity={0.8}
            onPress={() => onNavigate('undertime_request')}
          >
            <View style={[styles.iconWrapper, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
              <Feather name="clock" size={24} color="#f59e0b" />
            </View>
            <Text style={styles.cardTitle}>Undertime Request</Text>
            <Text style={styles.cardDesc}>Request to leave work early</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>RECENT ACTIVITY</Text>
        
        <View style={styles.activityCard}>
          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Feather name="check-circle" size={16} color="#22c55e" />
            </View>
            <View style={styles.activityTextContainer}>
              <Text style={styles.activityTitle}>Time In</Text>
              <Text style={styles.activityTime}>Today, 08:00 AM</Text>
            </View>
          </View>
          
          <View style={[styles.activityItem, styles.lastActivityItem]}>
            <View style={styles.activityIcon}>
              <Feather name="clock" size={16} color="#f59e0b" />
            </View>
            <View style={styles.activityTextContainer}>
              <Text style={styles.activityTitle}>Leave Request Pending</Text>
              <Text style={styles.activityTime}>Yesterday, 04:30 PM</Text>
            </View>
          </View>
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
    top: -100,
    left: -100,
    width: 300,
    height: 300,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderRadius: 150,
    transform: [{ scale: 2 }],
  },
  glow2: {
    position: 'absolute',
    bottom: -100,
    right: -100,
    width: 300,
    height: 300,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    borderRadius: 150,
    transform: [{ scale: 2 }],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51, 65, 85, 0.5)',
    backgroundColor: 'rgba(2, 6, 23, 0.5)',
  },
  greeting: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 4,
  },
  userName: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: '700',
  },
  logoutButton: {
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 0, // Sharp corners
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: 0, // Sharp corners
    marginBottom: 32,
  },
  dateIcon: {
    marginRight: 12,
  },
  dateText: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '500',
  },
  sectionTitle: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  card: {
    width: '48%',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
    padding: 20,
    borderRadius: 0, // Sharp corners
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 0, // Sharp corners
  },
  cardTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  cardDesc: {
    color: '#64748b',
    fontSize: 12,
    lineHeight: 18,
  },
  activityCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
    borderRadius: 0, // Sharp corners
    padding: 20,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51, 65, 85, 0.5)',
    marginBottom: 16,
  },
  lastActivityItem: {
    borderBottomWidth: 0,
    paddingBottom: 0,
    marginBottom: 0,
  },
  activityIcon: {
    marginTop: 2,
    marginRight: 16,
  },
  activityTextContainer: {
    flex: 1,
  },
  activityTitle: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  activityTime: {
    color: '#64748b',
    fontSize: 12,
  },
});
