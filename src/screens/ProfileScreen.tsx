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

  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!employeeId || !token) { setIsLoading(false); return; }
      try {
        const url = Platform.OS === 'web'
          ? `http://${window.location.hostname}/atech_prime/backend/public/api/employees/${employeeId}`
          : `http://192.168.100.31/atech_prime/backend/public/api/employees/${employeeId}`;
        const res = await fetch(url, { headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` } });
        if (res.ok) setProfileData(await res.json());
      } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };
    fetchProfile();
  }, [employeeId, token]);

  const formatDate = (ds: string) => {
    if (!ds || ds === '0000-00-00') return '-';
    const d = new Date(ds);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const DetailRow = ({ icon, label, value, last = false }: { icon: string; label: string; value: string; last?: boolean }) => (
    <View style={[styles.detailRow, last && { borderBottomWidth: 0 }]}>
      <View style={styles.detailIconBox}>
        <Feather name={icon as any} size={15} color={theme.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value || '-'}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <LinearGradient colors={theme.backgroundGradient as any} style={StyleSheet.absoluteFillObject} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Feather name="arrow-left" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Profile hero */}
        <LinearGradient colors={theme.primaryGradient as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.profileHero}>
          <View style={styles.avatarRing}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.profileName}>{userName}</Text>
          <Text style={styles.profileRole}>{profileData?.position_name || 'Employee'}</Text>
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>{profileData?.status || 'Active'}</Text>
          </View>
        </LinearGradient>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{employeeId || '-'}</Text>
            <Text style={styles.statLabel}>Employee ID</Text>
          </View>
          <View style={[styles.statBox, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border }]}>
            <Text style={styles.statValue}>{profileData?.department_name ? profileData.department_name.split(' ')[0] : '-'}</Text>
            <Text style={styles.statLabel}>Department</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{formatDate(profileData?.hire_date).split(' ')[2] || '-'}</Text>
            <Text style={styles.statLabel}>Year Hired</Text>
          </View>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            <Text style={styles.sectionLabel}>EMPLOYMENT</Text>
            <View style={styles.card}>
              <DetailRow icon="hash" label="Employee ID" value={String(employeeId || '-')} />
              <DetailRow icon="briefcase" label="Department" value={profileData?.department_name} />
              <DetailRow icon="tag" label="Position" value={profileData?.position_name} />
              <DetailRow icon="calendar" label="Date Hired" value={formatDate(profileData?.hire_date)} last />
            </View>

            <Text style={styles.sectionLabel}>PERSONAL INFORMATION</Text>
            <View style={styles.card}>
              <DetailRow icon="mail" label="Email Address" value={profileData?.email} />
              <DetailRow icon="phone" label="Phone Number" value={profileData?.phone} />
              <DetailRow icon="calendar" label="Date of Birth" value={formatDate(profileData?.date_of_birth)} />
              <DetailRow icon="map-pin" label="Address" value={profileData?.address} last />
            </View>

            <Text style={styles.sectionLabel}>GOVERNMENT IDs</Text>
            <View style={styles.card}>
              <DetailRow icon="file-text" label="SSS Number" value={profileData?.sss_number} />
              <DetailRow icon="file-text" label="TIN" value={profileData?.tin_number} />
              <DetailRow icon="file-text" label="PhilHealth" value={profileData?.philhealth_number} />
              <DetailRow icon="file-text" label="Pag-IBIG" value={profileData?.pagibig_number} last />
            </View>

            <Text style={styles.sectionLabel}>EMERGENCY CONTACT</Text>
            <View style={[styles.card, { marginBottom: 40 }]}>
              <DetailRow icon="users" label="Contact Name" value={profileData?.emergency_contact_name} />
              <DetailRow icon="phone-call" label="Contact Phone" value={profileData?.emergency_contact_phone} last />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const getStyles = (theme: ThemeColors, isDarkMode: boolean) => StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 56 : 36, paddingHorizontal: 20, paddingBottom: 12,
  },
  backBtn: { padding: 8, backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border, borderRadius: 0 },
  headerTitle: { color: theme.textPrimary, fontSize: 17, fontWeight: '700' },
  body: { paddingBottom: 20 },
  profileHero: { alignItems: 'center', paddingTop: 32, paddingBottom: 28, paddingHorizontal: 24, marginBottom: 0 },
  avatarRing: { width: 76, height: 76, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 14, borderRadius: 0, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '800' },
  profileName: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 4 },
  profileRole: { color: 'rgba(255,255,255,0.75)', fontSize: 14, marginBottom: 16 },
  statusPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 0 },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#A6CE38', marginRight: 8 },
  statusText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  statsRow: { flexDirection: 'row', backgroundColor: theme.cardBg, borderBottomWidth: 1, borderBottomColor: theme.border, marginBottom: 24 },
  statBox: { flex: 1, paddingVertical: 16, alignItems: 'center' },
  statValue: { color: theme.primary, fontSize: 16, fontWeight: '700', marginBottom: 3 },
  statLabel: { color: theme.textMuted, fontSize: 10, textAlign: 'center' },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, color: theme.textMuted, marginBottom: 10, marginHorizontal: 20 },
  card: { backgroundColor: theme.cardBg, borderTopWidth: 1, borderBottomWidth: 1, borderColor: theme.border, marginBottom: 24 },
  detailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: theme.border },
  detailIconBox: { width: 32, height: 32, backgroundColor: theme.tealTint, alignItems: 'center', justifyContent: 'center', marginRight: 14, borderRadius: 0 },
  detailLabel: { color: theme.textMuted, fontSize: 11, marginBottom: 3 },
  detailValue: { color: theme.textPrimary, fontSize: 14, fontWeight: '500' },
});
