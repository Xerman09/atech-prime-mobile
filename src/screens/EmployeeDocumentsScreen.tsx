import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform,
  ActivityIndicator, TextInput, Modal, Linking
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useTheme, ThemeColors } from '../theme/ThemeContext';

interface EmployeeDocumentsScreenProps {
  onBack: () => void;
  token: string | null;
  employeeId?: number | null;
}

export interface EmployeeDocument {
  id: number;
  employee_id: number;
  document_name: string;
  category: string;
  document_number?: string | null;
  issue_date?: string | null;
  expiry_date?: string | null;
  file_url: string;
  file_name: string;
  file_size?: number | null;
  mime_type?: string | null;
  status: 'Verified' | 'Pending Review' | 'Rejected' | 'Expired' | string;
  review_notes?: string | null;
  verified_by_name?: string | null;
  verified_at?: string | null;
  created_at?: string;
}

export default function EmployeeDocumentsScreen({ onBack, token, employeeId }: EmployeeDocumentsScreenProps) {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);

  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedDocument, setSelectedDocument] = useState<EmployeeDocument | null>(null);

  const getApiBaseUrl = () => {
    if (Platform.OS === 'web') {
      const hostname = typeof window !== 'undefined' && window.location?.hostname ? window.location.hostname : 'localhost';
      return `http://${hostname}/atech_prime/backend/public`;
    }
    return `http://192.168.100.31/atech_prime/backend/public`;
  };

  const fetchDocuments = async () => {
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
      setErrorMsg('Authentication token not found. Please log in.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const baseUrl = getApiBaseUrl();
      const endpoint = `api/employees/me`;
      const url = `${baseUrl}/${endpoint}`;

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
        const list = Array.isArray(data.uploaded_documents) ? data.uploaded_documents : [];
        setDocuments(list);
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMsg(err.error || 'Failed to retrieve uploaded documents.');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Network error while retrieving documents.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [token]);

  const formatDate = (val?: string | null) => {
    if (!val || val === '0000-00-00' || val.startsWith('0000')) return '-';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return val;
      return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } catch {
      return val;
    }
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes || bytes <= 0) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleOpenDocument = (fileUrl: string) => {
    if (!fileUrl) return;
    const baseUrl = getApiBaseUrl();
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

  const getStatusColor = (status?: string) => {
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

  const getExpiryStatus = (expiryDate?: string | null) => {
    if (!expiryDate || expiryDate === '0000-00-00' || expiryDate.startsWith('0000')) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(expiryDate);
    if (isNaN(exp.getTime())) return null;
    exp.setHours(0, 0, 0, 0);
    const diffTime = exp.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      return { label: 'EXPIRED', color: theme.rose, bg: theme.roseTint };
    }
    if (diffDays <= 30) {
      return { label: `EXPIRING IN ${diffDays}D`, color: '#d97706', bg: isDarkMode ? 'rgba(217, 119, 6, 0.15)' : '#fef3c7' };
    }
    return { label: `VALID (${diffDays}D)`, color: theme.emerald, bg: theme.tealTint };
  };

  const categories = ['ALL', ...Array.from(new Set(documents.map(d => d.category).filter(Boolean)))];

  const filteredDocs = documents.filter(d => {
    const matchesCategory = selectedCategory === 'ALL' || d.category === selectedCategory;
    const matchesStatus = selectedStatus === 'ALL' || d.status === selectedStatus;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return matchesCategory && matchesStatus;
    const matchesSearch =
      (d.document_name && d.document_name.toLowerCase().includes(q)) ||
      (d.document_number && d.document_number.toLowerCase().includes(q)) ||
      (d.file_name && d.file_name.toLowerCase().includes(q)) ||
      (d.category && d.category.toLowerCase().includes(q));
    return matchesCategory && matchesStatus && matchesSearch;
  });

  const verifiedCount = documents.filter(d => d.status === 'Verified').length;
  const pendingCount = documents.filter(d => d.status === 'Pending Review').length;

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
          <Text style={styles.headerTitle}>Uploaded Documents</Text>
          <Text style={styles.headerSubtitle}>Employee 201 Records & Official Files</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchDocuments} activeOpacity={0.7}>
          <Feather name="refresh-cw" size={17} color={theme.primaryLight} />
        </TouchableOpacity>
      </View>

      {/* Hero Summary Strip */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryMetric}>
          <Text style={styles.summaryMetricVal}>{documents.length}</Text>
          <Text style={styles.summaryMetricLbl}>Total Docs</Text>
        </View>
        <View style={[styles.summaryMetric, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border }]}>
          <Text style={[styles.summaryMetricVal, { color: theme.emerald }]}>
            {verifiedCount}
          </Text>
          <Text style={styles.summaryMetricLbl}>Verified</Text>
        </View>
        <View style={styles.summaryMetric}>
          <Text style={[styles.summaryMetricVal, { color: '#d97706' }]}>
            {pendingCount}
          </Text>
          <Text style={styles.summaryMetricLbl}>Pending</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBox}>
          <Feather name="search" size={15} color={theme.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search documents by name, category, or ref..."
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

      {/* Category Filter Pills */}
      {categories.length > 1 && (
        <View style={styles.filterStripContainer}>
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
        </View>
      )}

      {/* Main Content Area */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primaryLight} />
          <Text style={styles.loadingText}>Retrieving Employee Documents...</Text>
          <Text style={styles.loadingSubtext}>Loading your 201 file credentials</Text>
        </View>
      ) : errorMsg && documents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconWrap, { borderColor: theme.rose + '40', backgroundColor: theme.roseTint }]}>
            <Feather name="alert-circle" size={24} color={theme.rose} />
          </View>
          <Text style={styles.emptyTitle}>Unable to Load Documents</Text>
          <Text style={styles.emptySub}>{errorMsg}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchDocuments} activeOpacity={0.8}>
            <Feather name="refresh-cw" size={13} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <View style={styles.resultsHeaderRow}>
            <Text style={styles.sectionLabel}>DOCUMENT ARCHIVE & 201 FILE</Text>
            <Text style={styles.resultsCountBadge}>
              {filteredDocs.length} {filteredDocs.length === 1 ? 'FILE' : 'FILES'}
            </Text>
          </View>

          {filteredDocs.length === 0 ? (
            <View style={styles.noAssetsCard}>
              <View style={styles.noAssetsIconWrap}>
                <Feather name="file-text" size={24} color={theme.textMuted} />
              </View>
              <Text style={styles.noAssetsTitle}>
                {searchQuery || selectedCategory !== 'ALL' ? 'No Matching Documents' : 'No Uploaded Documents Found'}
              </Text>
              <Text style={styles.noAssetsSub}>
                {searchQuery || selectedCategory !== 'ALL'
                  ? 'Try adjusting your search query or category filter.'
                  : 'You currently do not have any official 201 file documents or credentials uploaded in the system.'}
              </Text>
            </View>
          ) : (
            filteredDocs.map((doc, idx) => {
              const statusCfg = getStatusColor(doc.status);
              const expiryCfg = getExpiryStatus(doc.expiry_date);
              const isPdf = (doc.mime_type && doc.mime_type.includes('pdf')) || (doc.file_name && doc.file_name.toLowerCase().endsWith('.pdf'));

              return (
                <View
                  key={doc.id || idx}
                  style={styles.docCard}
                >
                  {/* Header Row: Category Badge + Status Badge */}
                  <View style={styles.docCardHeader}>
                    <View style={styles.docCategoryBadge}>
                      <Feather name="folder" size={11} color={theme.primaryLight} style={{ marginRight: 5 }} />
                      <Text style={styles.docCategoryText}>{doc.category || 'General'}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg, borderColor: statusCfg.border }]}>
                      <Feather name={statusCfg.icon as any} size={11} color={statusCfg.text} style={{ marginRight: 4 }} />
                      <Text style={[styles.statusText, { color: statusCfg.text }]}>{doc.status || 'Pending'}</Text>
                    </View>
                  </View>

                  {/* Document Title & Reference Number */}
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
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={[styles.docDetailVal, expiryCfg ? { color: expiryCfg.color } : null]}>
                          {formatDate(doc.expiry_date)}
                        </Text>
                        {expiryCfg ? (
                          <View style={[styles.expiryChip, { backgroundColor: expiryCfg.bg }]}>
                            <Text style={[styles.expiryChipText, { color: expiryCfg.color }]}>{expiryCfg.label}</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>

                    <View style={styles.docDetailItem}>
                      <Text style={styles.docDetailLabel}>FILE NAME</Text>
                      <Text style={styles.docDetailVal} numberOfLines={1}>{doc.file_name || 'Attached Document'}</Text>
                    </View>

                    <View style={styles.docDetailItem}>
                      <Text style={styles.docDetailLabel}>FILE SIZE</Text>
                      <Text style={styles.docDetailVal}>{formatFileSize(doc.file_size)}</Text>
                    </View>
                  </View>

                  {/* Review Notes (if present) */}
                  {doc.review_notes ? (
                    <View style={styles.docNotesBox}>
                      <Feather name="message-square" size={11} color={theme.textMuted} style={{ marginRight: 6 }} />
                      <Text style={styles.docNotesText} numberOfLines={2}>{doc.review_notes}</Text>
                    </View>
                  ) : null}

                  {/* Action Buttons Row */}
                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      style={styles.openFileBtn}
                      onPress={() => handleOpenDocument(doc.file_url)}
                      activeOpacity={0.8}
                    >
                      <Feather name={isPdf ? 'file-text' : 'image'} size={13} color="#ffffff" style={{ marginRight: 6 }} />
                      <Text style={styles.openFileBtnText}>View File</Text>
                      <Feather name="external-link" size={11} color="#ffffff" style={{ marginLeft: 5 }} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.inspectBtn}
                      onPress={() => setSelectedDocument(doc)}
                      activeOpacity={0.8}
                    >
                      <Feather name="info" size={13} color={theme.primaryLight} style={{ marginRight: 5 }} />
                      <Text style={styles.inspectBtnText}>Details</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      )}

      {/* Document Detail Inspection Modal */}
      {selectedDocument && (
        <Modal
          visible={!!selectedDocument}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedDocument(null)}
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
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.modalCategory}>{selectedDocument.category || 'EMPLOYEE DOCUMENT'}</Text>
                  <Text style={styles.modalTitle} numberOfLines={2}>{selectedDocument.document_name}</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setSelectedDocument(null)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Feather name="x" size={18} color={theme.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Modal Scrollable Body */}
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Banner Strip */}
                <View style={styles.modalTagBanner}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalTagLabel}>DOCUMENT REFERENCE</Text>
                    <Text style={styles.modalTagValue}>{selectedDocument.document_number || 'N/A'}</Text>
                  </View>
                  <View style={[styles.statusBadge, {
                    backgroundColor: getStatusColor(selectedDocument.status).bg,
                    borderColor: getStatusColor(selectedDocument.status).border
                  }]}>
                    <Feather
                      name={getStatusColor(selectedDocument.status).icon as any}
                      size={11}
                      color={getStatusColor(selectedDocument.status).text}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.statusText, { color: getStatusColor(selectedDocument.status).text }]}>
                      {selectedDocument.status}
                    </Text>
                  </View>
                </View>

                {/* Metadata Fields List */}
                <View style={styles.modalFieldsList}>
                  <View style={styles.modalFieldRow}>
                    <Text style={styles.modalFieldLabel}>DOCUMENT NAME</Text>
                    <Text style={styles.modalFieldValue}>{selectedDocument.document_name}</Text>
                  </View>

                  <View style={styles.modalFieldRow}>
                    <Text style={styles.modalFieldLabel}>CLASSIFICATION / CATEGORY</Text>
                    <Text style={styles.modalFieldValue}>{selectedDocument.category || 'General'}</Text>
                  </View>

                  <View style={styles.modalFieldRow}>
                    <Text style={styles.modalFieldLabel}>ISSUE DATE</Text>
                    <Text style={styles.modalFieldValue}>{formatDate(selectedDocument.issue_date)}</Text>
                  </View>

                  <View style={styles.modalFieldRow}>
                    <Text style={styles.modalFieldLabel}>EXPIRATION DATE</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.modalFieldValue}>{formatDate(selectedDocument.expiry_date)}</Text>
                      {getExpiryStatus(selectedDocument.expiry_date) ? (
                        <View style={[styles.expiryChip, { backgroundColor: getExpiryStatus(selectedDocument.expiry_date)?.bg }]}>
                          <Text style={[styles.expiryChipText, { color: getExpiryStatus(selectedDocument.expiry_date)?.color }]}>
                            {getExpiryStatus(selectedDocument.expiry_date)?.label}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>

                  <View style={styles.modalFieldRow}>
                    <Text style={styles.modalFieldLabel}>ATTACHED FILE</Text>
                    <Text style={styles.modalFieldValue}>{selectedDocument.file_name || '-'}</Text>
                  </View>

                  <View style={styles.modalFieldRow}>
                    <Text style={styles.modalFieldLabel}>FILE SIZE & TYPE</Text>
                    <Text style={styles.modalFieldValue}>
                      {[formatFileSize(selectedDocument.file_size), selectedDocument.mime_type].filter(Boolean).join(' · ') || '-'}
                    </Text>
                  </View>

                  <View style={styles.modalFieldRow}>
                    <Text style={styles.modalFieldLabel}>UPLOAD DATE</Text>
                    <Text style={styles.modalFieldValue}>{formatDate(selectedDocument.created_at)}</Text>
                  </View>

                  {selectedDocument.verified_by_name ? (
                    <View style={styles.modalFieldRow}>
                      <Text style={styles.modalFieldLabel}>VERIFIED BY</Text>
                      <Text style={[styles.modalFieldValue, { color: theme.emerald }]}>
                        {selectedDocument.verified_by_name} {selectedDocument.verified_at ? `on ${formatDate(selectedDocument.verified_at)}` : ''}
                      </Text>
                    </View>
                  ) : null}

                  {selectedDocument.review_notes ? (
                    <View style={[styles.modalFieldRow, { borderBottomWidth: 0 }]}>
                      <Text style={styles.modalFieldLabel}>VERIFICATION & REVIEW NOTES</Text>
                      <Text style={[styles.modalFieldValue, { color: theme.textSecondary, fontWeight: '500', fontSize: 12 }]}>
                        {selectedDocument.review_notes}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Compliance Statement Box */}
                <View style={styles.complianceBox}>
                  <Feather name="shield" size={14} color={theme.primaryLight} style={{ marginRight: 8, marginTop: 1 }} />
                  <Text style={styles.complianceText}>
                    This record forms part of your official Employee 201 filing and institutional compliance documentation.
                  </Text>
                </View>
              </ScrollView>

              {/* Modal Footer */}
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.modalDownloadBtn}
                  onPress={() => handleOpenDocument(selectedDocument.file_url)}
                  activeOpacity={0.85}
                >
                  <Feather name="external-link" size={14} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={styles.modalDownloadText}>Open Document</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalDismissBtn}
                  onPress={() => setSelectedDocument(null)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalDismissText}>Close</Text>
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
    backgroundColor: theme.cardBg,
  },
  backBtn: {
    width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: theme.border, backgroundColor: theme.cardBg,
  },
  headerTitleWrap: { flex: 1, marginLeft: 14 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: theme.textPrimary, letterSpacing: 0.3 },
  headerSubtitle: { fontSize: 11, color: theme.textMuted, marginTop: 1 },
  refreshBtn: {
    width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: theme.border, backgroundColor: theme.cardBg,
  },

  summaryBar: {
    flexDirection: 'row', backgroundColor: theme.cardBg,
    borderBottomWidth: 1, borderBottomColor: theme.border,
  },
  summaryMetric: { flex: 1, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  summaryMetricVal: { fontSize: 18, fontWeight: '900', color: theme.textPrimary },
  summaryMetricLbl: { fontSize: 9, fontWeight: '800', color: theme.textMuted, letterSpacing: 0.8, marginTop: 2 },

  searchWrapper: {
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8,
    backgroundColor: theme.cardBg,
  },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc',
    borderWidth: 1, borderColor: theme.border,
    paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 10 : 8,
  },
  searchInput: { flex: 1, fontSize: 12, color: theme.textPrimary, padding: 0 },

  filterStripContainer: {
    backgroundColor: theme.cardBg, borderBottomWidth: 1, borderBottomColor: theme.border,
    paddingBottom: 10,
  },
  categoryScroll: { paddingHorizontal: 20, gap: 8 },
  categoryPill: {
    paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: theme.border,
    backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc',
  },
  categoryPillActive: {
    backgroundColor: theme.primary, borderColor: theme.primary,
  },
  categoryPillText: { fontSize: 11, fontWeight: '700', color: theme.textMuted },
  categoryPillTextActive: { color: '#ffffff' },

  body: { padding: 20 },
  resultsHeaderRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12,
  },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, color: theme.textMuted },
  resultsCountBadge: {
    fontSize: 10, fontWeight: '800', color: theme.primaryLight,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  loadingText: { fontSize: 14, fontWeight: '800', color: theme.textPrimary, marginTop: 14 },
  loadingSubtext: { fontSize: 11, color: theme.textMuted, marginTop: 4 },

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
  statusBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1,
  },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },

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

  expiryChip: { paddingHorizontal: 5, paddingVertical: 1, marginLeft: 6 },
  expiryChipText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },

  docNotesBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
    padding: 8, marginTop: 10, borderWidth: 1, borderColor: theme.border,
  },
  docNotesText: { fontSize: 11, color: theme.textMuted, flex: 1, fontStyle: 'italic' },

  cardActionsRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.border,
  },
  openFileBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.primary, paddingVertical: 9, paddingHorizontal: 12,
  },
  openFileBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '800' },
  inspectBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: theme.border, backgroundColor: theme.cardBg,
    paddingVertical: 9, paddingHorizontal: 14,
  },
  inspectBtnText: { color: theme.primaryLight, fontSize: 12, fontWeight: '800' },

  // Detail Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center', justifyContent: 'center', padding: 20,
  },
  modalCard: {
    width: '100%', maxWidth: 460, maxHeight: '85%',
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
    padding: 12, marginBottom: 14,
  },
  modalTagLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1, color: theme.textMuted },
  modalTagValue: {
    fontSize: 15, fontWeight: '900', color: theme.primaryLight,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', marginTop: 2,
  },

  modalFieldsList: { borderWidth: 1, borderColor: theme.border, marginBottom: 14 },
  modalFieldRow: {
    padding: 11, borderBottomWidth: 1, borderBottomColor: theme.border,
    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.01)' : '#ffffff',
  },
  modalFieldLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8, color: theme.textMuted, marginBottom: 2 },
  modalFieldValue: { fontSize: 12, fontWeight: '700', color: theme.textPrimary },

  complianceBox: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: theme.tealTint,
    padding: 12, borderWidth: 1, borderColor: theme.border, marginBottom: 14,
  },
  complianceText: { fontSize: 11, color: theme.textSecondary, flex: 1, lineHeight: 16 },

  modalFooter: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderTopWidth: 1, borderTopColor: theme.border,
  },
  modalDownloadBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.primary, paddingVertical: 11,
  },
  modalDownloadText: { color: '#ffffff', fontSize: 12, fontWeight: '800' },
  modalDismissBtn: {
    borderWidth: 1, borderColor: theme.border, backgroundColor: theme.cardBg,
    paddingVertical: 11, paddingHorizontal: 16,
  },
  modalDismissText: { color: theme.textPrimary, fontSize: 12, fontWeight: '700' },
});
