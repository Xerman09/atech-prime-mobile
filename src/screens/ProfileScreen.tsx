import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, ActivityIndicator 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useTheme, ThemeColors } from '../theme/ThemeContext';

interface ProfileScreenProps {
  onBack: () => void;
  employeeId: number | null;
  token: string | null;
  userName: string;
}

export default function ProfileScreen({ onBack, employeeId, token, userName }: ProfileScreenProps) {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);
  
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!employeeId || !token) {
        setIsLoading(false);
        return;
      }
      try {
        const apiUrl = Platform.OS === 'web' 
          ? `http://localhost/atech_prime/backend/public/api/employees/${employeeId}`
          : `http://192.168.100.31/atech_prime/backend/public/api/employees/${employeeId}`;
          
        const response = await fetch(apiUrl, {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setProfileData(data);
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [employeeId, token]);

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === '0000-00-00') return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

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
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Feather name="arrow-left" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{userName.charAt(0)}</Text>
          </View>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.userRole}>{profileData?.position_name || 'Staff'}</Text>
          <View style={[styles.statusBadge, styles.statusActive]}>
            <View style={[styles.statusDot, { backgroundColor: theme.success }]} />
            <Text style={styles.statusText}>{profileData?.status || 'Active'}</Text>
          </View>
        </View>

        {isLoading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : (
          <>
            {/* Employment Details Section */}
            <Text style={styles.sectionTitle}>EMPLOYMENT DETAILS</Text>
            <View style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Feather name="hash" size={16} color={theme.primary} />
                </View>
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Employee ID</Text>
                  <Text style={styles.detailValue}>{employeeId || '-'}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Feather name="briefcase" size={16} color={theme.primary} />
                </View>
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Department</Text>
                  <Text style={styles.detailValue}>{profileData?.department_name || '-'}</Text>
                </View>
              </View>

              <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                <View style={styles.detailIcon}>
                  <Feather name="calendar" size={16} color={theme.primary} />
                </View>
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Date Hired</Text>
                  <Text style={styles.detailValue}>{formatDate(profileData?.hire_date)}</Text>
                </View>
              </View>
            </View>

            {/* Personal Details Section */}
            <Text style={styles.sectionTitle}>PERSONAL DETAILS</Text>
            <View style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Feather name="mail" size={16} color={theme.primary} />
                </View>
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Email Address</Text>
                  <Text style={styles.detailValue}>{profileData?.email || '-'}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Feather name="phone" size={16} color={theme.primary} />
                </View>
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Phone Number</Text>
                  <Text style={styles.detailValue}>{profileData?.phone || '-'}</Text>
                </View>
              </View>
              
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Feather name="calendar" size={16} color={theme.primary} />
                </View>
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Date of Birth</Text>
                  <Text style={styles.detailValue}>{formatDate(profileData?.date_of_birth)}</Text>
                </View>
              </View>

              <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                <View style={styles.detailIcon}>
                  <Feather name="map-pin" size={16} color={theme.primary} />
                </View>
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Address</Text>
                  <Text style={styles.detailValue}>{profileData?.address || '-'}</Text>
                </View>
              </View>
            </View>

            {/* Government IDs */}
            <Text style={styles.sectionTitle}>GOVERNMENT IDs</Text>
            <View style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Feather name="file-text" size={16} color={theme.primary} />
                </View>
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>SSS Number</Text>
                  <Text style={styles.detailValue}>{profileData?.sss_number || '-'}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Feather name="file-text" size={16} color={theme.primary} />
                </View>
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>TIN</Text>
                  <Text style={styles.detailValue}>{profileData?.tin_number || '-'}</Text>
                </View>
              </View>
              
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Feather name="file-text" size={16} color={theme.primary} />
                </View>
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>PhilHealth Number</Text>
                  <Text style={styles.detailValue}>{profileData?.philhealth_number || '-'}</Text>
                </View>
              </View>

              <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                <View style={styles.detailIcon}>
                  <Feather name="file-text" size={16} color={theme.primary} />
                </View>
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Pag-IBIG Number</Text>
                  <Text style={styles.detailValue}>{profileData?.pagibig_number || '-'}</Text>
                </View>
              </View>
            </View>

            {/* Emergency Contact */}
            <Text style={styles.sectionTitle}>EMERGENCY CONTACT</Text>
            <View style={[styles.detailsCard, { marginBottom: 40 }]}>
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Feather name="users" size={16} color={theme.primary} />
                </View>
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Contact Name</Text>
                  <Text style={styles.detailValue}>{profileData?.emergency_contact_name || '-'}</Text>
                </View>
              </View>

              <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                <View style={styles.detailIcon}>
                  <Feather name="phone-call" size={16} color={theme.primary} />
                </View>
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Contact Phone</Text>
                  <Text style={styles.detailValue}>{profileData?.emergency_contact_phone || '-'}</Text>
                </View>
              </View>
            </View>
          </>
        )}
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
    top: -50,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    backgroundColor: theme.inputBg,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    color: theme.textPrimary,
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
  profileCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.cardBg,
    borderWidth: 1,
    borderColor: theme.border,
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
  avatarContainer: {
    width: 80,
    height: 80,
    backgroundColor: theme.glow1,
    borderWidth: 1,
    borderColor: theme.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: theme.primary,
    fontSize: 32,
    fontWeight: '700',
  },
  userName: {
    color: theme.textPrimary,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  userRole: {
    color: theme.textSecondary,
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 0,
  },
  statusActive: {
    backgroundColor: isDarkMode ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.2)',
    borderColor: isDarkMode ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.4)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    color: theme.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  sectionTitle: {
    color: theme.textMuted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  detailsCard: {
    backgroundColor: theme.cardBg,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 0,
    padding: 20,
    marginBottom: 32,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  detailIcon: {
    width: 36,
    height: 36,
    backgroundColor: theme.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    marginRight: 16,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    color: theme.textMuted,
    fontSize: 12,
    marginBottom: 4,
  },
  detailValue: {
    color: theme.textPrimary,
    fontSize: 15,
    fontWeight: '500',
  },
});
