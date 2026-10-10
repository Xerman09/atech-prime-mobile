import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform,
  ActivityIndicator, TextInput, Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useTheme, ThemeColors } from '../theme/ThemeContext';

interface AssignedAssetsScreenProps {
  onBack: () => void;
  token: string | null;
  employeeId?: number | null;
}

export interface AllocatedAsset {
  allocation_id?: number;
  asset_id?: number;
  asset_tag: string;
  asset_name: string;
  category?: string;
  model_number?: string;
  serial_number?: string;
  allocation_date?: string;
  expected_return_date?: string;
  condition?: string;
  condition_on_allocation?: string;
  status?: string;
  notes?: string;
}

export default function AssignedAssetsScreen({ onBack, token, employeeId }: AssignedAssetsScreenProps) {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);

  const [assets, setAssets] = useState<AllocatedAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedAsset, setSelectedAsset] = useState<AllocatedAsset | null>(null);

  const fetchAssets = async () => {
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
        const list = Array.isArray(data.allocated_assets) ? data.allocated_assets : [];
        setAssets(list);
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMsg(err.error || 'Failed to retrieve assigned equipment.');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Network error while retrieving assets.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [token]);

  const formatDate = (val?: string) => {
    if (!val || val === '0000-00-00' || val.startsWith('0000')) return '-';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return val;
      return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } catch {
      return val;
    }
  };

  const categories = ['ALL', ...Array.from(new Set(assets.map(a => a.category).filter(Boolean)))];

  const filteredAssets = assets.filter(a => {
    const matchesCategory = selectedCategory === 'ALL' || a.category === selectedCategory;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return matchesCategory;
    const matchesSearch =
      (a.asset_tag && a.asset_tag.toLowerCase().includes(q)) ||
      (a.asset_name && a.asset_name.toLowerCase().includes(q)) ||
      (a.model_number && a.model_number.toLowerCase().includes(q)) ||
      (a.serial_number && a.serial_number.toLowerCase().includes(q)) ||
      (a.category && a.category.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

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
          <Text style={styles.headerTitle}>Assigned Assets</Text>
          <Text style={styles.headerSubtitle}>Company Equipment & Tools in Custody</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchAssets} activeOpacity={0.7}>
          <Feather name="refresh-cw" size={17} color={theme.primaryLight} />
        </TouchableOpacity>
      </View>

      {/* Hero Summary Strip */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryMetric}>
          <Text style={styles.summaryMetricVal}>{assets.length}</Text>
          <Text style={styles.summaryMetricLbl}>Total Items</Text>
        </View>
        <View style={[styles.summaryMetric, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border }]}>
          <Text style={[styles.summaryMetricVal, { color: theme.emerald }]}>
            {assets.filter(a => a.status === 'Active' || !a.status).length}
          </Text>
          <Text style={styles.summaryMetricLbl}>Active Status</Text>
        </View>
        <View style={styles.summaryMetric}>
          <Text style={[styles.summaryMetricVal, { color: theme.primary }]}>
            {new Set(assets.map(a => a.category).filter(Boolean)).size}
          </Text>
          <Text style={styles.summaryMetricLbl}>Categories</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBox}>
          <Feather name="search" size={15} color={theme.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by tag, name, model, serial..."
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="x" size={14} color={theme.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Pills */}
      {categories.length > 2 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {categories.map(cat => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat as string}
                style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
                onPress={() => setSelectedCategory(cat as string)}
                activeOpacity={0.8}
              >
                <Text style={[styles.categoryPillText, isSelected && styles.categoryPillTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Main Content Area */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.emerald} />
          <Text style={styles.loadingText}>Retrieving Equipment Inventory...</Text>
          <Text style={styles.loadingSubtext}>Loading your custodial assignments</Text>
        </View>
      ) : errorMsg && assets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconWrap, { borderColor: theme.rose + '40', backgroundColor: theme.roseTint }]}>
            <Feather name="alert-circle" size={24} color={theme.rose} />
          </View>
          <Text style={styles.emptyTitle}>Unable to Load Assets</Text>
          <Text style={styles.emptySub}>{errorMsg}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchAssets} activeOpacity={0.8}>
            <Feather name="refresh-cw" size={13} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <View style={styles.resultsHeaderRow}>
            <Text style={styles.sectionLabel}>ASSIGNED EQUIPMENT LIST</Text>
            <Text style={styles.resultsCountBadge}>
              {filteredAssets.length} {filteredAssets.length === 1 ? 'ITEM' : 'ITEMS'}
            </Text>
          </View>

          {filteredAssets.length === 0 ? (
            <View style={styles.noAssetsCard}>
              <View style={styles.noAssetsIconWrap}>
                <Feather name="box" size={24} color={theme.textMuted} />
              </View>
              <Text style={styles.noAssetsTitle}>
                {searchQuery || selectedCategory !== 'ALL' ? 'No Matching Equipment' : 'No Company Assets Assigned'}
              </Text>
              <Text style={styles.noAssetsSub}>
                {searchQuery || selectedCategory !== 'ALL'
                  ? 'Try adjusting your search query or category filter.'
                  : 'You currently do not have any company hardware, devices, or equipment registered under your custody.'}
              </Text>
            </View>
          ) : (
            filteredAssets.map((asset, idx) => (
              <TouchableOpacity
                key={asset.allocation_id || asset.asset_id || idx}
                style={styles.assetCard}
                activeOpacity={0.9}
                onPress={() => setSelectedAsset(asset)}
              >
                {/* Header Row */}
                <View style={styles.assetCardHeader}>
                  <View style={styles.assetTagBadge}>
                    <Feather name="tag" size={11} color={theme.primaryLight} style={{ marginRight: 5 }} />
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
                    <Text style={styles.assetDetailLabel}>DATE ASSIGNED</Text>
                    <Text style={styles.assetDetailVal}>{formatDate(asset.allocation_date)}</Text>
                  </View>

                  {asset.condition ? (
                    <View style={styles.assetDetailItem}>
                      <Text style={styles.assetDetailLabel}>CONDITION</Text>
                      <View style={styles.assetConditionRow}>
                        <View style={[styles.conditionDot, {
                          backgroundColor: asset.condition === 'Brand New' || asset.condition === 'Good' ? theme.emerald : '#f59e0b'
                        }]} />
                        <Text style={styles.assetDetailVal}>{asset.condition}</Text>
                      </View>
                    </View>
                  ) : null}

                  {asset.expected_return_date ? (
                    <View style={styles.assetDetailItem}>
                      <Text style={styles.assetDetailLabel}>RETURN DUE</Text>
                      <Text style={[styles.assetDetailVal, { color: '#f59e0b' }]}>
                        {formatDate(asset.expected_return_date)}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Notes Strip */}
                {asset.notes ? (
                  <View style={styles.assetNotesBox}>
                    <Feather name="info" size={11} color={theme.textMuted} style={{ marginRight: 6 }} />
                    <Text style={styles.assetNotesText} numberOfLines={2}>{asset.notes}</Text>
                  </View>
                ) : null}

                {/* View Details Prompt */}
                <View style={styles.cardFooter}>
                  <Text style={styles.cardFooterText}>Tap to inspect allocation details</Text>
                  <Feather name="chevron-right" size={13} color={theme.primaryLight} />
                </View>
              </TouchableOpacity>
            ))
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      )}

      {/* Asset Detail Inspection Modal */}
      {selectedAsset && (
        <Modal
          visible={!!selectedAsset}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedAsset(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              {/* Modal Gradient Top Strip */}
              <LinearGradient
                colors={theme.accentGradient as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalGradientStrip}
              />

              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalCategory}>{selectedAsset.category || 'EQUIPMENT'}</Text>
                  <Text style={styles.modalTitle}>{selectedAsset.asset_name}</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setSelectedAsset(null)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Feather name="x" size={18} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Tag Banner */}
                <View style={styles.modalTagBanner}>
                  <View>
                    <Text style={styles.modalTagLabel}>PROPERTY ASSET TAG</Text>
                    <Text style={styles.modalTagValue}>{selectedAsset.asset_tag || 'ASSET-TAG'}</Text>
                  </View>
                  <View style={styles.modalStatusPill}>
                    <View style={[styles.conditionDot, { backgroundColor: theme.emerald }]} />
                    <Text style={styles.modalStatusText}>{selectedAsset.status || 'ACTIVE'}</Text>
                  </View>
                </View>

                {/* Field Rows */}
                <View style={styles.modalFieldsList}>
                  {selectedAsset.model_number ? (
                    <View style={styles.modalFieldRow}>
                      <Text style={styles.modalFieldLabel}>Model Number</Text>
                      <Text style={styles.modalFieldValue}>{selectedAsset.model_number}</Text>
                    </View>
                  ) : null}

                  {selectedAsset.serial_number ? (
                    <View style={styles.modalFieldRow}>
                      <Text style={styles.modalFieldLabel}>Serial Number</Text>
                      <Text style={styles.modalFieldValue}>{selectedAsset.serial_number}</Text>
                    </View>
                  ) : null}

                  <View style={styles.modalFieldRow}>
                    <Text style={styles.modalFieldLabel}>Assigned On</Text>
                    <Text style={styles.modalFieldValue}>{formatDate(selectedAsset.allocation_date)}</Text>
                  </View>

                  {selectedAsset.expected_return_date ? (
                    <View style={styles.modalFieldRow}>
                      <Text style={styles.modalFieldLabel}>Expected Return Date</Text>
                      <Text style={[styles.modalFieldValue, { color: '#f59e0b' }]}>
                        {formatDate(selectedAsset.expected_return_date)}
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.modalFieldRow}>
                    <Text style={styles.modalFieldLabel}>Current Condition</Text>
                    <Text style={styles.modalFieldValue}>{selectedAsset.condition || 'Good'}</Text>
                  </View>

                  {selectedAsset.condition_on_allocation ? (
                    <View style={styles.modalFieldRow}>
                      <Text style={styles.modalFieldLabel}>Condition on Issuance</Text>
                      <Text style={styles.modalFieldValue}>{selectedAsset.condition_on_allocation}</Text>
                    </View>
                  ) : null}

                  {selectedAsset.notes ? (
                    <View style={[styles.modalFieldRow, { borderBottomWidth: 0 }]}>
                      <Text style={styles.modalFieldLabel}>Custodial Remarks / Notes</Text>
                      <Text style={[styles.modalFieldValue, { marginTop: 4, fontWeight: '500' }]}>
                        {selectedAsset.notes}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Accountability Reminder */}
                <View style={styles.accountabilityBox}>
                  <Feather name="shield" size={14} color={theme.primaryLight} style={{ marginRight: 8, marginTop: 2 }} />
                  <Text style={styles.accountabilityText}>
                    This equipment is assigned under your company custody. Please ensure proper handling, periodic maintenance, and return upon completion of role requirements.
                  </Text>
                </View>
              </ScrollView>

              {/* Modal Footer */}
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.modalDismissBtn}
                  onPress={() => setSelectedAsset(null)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalDismissText}>Close Details</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  refreshBtn: { padding: 8, backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border },

  summaryBar: {
    flexDirection: 'row', backgroundColor: theme.cardBg,
    borderBottomWidth: 1, borderBottomColor: theme.border,
  },
  summaryMetric: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  summaryMetricVal: { fontSize: 16, fontWeight: '800', color: theme.textPrimary },
  summaryMetricLbl: { fontSize: 9, fontWeight: '700', color: theme.textMuted, letterSpacing: 0.5, marginTop: 2 },

  searchWrapper: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 8 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: theme.cardBg,
    borderWidth: 1, borderColor: theme.border, paddingHorizontal: 12, paddingVertical: 8,
  },
  searchInput: { flex: 1, fontSize: 13, color: theme.textPrimary, padding: 0 },

  categoryScroll: { paddingHorizontal: 20, paddingBottom: 10, gap: 8 },
  categoryPill: {
    paddingHorizontal: 12, paddingVertical: 6, backgroundColor: theme.cardBg,
    borderWidth: 1, borderColor: theme.border,
  },
  categoryPillActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  categoryPillText: { fontSize: 10, fontWeight: '700', color: theme.textMuted, letterSpacing: 0.5 },
  categoryPillTextActive: { color: '#ffffff' },

  body: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 32 },
  resultsHeaderRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12,
  },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, color: theme.textMuted },
  resultsCountBadge: {
    fontSize: 9, fontWeight: '800', color: theme.primaryLight,
    paddingHorizontal: 8, paddingVertical: 2, backgroundColor: theme.tealTint,
    borderWidth: 1, borderColor: theme.border,
  },

  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  loadingText: { marginTop: 16, fontSize: 14, fontWeight: '700', color: theme.textPrimary },
  loadingSubtext: { marginTop: 4, fontSize: 11, color: theme.textMuted },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  emptyIconWrap: { width: 50, height: 50, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: theme.textPrimary, marginBottom: 4 },
  emptySub: { fontSize: 12, color: theme.textMuted, textAlign: 'center', marginBottom: 16, lineHeight: 18 },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: theme.primary,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  retryText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },

  noAssetsCard: {
    backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border,
    padding: 28, alignItems: 'center', justifyContent: 'center',
  },
  noAssetsIconWrap: {
    width: 48, height: 48, alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.tealTint, borderWidth: 1, borderColor: theme.border, marginBottom: 12,
  },
  noAssetsTitle: { fontSize: 14, fontWeight: '800', color: theme.textPrimary, marginBottom: 6 },
  noAssetsSub: { fontSize: 11, color: theme.textMuted, textAlign: 'center', lineHeight: 17 },

  assetCard: {
    backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border,
    padding: 16, marginBottom: 12,
  },
  assetCardHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10,
  },
  assetTagBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: theme.tealTint,
    paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: theme.border,
  },
  assetTagText: {
    fontSize: 11, fontWeight: '800', color: theme.primaryLight,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  assetCategoryBadge: {
    paddingHorizontal: 8, paddingVertical: 3,
    backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9',
    borderWidth: 1, borderColor: theme.border,
  },
  assetCategoryText: { fontSize: 10, fontWeight: '700', color: theme.textMuted },
  assetName: { fontSize: 15, fontWeight: '800', color: theme.textPrimary, marginBottom: 12 },

  assetDetailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  assetDetailItem: { minWidth: '45%', flex: 1, marginBottom: 6 },
  assetDetailLabel: { fontSize: 9, fontWeight: '800', color: theme.textMuted, letterSpacing: 0.8, marginBottom: 2 },
  assetDetailVal: { fontSize: 12, fontWeight: '600', color: theme.textPrimary },
  assetConditionRow: { flexDirection: 'row', alignItems: 'center' },
  conditionDot: { width: 6, height: 6, marginRight: 6 },

  assetNotesBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
    padding: 8, marginTop: 10, borderWidth: 1, borderColor: theme.border,
  },
  assetNotesText: { fontSize: 11, color: theme.textMuted, flex: 1, fontStyle: 'italic' },

  cardFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.border,
  },
  cardFooterText: { fontSize: 11, color: theme.primaryLight, fontWeight: '700' },

  // Inspection Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center', justifyContent: 'center', padding: 20,
  },
  modalCard: {
    width: '100%', maxWidth: 440, maxHeight: '85%',
    backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border,
    overflow: 'hidden', position: 'relative',
  },
  modalGradientStrip: { height: 3, width: '100%' },
  modalHeader: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: theme.border,
  },
  modalCategory: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, color: theme.primaryLight, marginBottom: 2 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: theme.textPrimary },
  modalCloseBtn: { padding: 4 },
  modalBody: { padding: 16 },

  modalTagBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: theme.tealTint, borderWidth: 1, borderColor: theme.border,
    padding: 12, marginBottom: 16,
  },
  modalTagLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1, color: theme.textMuted },
  modalTagValue: {
    fontSize: 16, fontWeight: '900', color: theme.primaryLight,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', marginTop: 2,
  },
  modalStatusPill: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
    paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: theme.border,
  },
  modalStatusText: { fontSize: 10, fontWeight: '800', color: theme.emerald, letterSpacing: 0.5 },

  modalFieldsList: { borderWidth: 1, borderColor: theme.border, marginBottom: 16 },
  modalFieldRow: {
    padding: 12, borderBottomWidth: 1, borderBottomColor: theme.border,
    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.01)' : '#ffffff',
  },
  modalFieldLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8, color: theme.textMuted, marginBottom: 3 },
  modalFieldValue: { fontSize: 13, fontWeight: '700', color: theme.textPrimary },

  accountabilityBox: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: theme.tealTint,
    padding: 12, borderWidth: 1, borderColor: theme.border, marginBottom: 16,
  },
  accountabilityText: { fontSize: 11, color: theme.textSecondary, flex: 1, lineHeight: 16 },

  modalFooter: { padding: 12, borderTopWidth: 1, borderTopColor: theme.border },
  modalDismissBtn: {
    backgroundColor: theme.primary, paddingVertical: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  modalDismissText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
});
