import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, ActivityIndicator, Linking
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
  onNavigateToDocuments?: () => void;
}

export default function ProfileScreen({ onBack, employeeId, token, userName, onNavigateToAssets, onNavigateToDocuments }: ProfileScreenProps) {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchProfile = async () => {
    let resolvedToken = token;
    if (!resolvedToken) {
      try {
        const uSession = await AsyncStorage.getItem('user_session');
        if (uSession) {
          const parsed = JSON.parse(uSession);
          if (parsed.token) resolvedToken = parsed.token;
        }
      } catch {}
    }

    if (!resolvedToken) {
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
        : `http://192.168.100.31/atech_prime/backend/public/${endpoint}`;

      const res = await fetch(url, { 
        cache: 'no-store',
        headers: { 
          'Accept': 'application/json', 
          'Authorization': `Bearer ${resolvedToken}`,
          'X-Authorization': `Bearer ${resolvedToken}`
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

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes || bytes <= 0) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleOpenDocument = (fileUrl?: string) => {
    if (!fileUrl) return;
    let baseUrl = `http://192.168.100.31/atech_prime/backend/public`;
    if (Platform.OS === 'web') {
      baseUrl = `http://${window.location.hostname}/atech_prime/backend/public`;
    }
    const cleanUrl = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
    const fullUrl = `${baseUrl}${cleanUrl}`;

    if (Platform.OS === 'web') {
      window.open(fullUrl, '_blank');
    } else {
      Linking.openURL(fullUrl).catch(err => {
        console.error("Couldn't open document", err);
      });
    }
  };

  const getDocStatusStyle = (status?: string) => {
    switch (status) {
      case 'Verified':
        return { text: theme.emerald, bg: theme.tealTint, border: theme.emerald + '40', icon: 'check-circle' };
      case 'Pending Review':
        return { text: '#d97706', bg: isDarkMode ? 'rgba(217, 119, 6, 0.15)' : '#fef3c7', border: '#d9770640', icon: 'clock' };
      case 'Rejected':
        return { text: theme.rose, bg: theme.roseTint, border: theme.rose + '40', icon: 'x-circle' };
      default:
        return { text: theme.textMuted, bg: isDarkMode ? '#1e293b' : '#f1f5f9', border: theme.border, icon: 'file' };
    }
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
            <TouchableOpacity
              style={[styles.statBox, { borderRightWidth: 1, borderColor: theme.border }]}
              onPress={onNavigateToAssets}
              activeOpacity={onNavigateToAssets ? 0.7 : 1}
              disabled={!onNavigateToAssets}
            >
              <Text style={[styles.statValue, { color: theme.primary }]}>
                {profileData?.allocated_assets ? profileData.allocated_assets.length : 0}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.statLabel}>Assets</Text>
                {onNavigateToAssets ? (
                  <Feather name="arrow-up-right" size={9} color={theme.primary} style={{ marginLeft: 2 }} />
                ) : null}
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.statBox}
              onPress={onNavigateToDocuments}
              activeOpacity={onNavigateToDocuments ? 0.7 : 1}
              disabled={!onNavigateToDocuments}
            >
              <Text style={[styles.statValue, { color: theme.emerald }]}>
                {profileData?.uploaded_documents ? profileData.uploaded_documents.length : 0}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.statLabel}>Documents</Text>
                {onNavigateToDocuments ? (
                  <Feather name="arrow-up-right" size={9} color={theme.emerald} style={{ marginLeft: 2 }} />
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

          {/* Uploaded Documents & 201 Files Section */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>UPLOADED DOCUMENTS (201 FILES)</Text>
            {onNavigateToDocuments ? (
              <TouchableOpacity
                style={styles.viewInventoryBtn}
                onPress={onNavigateToDocuments}
                activeOpacity={0.8}
              >
                <Text style={styles.viewInventoryBtnText}>View Full List</Text>
                <Feather name="chevron-right" size={12} color={theme.primaryLight} style={{ marginLeft: 2 }} />
              </TouchableOpacity>
            ) : profileData?.uploaded_documents && profileData.uploaded_documents.length > 0 ? (
              <View style={styles.assetCountBadge}>
                <Text style={styles.assetCountText}>
                  {profileData.uploaded_documents.length} {profileData.uploaded_documents.length === 1 ? 'FILE' : 'FILES'}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Missing Requirements Alert Banner */}
          {profileData?.compliance?.missing_count > 0 && onNavigateToDocuments ? (
            <TouchableOpacity
              style={styles.missingReqAlertCard}
              onPress={onNavigateToDocuments}
              activeOpacity={0.85}
            >
              <View style={styles.missingReqIconWrap}>
                <Feather name="alert-circle" size={15} color="#ef4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.missingReqAlertTitle}>
                  {profileData.compliance.missing_count} Required {profileData.compliance.missing_count === 1 ? 'Document' : 'Documents'} Still Needed
                </Text>
                <Text style={styles.missingReqAlertSub}>
                  Institutional compliance requires uploading your missing 201 credentials. Tap to upload.
                </Text>
              </View>
              <Feather name="chevron-right" size={15} color="#ef4444" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          ) : null}

          {profileData?.uploaded_documents && profileData.uploaded_documents.length > 0 ? (
            <View style={{ marginBottom: 20 }}>
              {profileData.uploaded_documents.map((doc: any, idx: number) => {
                const statusCfg = getDocStatusStyle(doc.status);
                const isPdf = (doc.mime_type && doc.mime_type.includes('pdf')) || (doc.file_name && doc.file_name.toLowerCase().endsWith('.pdf'));

                return (
                  <View key={doc.id || idx} style={styles.docCard}>
                    {/* Top Header of Card */}
                    <View style={styles.docCardHeader}>
                      <View style={styles.docCategoryBadge}>
                        <Feather name="folder" size={11} color={theme.primaryLight} style={{ marginRight: 5 }} />
                        <Text style={styles.docCategoryText}>{doc.category || 'General'}</Text>
                      </View>
                      <View style={[styles.docStatusBadge, { backgroundColor: statusCfg.bg, borderColor: statusCfg.border }]}>
                        <Feather name={statusCfg.icon as any} size={10} color={statusCfg.text} style={{ marginRight: 4 }} />
                        <Text style={[styles.docStatusText, { color: statusCfg.text }]}>{doc.status || 'Pending'}</Text>
                      </View>
                    </View>

                    {/* Document Title */}
                    <Text style={styles.docTitle}>{doc.document_name}</Text>
                    {doc.document_number ? (
                      <View style={styles.docRefRow}>
                        <Text style={styles.docRefLabel}>REF / DOC NO:</Text>
                        <Text style={styles.docRefVal}>{doc.document_number}</Text>
                      </View>
                    ) : null}

                    {/* Details Grid */}
                    <View style={styles.docDetailsGrid}>
                      <View style={styles.docDetailItem}>
                        <Text style={styles.docDetailLabel}>ISSUE DATE</Text>
                        <Text style={styles.docDetailVal}>{formatDate(doc.issue_date)}</Text>
                      </View>

                      <View style={styles.docDetailItem}>
                        <Text style={styles.docDetailLabel}>EXPIRY DATE</Text>
                        <Text style={styles.docDetailVal}>{formatDate(doc.expiry_date)}</Text>
                      </View>

                      <View style={styles.docDetailItem}>
                        <Text style={styles.docDetailLabel}>FILE NAME</Text>
                        <Text style={styles.docDetailVal} numberOfLines={1}>{doc.file_name || '-'}</Text>
                      </View>

                      <View style={styles.docDetailItem}>
                        <Text style={styles.docDetailLabel}>FILE SIZE</Text>
                        <Text style={styles.docDetailVal}>{formatFileSize(doc.file_size)}</Text>
                      </View>
                    </View>

                    {/* Review Notes if present */}
                    {doc.review_notes ? (
                      <View style={styles.docNotesBox}>
                        <Feather name="message-square" size={11} color={theme.textMuted} style={{ marginRight: 6 }} />
                        <Text style={styles.docNotesText} numberOfLines={2}>{doc.review_notes}</Text>
                      </View>
                    ) : null}

                    {/* Footer Actions */}
                    <View style={styles.docFooterRow}>
                      <TouchableOpacity
                        style={styles.openFileBtn}
                        onPress={() => handleOpenDocument(doc.file_url)}
                        activeOpacity={0.8}
                      >
                        <Feather name={isPdf ? 'file-text' : 'image'} size={12} color="#ffffff" style={{ marginRight: 6 }} />
                        <Text style={styles.openFileBtnText}>View Document</Text>
                        <Feather name="external-link" size={11} color="#ffffff" style={{ marginLeft: 4 }} />
                      </TouchableOpacity>

                      {onNavigateToDocuments ? (
                        <TouchableOpacity
                          style={styles.inspectBtn}
                          onPress={onNavigateToDocuments}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.inspectBtnText}>All Records</Text>
                          <Feather name="chevron-right" size={12} color={theme.primaryLight} style={{ marginLeft: 2 }} />
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.noAssetsCard}>
              <View style={styles.noAssetsIconWrap}>
                <Feather name="file-text" size={22} color={theme.textMuted} />
              </View>
              <Text style={styles.noAssetsTitle}>No Uploaded Documents</Text>
              <Text style={styles.noAssetsSub}>
                You currently do not have any official 201 file documents or credentials uploaded in the system.
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

  // Document Cards in Profile
  docCard: {
    backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border,
    padding: 16, marginBottom: 12,
  },
  docCardHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8,
  },
  docCategoryBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: theme.tealTint,
    paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: theme.border,
  },
  docCategoryText: {
    fontSize: 10, fontWeight: '800', color: theme.primaryLight, letterSpacing: 0.5,
  },
  docStatusBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1,
  },
  docStatusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  docTitle: { fontSize: 15, fontWeight: '800', color: theme.textPrimary, marginBottom: 4 },
  docRefRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  docRefLabel: { fontSize: 9, fontWeight: '800', color: theme.textMuted, letterSpacing: 0.8, marginRight: 6 },
  docRefVal: {
    fontSize: 11, fontWeight: '800', color: theme.primaryLight,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  docDetailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 },
  docDetailItem: { minWidth: '45%', flex: 1, marginBottom: 6 },
  docDetailLabel: { fontSize: 9, fontWeight: '800', color: theme.textMuted, letterSpacing: 0.8, marginBottom: 2 },
  docDetailVal: { fontSize: 12, fontWeight: '600', color: theme.textPrimary },
  docNotesBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
    padding: 8, marginTop: 10, borderWidth: 1, borderColor: theme.border,
  },
  docNotesText: { fontSize: 11, color: theme.textMuted, flex: 1, fontStyle: 'italic' },
  docFooterRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.border,
  },
  openFileBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.primary, paddingVertical: 9, paddingHorizontal: 12,
  },
  openFileBtnText: { color: '#ffffff', fontSize: 11, fontWeight: '800' },
  inspectBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: theme.border, backgroundColor: theme.cardBg,
    paddingVertical: 9, paddingHorizontal: 12,
  },
  inspectBtnText: { color: theme.primaryLight, fontSize: 11, fontWeight: '800' },

  missingReqAlertCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.12)' : '#fef2f2',
    borderWidth: 1, borderColor: '#ef444440',
    borderLeftWidth: 3, borderLeftColor: '#ef4444',
    padding: 12, marginBottom: 14,
  },
  missingReqIconWrap: { marginRight: 10 },
  missingReqAlertTitle: { fontSize: 12, fontWeight: '800', color: '#ef4444', marginBottom: 2 },
  missingReqAlertSub: { fontSize: 10, color: theme.textMuted, lineHeight: 14 },
});
