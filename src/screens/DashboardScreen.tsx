import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useTheme, ThemeColors } from '../theme/ThemeContext';

interface DashboardScreenProps {
  userName: string;
  onLogout: () => void;
  onNavigate: (screen: string) => void;
}

export default function DashboardScreen({ userName, onLogout, onNavigate }: DashboardScreenProps) {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const styles = getStyles(theme, isDarkMode);
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
      colors={theme.backgroundGradient}
      style={styles.container}
    >
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      
      {/* Decorative Background Elements */}
      <View style={styles.glow1} />
      <View style={styles.glow2} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={() => setIsMenuOpen(true)}>
          <Feather name="menu" size={24} color={theme.textPrimary} />
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
              colors={theme.primaryGradient as any}
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
                <Feather name="x" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.sidebarContent}>
              <Text style={styles.sidebarSectionTitle}>MAIN MENU</Text>

              <TouchableOpacity style={styles.sidebarItem} onPress={() => { setIsMenuOpen(false); onNavigate('dashboard'); }}>
                <Feather name="home" size={20} color={theme.primary} style={styles.sidebarItemIcon} />
                <Text style={styles.sidebarItemText}>Dashboard</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.sidebarItem} onPress={() => { setIsMenuOpen(false); onNavigate('attendance'); }}>
                <Feather name="clock" size={20} color={theme.textSecondary} style={styles.sidebarItemIcon} />
                <Text style={styles.sidebarItemText}>Time In/Out</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.sidebarItem} onPress={() => { setIsMenuOpen(false); onNavigate('leave_request'); }}>
                <Feather name="file-text" size={20} color={theme.textSecondary} style={styles.sidebarItemIcon} />
                <Text style={styles.sidebarItemText}>Leave Requests</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.sidebarItem} onPress={() => { setIsMenuOpen(false); onNavigate('undertime_request'); }}>
                <Feather name="corner-down-right" size={20} color={theme.textSecondary} style={styles.sidebarItemIcon} />
                <Text style={styles.sidebarItemText}>Undertime Requests</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.sidebarItem} onPress={() => { setIsMenuOpen(false); onNavigate('coe_request'); }}>
                <Feather name="award" size={20} color={theme.textSecondary} style={styles.sidebarItemIcon} />
                <Text style={styles.sidebarItemText}>COE Requests</Text>
              </TouchableOpacity>

              <View style={styles.sidebarDivider} />
              <Text style={styles.sidebarSectionTitle}>ACCOUNT</Text>

              <TouchableOpacity style={styles.sidebarItem}>
                <Feather name="user" size={20} color={theme.textSecondary} style={styles.sidebarItemIcon} />
                <Text style={styles.sidebarItemText}>My Profile</Text>
              </TouchableOpacity>
              
              
              <TouchableOpacity style={styles.sidebarItem} onPress={toggleTheme}>
                <Feather name={isDarkMode ? "sun" : "moon"} size={20} color={theme.textSecondary} style={styles.sidebarItemIcon} />
                <Text style={styles.sidebarItemText}>{isDarkMode ? "Light Mode" : "Dark Mode"}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.sidebarItem}>
                <Feather name="settings" size={20} color={theme.textSecondary} style={styles.sidebarItemIcon} />
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
                <Feather name="log-out" size={20} color={theme.error} />
                <Text style={styles.logoutBtnText}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.dateContainer}>
          <Feather name="calendar" size={16} color={theme.primary} style={styles.dateIcon} />
          <Text style={styles.dateText}>Today is {currentDate}</Text>
        </View>

        <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
        
        <View style={styles.actionList}>
          <TouchableOpacity style={styles.actionRow} activeOpacity={0.8} onPress={() => onNavigate('attendance')}>
            <View style={styles.actionRowLeft}>
              <View style={[styles.actionIconMini, { backgroundColor: theme.glow1 }]}>
                <Feather name="clock" size={16} color={theme.primary} />
              </View>
              <View>
                <Text style={styles.actionTitleMini}>Time In/Out</Text>
                <Text style={styles.actionDescMini}>Record daily attendance</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={16} color={theme.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionRow} activeOpacity={0.8} onPress={() => onNavigate('leave_request')}>
            <View style={styles.actionRowLeft}>
              <View style={[styles.actionIconMini, { backgroundColor: isDarkMode ? 'rgba(168, 85, 247, 0.1)' : 'rgba(147, 51, 234, 0.1)' }]}>
                <Feather name="file-text" size={16} color={theme.purple} />
              </View>
              <View>
                <Text style={styles.actionTitleMini}>Leave Request</Text>
                <Text style={styles.actionDescMini}>Apply for vacation or sick leave</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={16} color={theme.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionRow} activeOpacity={0.8} onPress={() => onNavigate('business_trip_request')}>
            <View style={styles.actionRowLeft}>
              <View style={[styles.actionIconMini, { backgroundColor: isDarkMode ? 'rgba(34, 197, 94, 0.1)' : 'rgba(22, 163, 74, 0.1)' }]}>
                <Feather name="map" size={16} color={theme.success} />
              </View>
              <View>
                <Text style={styles.actionTitleMini}>Business Trip</Text>
                <Text style={styles.actionDescMini}>Request official travel</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={16} color={theme.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionRow} activeOpacity={0.8} onPress={() => onNavigate('undertime_request')}>
            <View style={styles.actionRowLeft}>
              <View style={[styles.actionIconMini, { backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.1)' : 'rgba(217, 119, 6, 0.1)' }]}>
                <Feather name="clock" size={16} color={theme.warning} />
              </View>
              <View>
                <Text style={styles.actionTitleMini}>Undertime Request</Text>
                <Text style={styles.actionDescMini}>Request to leave work early</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={16} color={theme.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionRow, { borderBottomWidth: 0 }]} activeOpacity={0.8} onPress={() => onNavigate('coe_request')}>
            <View style={styles.actionRowLeft}>
              <View style={[styles.actionIconMini, { backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(37, 99, 235, 0.1)' }]}>
                <Feather name="award" size={16} color="#3b82f6" />
              </View>
              <View>
                <Text style={styles.actionTitleMini}>COE Request</Text>
                <Text style={styles.actionDescMini}>Request employment certificate</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={16} color={theme.textMuted} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>RECENT ACTIVITY</Text>
        
        <View style={styles.activityCard}>
          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Feather name="check-circle" size={16} color={theme.success} />
            </View>
            <View style={styles.activityTextContainer}>
              <Text style={styles.activityTitle}>Time In</Text>
              <Text style={styles.activityTime}>Today, 08:00 AM</Text>
            </View>
          </View>
          
          <View style={[styles.activityItem, styles.lastActivityItem]}>
            <View style={styles.activityIcon}>
              <Feather name="clock" size={16} color={theme.warning} />
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

const getStyles = (theme: ThemeColors, isDarkMode: boolean) => StyleSheet.create({
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
    backgroundColor: theme.glow1,
    borderRadius: 150,
    transform: [{ scale: 2 }],
  },
  glow2: {
    position: 'absolute',
    bottom: -100,
    right: -100,
    width: 300,
    height: 300,
    backgroundColor: theme.glow2,
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
    borderBottomColor: theme.border,
    backgroundColor: theme.inputBg,
  },
  headerTextContainer: {
    marginLeft: 16,
  },
  greeting: {
    color: theme.textSecondary,
    fontSize: 14,
    marginBottom: 4,
  },
  userName: {
    color: theme.textPrimary,
    fontSize: 24,
    fontWeight: '700',
  },
  menuButton: {
    padding: 8,
    backgroundColor: theme.cardBg,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 0, // Sharp corners
  },
  sidebarOverlay: {
    flex: 1,
    backgroundColor: theme.sidebarOverlay,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  sidebarContainer: {
    width: '80%',
    maxWidth: 320,
    height: '100%',
    backgroundColor: theme.sidebarBg,
    borderRightWidth: 1,
    borderRightColor: theme.border,
    position: 'relative',
    
    
    
    
    
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
    borderBottomColor: theme.border,
    backgroundColor: theme.sidebarBg,
  },
  sidebarProfile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sidebarAvatar: {
    width: 48,
    height: 48,
    backgroundColor: theme.glow1,
    borderWidth: 1,
    borderColor: theme.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sidebarAvatarText: {
    color: theme.primary,
    fontSize: 20,
    fontWeight: '700',
  },
  sidebarUserInfo: {
    justifyContent: 'center',
  },
  sidebarUserName: {
    color: theme.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  sidebarUserRole: {
    color: theme.textSecondary,
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
    color: theme.textMuted,
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
    color: theme.textPrimary,
    fontSize: 15,
    fontWeight: '500',
  },
  sidebarDivider: {
    height: 1,
    backgroundColor: theme.border,
    marginVertical: 16,
  },
  sidebarFooter: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    backgroundColor: theme.sidebarBg,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(220, 38, 38, 0.1)',
    borderWidth: 1,
    borderColor: isDarkMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(220, 38, 38, 0.3)',
    paddingVertical: 12,
  },
  logoutBtnText: {
    color: theme.error,
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
    backgroundColor: theme.dateContainerBg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 0, // Sharp corners
    marginBottom: 32,
  },
  dateIcon: {
    marginRight: 12,
  },
  dateText: {
    color: theme.textPrimary,
    fontSize: 15,
    fontWeight: '500',
  },
  sectionTitle: {
    color: theme.textMuted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  actionList: {
    backgroundColor: theme.cardBg,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 0,
    marginBottom: 32,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  actionRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconMini: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 0,
    marginRight: 16,
  },
  actionTitleMini: {
    color: theme.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  actionDescMini: {
    color: theme.textMuted,
    fontSize: 12,
  },
  activityCard: {
    backgroundColor: theme.cardBg,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 0, // Sharp corners
    padding: 20,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
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
    color: theme.textPrimary,
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  activityTime: {
    color: theme.textMuted,
    fontSize: 12,
  },
});
