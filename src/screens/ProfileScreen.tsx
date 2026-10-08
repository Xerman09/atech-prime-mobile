import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useTheme, ThemeColors } from '../theme/ThemeContext';

interface ProfileScreenProps {
  onBack: () => void;
  employeeId: number | null;
  token: string | null;
  userName: string;
  onNavigateToAssets?: () => void;
}

export default function ProfileScreen({ onBack, employeeId, token, userName, onNavigateToAssets }: ProfileScreenProps) {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    try {
      let resolvedEmpId = employeeId;
      if (!resolvedEmpId) {
        try {
          const uData = await AsyncStorage.getItem('user_data');
          if (uData) {
            const parsed = JSON.parse(uData);
            if (parsed.employee_id) resolvedEmpId = parsed.employee_id;
          }
        } catch {}
      }

      const endpoint = `api/employees/me`;
      const url = Platform.OS === 'web'
        ? `http://${window.location.hostname}/atech_prime/backend/public/${endpoint}`
        : `http://192.168.100.11/atech_prime/backend/public/${endpoint}`;

      const res = await fetch(url, { 
        cache: 'no-store',
        headers: { 
          'Accept': 'application/json', 
          'Authorization': `Bearer ${token}`,
          'X-Authorization': `Bearer ${token}`
        } 
      });

      if (res.ok) {
        const data = await res.json();
        setProfileData(data);
        // Sync cached employee_id in storage to ensure whole app uses fresh id
        if (data.id) {
          try {
            const uData = await AsyncStorage.getItem('user_data');
            if (uData) {
              const parsed = JSON.parse(uData);
              parsed.employee_id = data.id;
              await AsyncStorage.setItem('user_data', JSON.stringify(parsed));
            }
          } catch {}
        }
      } else {
        setErrorMsg('Employee profile record could not be found.');
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('Failed to connect to the server. Please check your network connection.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [employeeId, token]);

  const formatDate = (ds?: string | null) => {
    if (!ds || ds === '0000-00-00') return '-';
    const d = new Date(ds);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getYear = (ds?: string | null) => {
    if (!ds || ds === '0000-00-00') return '-';
    const d = new Date(ds);
    if (isNaN(d.getTime())) return '-';
    return d.getFullYear().toString();
  };

  const isTokenString = (str?: string) => !str || str.startsWith('MS4') || (str.length > 30 && str.includes('.'));

  const realFullName = profileData ? [
    profileData.first_name,
    profileData.middle_name,
    profileData.last_name,
    profileData.extension
  ].filter(Boolean).join(' ').trim() : '';

  const displayName = realFullName || (!isTokenString(userName) ? userName : (profileData?.email || '-'));
  const initials = displayName !== '-' ? (displayName.split(' ').filter(Boolean).map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '-') : '-';

  const addressParts = profileData ? [
    profileData.address,
    profileData.address_line_2,
    profileData.barangay,
    profileData.city,
    profileData.province,
    profileData.zip_code,
    profileData.country
  ].filter(Boolean) : [];
  const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : (profileData?.address || '-');

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
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Feather name="arrow-left" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>My Profile</Text>
          <Text style={styles.headerSubtitle}>Personal & Organizational Credentials</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.emerald} />
          <Text style={styles.loadingText}>Loading Profile Credentials...</Text>
          <Text style={styles.loadingSubtext}>Retrieving employee details from database</Text>
        </View>
      ) : errorMsg && !profileData ? (
        <View style={styles.errorContainer}>
          <View style={styles.errorIconWrap}>
            <Feather name="alert-circle" size={28} color="#ef4444" />
          </View>
          <Text style={styles.errorTitle}>Profile Not Found</Text>
          <Text style={styles.errorSub}>{errorMsg}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchProfile} activeOpacity={0.8}>
            <Feather name="refresh-cw" size={14} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.retryText}>Retry Loading</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          {/* Profile hero card */}
          <View style={styles.heroCardWrapper}>
            <LinearGradient
              colors={theme.accentGradient as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ height: 3, width: '100%' }}
            />
            <LinearGradient
              colors={isDarkMode ? ['#0c1929', '#08121f'] : ['#08697A', '#053e48']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.profileHero}
            >
              <LinearGradient colors={['#10b981', '#08697A']} style={styles.avatarRing}>
                <Text style={styles.avatarText}>{initials}</Text>
              </LinearGradient>
              <Text style={styles.profileName}>{displayName}</Text>
              <Text style={styles.profileRole}>{profileData?.position_name || '-'}</Text>
              {profileData?.status ? (
                <View style={styles.statusPill}>
                  <View style={[styles.statusDot, { backgroundColor: profileData.status === 'Active' ? theme.emerald : '#f59e0b' }]} />
                  <Text style={styles.statusText}>{profileData.status.toUpperCase()}</Text>
                </View>
              ) : null}
            </LinearGradient>
          </View>

          {/* 4 Metric Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: theme.primaryLight }]}>
                {profileData?.id ? `#${profileData.id}` : (employeeId ? `#${employeeId}` : '-')}
              </Text>
              <Text style={styles.statLabel}>Employee ID</Text>
            </View>
            <View style={[styles.statBox, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border }]}>
              <Text style={[styles.statValue, { color: theme.emerald }]} numberOfLines={1}>
                {profileData?.department_name || '-'}
              </Text>
              <Text style={styles.statLabel}>Department</Text>
            </View>
            <View style={[styles.statBox, { borderRightWidth: 1, borderColor: theme.border }]}>
              <Text style={[styles.statValue, { color: theme.primary }]}>
                {getYear(profileData?.hire_date)}
              </Text>
              <Text style={styles.statLabel}>Onboarded</Text>
            </View>
            <TouchableOpacity
              style={styles.statBox}
              onPress={onNavigateToAssets}
              activeOpacity={onNavigateToAssets ? 0.7 : 1}
              disabled={!onNavigateToAssets}
            >
              <Text style={[styles.statValue, { color: theme.emerald }]}>
                {profileData?.allocated_assets ? profileData.allocated_assets.length : 0}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.statLabel}>Assets</Text>
                {onNavigateToAssets ? (
                  <Feather name="arrow-up-right" size={9} color={theme.emerald} style={{ marginLeft: 3 }} />
                ) : null}
              </View>
            </TouchableOpacity>
          </View>

          {/* General Details */}
          <Text style={styles.sectionLabel}>ORGANIZATIONAL DETAILS</Text>
          <View style={styles.detailsCard}>
            <DetailRow icon="briefcase" label="DESIGNATION / ROLE" value={profileData?.position_name || '-'} iconColor={theme.primaryLight} iconBg={theme.tealTint} />
            <DetailRow icon="layers" label="DEPARTMENT / DIVISION" value={profileData?.department_name || '-'} iconColor={theme.primary} iconBg={theme.tealTint} />
            <DetailRow icon="calendar" label="HIRE DATE" value={formatDate(profileData?.hire_date)} iconColor={theme.emerald} iconBg={theme.tealTint} />
            <DetailRow icon="clock" label="EMPLOYMENT CLASSIFICATION" value={profileData?.employment_type || '-'} iconColor={theme.primaryLight} iconBg={theme.tealTint} last />
          </View>

          {/* Contact Details */}
          <Text style={styles.sectionLabel}>CONTACT & CONNECTIVITY</Text>
          <View style={styles.detailsCard}>
            <DetailRow icon="mail" label="OFFICIAL EMAIL" value={profileData?.email || '-'} iconColor={theme.primaryLight} iconBg={theme.tealTint} />
            <DetailRow icon="phone" label="MOBILE CONTACT" value={profileData?.phone || profileData?.contact_number || '-'} iconColor={theme.emerald} iconBg={theme.tealTint} />
            <DetailRow icon="map-pin" label="REGISTERED ADDRESS" value={fullAddress} iconColor={theme.primary} iconBg={theme.tealTint} last />
          </View>

          {/* Emergency Contact */}
          {(profileData?.emergency_contact_name || profileData?.emergency_contact_phone) ? (
            <>
              <Text style={styles.sectionLabel}>EMERGENCY CONTACT</Text>
              <View style={styles.detailsCard}>
                <DetailRow icon="user" label="CONTACT PERSON" value={profileData?.emergency_contact_name || '-'} iconColor={theme.primaryLight} iconBg={theme.tealTint} />
                <DetailRow icon="phone-call" label="EMERGENCY PHONE" value={profileData?.emergency_contact_phone || '-'} iconColor={theme.emerald} iconBg={theme.tealTint} last />
              </View>
            </>
          ) : null}

          {/* Assigned Assets & Equipment Section */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>ASSIGNED ASSETS & EQUIPMENT</Text>
            {onNavigateToAssets ? (
              <TouchableOpacity
                style={styles.viewInventoryBtn}
                onPress={onNavigateToAssets}
                activeOpacity={0.8}
              >
                <Text style={styles.viewInventoryBtnText}>View Full List</Text>
                <Feather name="chevron-right" size={12} color={theme.primaryLight} style={{ marginLeft: 2 }} />
              </TouchableOpacity>
            ) : profileData?.allocated_assets && profileData.allocated_assets.length > 0 ? (
              <View style={styles.assetCountBadge}>
                <Text style={styles.assetCountText}>
                  {profileData.allocated_assets.length} {profileData.allocated_assets.length === 1 ? 'ITEM' : 'ITEMS'}
                </Text>
              </View>
            ) : null}
          </View>

          {profileData?.allocated_assets && profileData.allocated_assets.length > 0 ? (
            <View style={{ marginBottom: 20 }}>
              {profileData.allocated_assets.map((asset: any, idx: number) => (
                <View key={asset.allocation_id || asset.asset_id || idx} style={styles.assetCard}>
                  {/* Top Header of Card */}
                  <View style={styles.assetCardHeader}>
                    <View style={styles.assetTagBadge}>
                      <Feather name="box" size={12} color={theme.primaryLight} style={{ marginRight: 5 }} />
                      <Text style={styles.assetTagText}>{asset.asset_tag || 'ASSET'}</Text>
                    </View>
                    <View style={styles.assetCategoryBadge}>
                      <Text style={styles.assetCategoryText}>{asset.category || 'Equipment'}</Text>
                    </View>
                  </View>

                  {/* Asset Title */}
                  <Text style={styles.assetName}>{asset.asset_name}</Text>

                  {/* Details Grid */}
                  <View style={styles.assetDetailsGrid}>
                    {(asset.model_number || asset.serial_number) ? (
                      <View style={styles.assetDetailItem}>
                        <Text style={styles.assetDetailLabel}>MODEL / SERIAL</Text>
                        <Text style={styles.assetDetailVal} numberOfLines={1}>
                          {[asset.model_number, asset.serial_number].filter(Boolean).join(' · ') || '-'}
                        </Text>
                      </View>
                    ) : null}

                    <View style={styles.assetDetailItem}>
                      <Text style={styles.assetDetailLabel}>ASSIGNED ON</Text>
                      <Text style={styles.assetDetailVal}>{formatDate(asset.allocation_date)}</Text>
                    </View>

                    {asset.condition ? (
                      <View style={styles.assetDetailItem}>
                        <Text style={styles.assetDetailLabel}>CONDITION</Text>
                        <View style={styles.assetConditionRow}>
                          <View style={[styles.conditionDot, { backgroundColor: asset.condition === 'Brand New' || asset.condition === 'Good' ? theme.emerald : '#f59e0b' }]} />
                          <Text style={[styles.assetDetailVal, { color: theme.textPrimary }]}>{asset.condition}</Text>
                        </View>
                      </View>
                    ) : null}

                    {asset.expected_return_date ? (
                      <View style={styles.assetDetailItem}>
                        <Text style={styles.assetDetailLabel}>RETURN DATE</Text>
                        <Text style={[styles.assetDetailVal, { color: '#f59e0b' }]}>{formatDate(asset.expected_return_date)}</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Allocation Notes if present */}
                  {asset.notes ? (
                    <View style={styles.assetNotesBox}>
                      <Feather name="info" size={11} color={theme.textMuted} style={{ marginRight: 6 }} />
                      <Text style={styles.assetNotesText} numberOfLines={2}>{asset.notes}</Text>
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.noAssetsCard}>
              <View style={styles.noAssetsIconWrap}>
                <Feather name="package" size={22} color={theme.textMuted} />
              </View>
              <Text style={styles.noAssetsTitle}>No Company Assets Assigned</Text>
              <Text style={styles.noAssetsSub}>
                You currently do not have any company equipment, devices, or tools in your custody.
              </Text>
            </View>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
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
  loadingContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30,
  },
  loadingText: {
    marginTop: 16, fontSize: 14, fontWeight: '700', color: theme.textPrimary,
  },
  loadingSubtext: {
    marginTop: 4, fontSize: 11, color: theme.textMuted,
  },
  errorContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30,
  },
  errorIconWrap: {
    width: 50, height: 50, backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  errorTitle: {
    fontSize: 15, fontWeight: '800', color: theme.textPrimary, marginBottom: 4,
  },
  errorSub: {
    fontSize: 12, color: theme.textMuted, textAlign: 'center', marginBottom: 16, lineHeight: 18,
  },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.primary, paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 1, borderColor: theme.primary,
  },
  retryText: {
    color: '#ffffff', fontSize: 12, fontWeight: '700',
  },
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
  sectionHeaderRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10,
  },
  viewInventoryBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 4,
    backgroundColor: theme.tealTint, borderWidth: 1, borderColor: theme.border,
  },
  viewInventoryBtnText: {
    fontSize: 9, fontWeight: '800', color: theme.primaryLight, letterSpacing: 0.5,
  },
  assetCountBadge: {
    paddingHorizontal: 8, paddingVertical: 2, backgroundColor: theme.tealTint,
    borderWidth: 1, borderColor: theme.border,
  },
  assetCountText: {
    fontSize: 9, fontWeight: '800', color: theme.primaryLight, letterSpacing: 0.5,
  },
  assetCard: {
    backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border,
    padding: 16, marginBottom: 12,
  },
  assetCardHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10,
  },
  assetTagBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.tealTint, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: theme.border,
  },
  assetTagText: {
    fontSize: 11, fontWeight: '800', color: theme.primaryLight, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  assetCategoryBadge: {
    paddingHorizontal: 8, paddingVertical: 3, backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9',
    borderWidth: 1, borderColor: theme.border,
  },
  assetCategoryText: {
    fontSize: 10, fontWeight: '700', color: theme.textMuted,
  },
  assetName: {
    fontSize: 15, fontWeight: '800', color: theme.textPrimary, marginBottom: 12,
  },
  assetDetailsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
  },
  assetDetailItem: {
    minWidth: '45%', flex: 1, marginBottom: 6,
  },
  assetDetailLabel: {
    fontSize: 9, fontWeight: '800', color: theme.textMuted, letterSpacing: 0.8, marginBottom: 2,
  },
  assetDetailVal: {
    fontSize: 12, fontWeight: '600', color: theme.textPrimary,
  },
  assetConditionRow: {
    flexDirection: 'row', alignItems: 'center',
  },
  conditionDot: {
    width: 6, height: 6, marginRight: 6,
  },
  assetNotesBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
    padding: 8, marginTop: 10, borderWidth: 1, borderColor: theme.border,
  },
  assetNotesText: {
    fontSize: 11, color: theme.textMuted, flex: 1, fontStyle: 'italic',
  },
  noAssetsCard: {
    backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border,
    padding: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  noAssetsIconWrap: {
    width: 44, height: 44, alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.tealTint, borderWidth: 1, borderColor: theme.border, marginBottom: 10,
  },
  noAssetsTitle: {
    fontSize: 13, fontWeight: '800', color: theme.textPrimary, marginBottom: 4,
  },
  noAssetsSub: {
    fontSize: 11, color: theme.textMuted, textAlign: 'center', lineHeight: 16,
  },
});
