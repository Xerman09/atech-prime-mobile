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
          : 'http://192.168.100.31/atech_prime/backend/public/api/employees/${employeeId}';
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

  const DetailRow = ({ icon, label, value, iconColor = theme.royalBlue, iconBg = theme.blueTint, last = false }: { icon: string; label: string; value: string; iconColor?: string; iconBg?: string; last?: boolean }) => (
    <View style={[styles.detailRow, last && { borderBottomWidth: 0 }]}>
      <View style={[styles.detailIconBox, { backgroundColor: iconBg, borderColor: iconColor + '30' }]}>
        <Feather name={icon as any} size={15} color={iconColor} />
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

      {/* Signature Top Gradient Strip */}
      <LinearGradient
        colors={theme.accentGradient as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.signatureStrip}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Feather name="arrow-left" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>My Profile</Text>
          <Text style={styles.headerSubtitle}>Personal & Organizational Credentials</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Profile hero card */}
        <View style={styles.heroCardWrapper}>
          <LinearGradient
            colors={isDarkMode ? ['#05252b', '#03171a'] : ['#08697A', '#053e48']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileHero}
          >
            <LinearGradient colors={['#2563eb', '#139D9E']} style={styles.avatarRing}>
              <Text style={styles.avatarText}>{initials}</Text>
            </LinearGradient>
            <Text style={styles.profileName}>{userName}</Text>
            <Text style={styles.profileRole}>{profileData?.position_name || 'Workstation User'}</Text>
            <View style={styles.statusPill}>
              <View style={[styles.statusDot, { backgroundColor: theme.emerald }]} />
              <Text style={styles.statusText}>{profileData?.status?.toUpperCase() || 'ACTIVE ACCOUNT'}</Text>
            </View>
          </LinearGradient>
        </View>

        {/* 3 Metric Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: theme.royalBlue }]}>{employeeId ? `#${employeeId}` : '-'}</Text>
            <Text style={styles.statLabel}>Employee ID</Text>
          </View>
          <View style={[styles.statBox, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border }]}>
            <Text style={[styles.statValue, { color: theme.emerald }]}>{profileData?.department_name ? profileData.department_name.split(' ')[0] : 'Operations'}</Text>
            <Text style={styles.statLabel}>Department</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: theme.amber }]}>{formatDate(profileData?.hire_date).split(' ')[2] || '2026'}</Text>
            <Text style={styles.statLabel}>Year Onboarded</Text>
          </View>
        </View>

        {/* General Details */}
        <Text style={styles.sectionLabel}>ORGANIZATIONAL DETAILS</Text>
        <View style={styles.detailsCard}>
          <DetailRow icon="briefcase" label="DESIGNATION / ROLE" value={profileData?.position_name || 'Employee'} iconColor={theme.royalBlue} iconBg={theme.blueTint} />
          <DetailRow icon="layers" label="DEPARTMENT / DIVISION" value={profileData?.department_name || 'General Operations'} iconColor={theme.indigo} iconBg={theme.indigoTint} />
          <DetailRow icon="calendar" label="HIRE DATE" value={formatDate(profileData?.hire_date)} iconColor={theme.emerald} iconBg={theme.emeraldTint} />
          <DetailRow icon="clock" label="EMPLOYMENT CLASSIFICATION" value={profileData?.employment_type || 'Regular / Full-Time'} iconColor={theme.primary} iconBg={theme.tealTint} last />
        </View>

        {/* Contact Details */}
        <Text style={styles.sectionLabel}>CONTACT & CONNECTIVITY</Text>
        <View style={styles.detailsCard}>
          <DetailRow icon="mail" label="OFFICIAL EMAIL" value={profileData?.email || '-'} iconColor={theme.royalBlue} iconBg={theme.blueTint} />
          <DetailRow icon="phone" label="MOBILE CONTACT" value={profileData?.contact_number || '-'} iconColor={theme.emerald} iconBg={theme.emeraldTint} />
          <DetailRow icon="map-pin" label="REGISTERED ADDRESS" value={profileData?.address || '-'} iconColor={theme.rose} iconBg={theme.roseTint} last />
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const getStyles = (theme: ThemeColors, isDarkMode: boolean) => StyleSheet.create({
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
  body: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  heroCardWrapper: {
    backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border,
    marginBottom: 20, overflow: 'hidden',
  },
  profileHero: { padding: 24, alignItems: 'center' },
  avatarRing: {
    width: 68, height: 68, alignItems: 'center', justifyContent: 'center',
    marginBottom: 12, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: { color: '#ffffff', fontSize: 24, fontWeight: '900' },
  profileName: { color: '#ffffff', fontSize: 20, fontWeight: '800', marginBottom: 4 },
  profileRole: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 14 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1, borderColor: theme.emerald, paddingHorizontal: 10, paddingVertical: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { color: '#ffffff', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  statsRow: {
    flexDirection: 'row', backgroundColor: theme.cardBg, borderWidth: 1,
    borderColor: theme.border, marginBottom: 24,
  },
  statBox: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  statValue: { fontSize: 17, fontWeight: '800', marginBottom: 2 },
  statLabel: { fontSize: 10, color: theme.textMuted, fontWeight: '700', letterSpacing: 0.5 },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, color: theme.textMuted, marginBottom: 10 },
  detailsCard: {
    backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border, marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderBottomWidth: 1, borderBottomColor: theme.border,
  },
  detailIconBox: { width: 34, height: 34, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  detailLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1, color: theme.textMuted, marginBottom: 2 },
  detailValue: { fontSize: 13, color: theme.textPrimary, fontWeight: '600' },
});
