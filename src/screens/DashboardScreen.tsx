import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';

interface DashboardScreenProps {
  userName: string;
  onLogout: () => void;
  onNavigate: (screen: string) => void;
}

export default function DashboardScreen({ userName, onLogout, onNavigate }: DashboardScreenProps) {
  const [currentDate, setCurrentDate] = useState<string>('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
        <TouchableOpacity style={styles.menuButton} onPress={() => setIsMenuOpen(true)}>
          <Feather name="menu" size={24} color="#f8fafc" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{userName}</Text>
        </View>
      </View>

      {/* Hamburger Menu Sidebar */}
      <Modal
        visible={isMenuOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsMenuOpen(false)}
      >
        <TouchableOpacity 
          style={styles.sidebarOverlay} 
          activeOpacity={1} 
          onPress={() => setIsMenuOpen(false)}
        >
          <TouchableOpacity 
            activeOpacity={1} 
            style={styles.sidebarContainer}
          >
            {/* Top Gradient Strip */}
            <LinearGradient 
              colors={['#2563eb', '#6366f1', '#22d3ee']}
              start={{x: 0, y: 0}} end={{x: 1, y: 0}}
              style={styles.modalGradientStrip}
            />
            
            <View style={styles.sidebarHeader}>
              <View style={styles.sidebarProfile}>
                <View style={styles.sidebarAvatar}>
                  <Text style={styles.sidebarAvatarText}>{userName.charAt(0)}</Text>
                </View>
                <View style={styles.sidebarUserInfo}>
                  <Text style={styles.sidebarUserName}>{userName}</Text>
                  <Text style={styles.sidebarUserRole}>Staff</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setIsMenuOpen(false)} style={styles.closeButton}>
                <Feather name="x" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.sidebarContent}>
              <Text style={styles.sidebarSectionTitle}>MAIN MENU</Text>

              <TouchableOpacity style={styles.sidebarItem} onPress={() => { setIsMenuOpen(false); onNavigate('dashboard'); }}>
                <Feather name="home" size={20} color="#38bdf8" style={styles.sidebarItemIcon} />
                <Text style={styles.sidebarItemText}>Dashboard</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.sidebarItem} onPress={() => { setIsMenuOpen(false); onNavigate('attendance'); }}>
                <Feather name="clock" size={20} color="#94a3b8" style={styles.sidebarItemIcon} />
                <Text style={styles.sidebarItemText}>Time In/Out</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.sidebarItem} onPress={() => { setIsMenuOpen(false); onNavigate('leave_request'); }}>
                <Feather name="file-text" size={20} color="#94a3b8" style={styles.sidebarItemIcon} />
                <Text style={styles.sidebarItemText}>Leave Requests</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.sidebarItem} onPress={() => { setIsMenuOpen(false); onNavigate('undertime_request'); }}>
                <Feather name="corner-down-right" size={20} color="#94a3b8" style={styles.sidebarItemIcon} />
                <Text style={styles.sidebarItemText}>Undertime Requests</Text>
              </TouchableOpacity>

              <View style={styles.sidebarDivider} />
              <Text style={styles.sidebarSectionTitle}>ACCOUNT</Text>

              <TouchableOpacity style={styles.sidebarItem}>
                <Feather name="user" size={20} color="#94a3b8" style={styles.sidebarItemIcon} />
                <Text style={styles.sidebarItemText}>My Profile</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.sidebarItem}>
                <Feather name="settings" size={20} color="#94a3b8" style={styles.sidebarItemIcon} />
                <Text style={styles.sidebarItemText}>Settings</Text>
              </TouchableOpacity>

            </ScrollView>

            <View style={styles.sidebarFooter}>
              <TouchableOpacity 
                style={styles.logoutBtn} 
                onPress={() => {
                  setIsMenuOpen(false);
                  onLogout();
                }}
              >
                <Feather name="log-out" size={20} color="#ef4444" />
                <Text style={styles.logoutBtnText}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

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
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51, 65, 85, 0.5)',
    backgroundColor: 'rgba(2, 6, 23, 0.5)',
  },
  headerTextContainer: {
    marginLeft: 16,
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
  menuButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 0, // Sharp corners
  },
  sidebarOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  sidebarContainer: {
    width: '80%',
    maxWidth: 320,
    height: '100%',
    backgroundColor: '#0f172a',
    borderRightWidth: 1,
    borderRightColor: 'rgba(51, 65, 85, 0.5)',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 10, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  modalGradientStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51, 65, 85, 0.5)',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
  },
  sidebarProfile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sidebarAvatar: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sidebarAvatarText: {
    color: '#38bdf8',
    fontSize: 20,
    fontWeight: '700',
  },
  sidebarUserInfo: {
    justifyContent: 'center',
  },
  sidebarUserName: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  sidebarUserRole: {
    color: '#94a3b8',
    fontSize: 12,
  },
  closeButton: {
    padding: 4,
  },
  sidebarContent: {
    flex: 1,
    padding: 20,
  },
  sidebarSectionTitle: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 12,
    marginTop: 8,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  sidebarItemIcon: {
    marginRight: 16,
    width: 24,
    textAlign: 'center',
  },
  sidebarItemText: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '500',
  },
  sidebarDivider: {
    height: 1,
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    marginVertical: 16,
  },
  sidebarFooter: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(51, 65, 85, 0.5)',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingVertical: 12,
  },
  logoutBtnText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
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
