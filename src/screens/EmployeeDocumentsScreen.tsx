import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform,
  ActivityIndicator, TextInput, Modal, Linking, Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
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

export interface ComplianceChecklistItem {
  requirement_name: string;
  category: string;
  is_required: boolean;
  is_fulfilled: boolean;
  status: 'VERIFIED' | 'PENDING_APPROVAL' | 'REJECTED' | 'MISSING';
  document?: EmployeeDocument | null;
}

export interface ComplianceData {
  checklist: ComplianceChecklistItem[];
  fulfilled_count: number;
  pending_approval_count: number;
  required_count: number;
  missing_count: number;
  compliance_percentage: number;
}

const DOCUMENT_CATEGORIES = [
  'Contracts & Agreements',
  'Identification & Personal',
  'Government & Statutory Forms',
  'Medical & Health Clearance',
  'Academic & Credentials',
  'Performance & Promotions',
  'Disciplinary & Memorandums',
  'Exit & Offboarding',
  'Other'
];

export default function EmployeeDocumentsScreen({ onBack, token, employeeId }: EmployeeDocumentsScreenProps) {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);

  // Data states
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [compliance, setCompliance] = useState<ComplianceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Tab & Filtering
  const [activeTab, setActiveTab] = useState<'checklist' | 'archive'>('checklist');
  const [checklistFilter, setChecklistFilter] = useState<'ALL' | 'MISSING' | 'PENDING' | 'VERIFIED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Inspection & Viewer Modal States
  const [selectedDocument, setSelectedDocument] = useState<EmployeeDocument | null>(null);
  const [previewDocModal, setPreviewDocModal] = useState<EmployeeDocument | null>(null);

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Contracts & Agreements');
  const [uploadDocNumber, setUploadDocNumber] = useState('');
  const [uploadIssueDate, setUploadIssueDate] = useState('');
  const [uploadExpiryDate, setUploadExpiryDate] = useState('');
  const [pickedFile, setPickedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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
        if (data.compliance) {
          setCompliance(data.compliance);
        }
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

  const handleOpenDocument = (fileUrl?: string) => {
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

  const handleDownloadDocument = (doc: EmployeeDocument) => {
    if (!doc?.file_url) return;
    const baseUrl = getApiBaseUrl();
    const cleanUrl = doc.file_url.startsWith('/') ? doc.file_url : `/${doc.file_url}`;
    const fullUrl = `${baseUrl}${cleanUrl}`;

    if (Platform.OS === 'web') {
      try {
        const link = document.createElement('a');
        link.href = fullUrl;
        link.download = doc.file_name || doc.document_name || 'document';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        window.open(fullUrl, '_blank');
      }
    } else {
      Linking.openURL(fullUrl).catch(err => {
        console.error("Couldn't open/download document", err);
      });
    }
  };

  const openUploadForRequirement = (req: ComplianceChecklistItem) => {
    setUploadTitle(req.requirement_name);
    setUploadCategory(req.category || 'Contracts & Agreements');
    setUploadDocNumber('');
    setUploadIssueDate('');
    setUploadExpiryDate('');
    setPickedFile(null);
    setUploadError(null);
    setShowUploadModal(true);
  };

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPickedFile(result.assets[0]);
        setUploadError(null);
      }
    } catch (err: any) {
      setUploadError('Failed to select file. Please try again.');
    }
  };

  const handleUploadSubmit = async () => {
    if (!uploadTitle.trim()) {
      setUploadError('Document title is required.');
      return;
    }
    if (!pickedFile) {
      setUploadError('Please select a file to upload.');
      return;
    }

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
      setUploadError('Authentication error. Please log in again.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('document_name', uploadTitle.trim());
      formData.append('category', uploadCategory);
      if (uploadDocNumber.trim()) formData.append('document_number', uploadDocNumber.trim());
      if (uploadIssueDate.trim()) formData.append('issue_date', uploadIssueDate.trim());
      if (uploadExpiryDate.trim()) formData.append('expiry_date', uploadExpiryDate.trim());
      if (employeeId) formData.append('employee_id', employeeId.toString());

      if (Platform.OS === 'web' && (pickedFile as any).file) {
        formData.append('file', (pickedFile as any).file);
      } else {
        formData.append('file', {
          uri: pickedFile.uri,
          name: pickedFile.name,
          type: pickedFile.mimeType || 'application/octet-stream',
        } as any);
      }

      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/documents/employees`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${resolvedToken}`,
          'X-Authorization': `Bearer ${resolvedToken}`,
        },
        body: formData,
      });

      const resData = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(resData?.error || 'Failed to submit document for review.');
      }

      setShowUploadModal(false);
      setPickedFile(null);
      setUploadTitle('');
      setUploadDocNumber('');
      setUploadIssueDate('');
      setUploadExpiryDate('');
      setSuccessBanner('Document submitted successfully! It is now pending HR / Management review & approval.');
      setTimeout(() => setSuccessBanner(null), 5000);
      fetchDocuments();
    } catch (err: any) {
      setUploadError(err.message || 'Error occurred while submitting document.');
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Verified':
      case 'VERIFIED':
        return { text: theme.emerald, bg: theme.tealTint, border: theme.emerald + '40', icon: 'check-circle' };
      case 'Pending Review':
      case 'PENDING_APPROVAL':
        return { text: '#d97706', bg: isDarkMode ? 'rgba(217, 119, 6, 0.15)' : '#fef3c7', border: '#d9770640', icon: 'clock' };
      case 'Rejected':
      case 'REJECTED':
        return { text: theme.rose, bg: theme.roseTint, border: theme.rose + '40', icon: 'x-circle' };
      case 'MISSING':
        return { text: '#ef4444', bg: isDarkMode ? 'rgba(239, 68, 68, 0.12)' : '#fee2e2', border: '#ef444440', icon: 'alert-circle' };
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
    const q = searchQuery.trim().toLowerCase();
    if (!q) return matchesCategory;
    const matchesSearch =
      (d.document_name && d.document_name.toLowerCase().includes(q)) ||
      (d.document_number && d.document_number.toLowerCase().includes(q)) ||
      (d.file_name && d.file_name.toLowerCase().includes(q)) ||
      (d.category && d.category.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  const checklistItems = (compliance?.checklist || []).filter(item => {
    if (checklistFilter === 'MISSING') return item.status === 'MISSING';
    if (checklistFilter === 'PENDING') return item.status === 'PENDING_APPROVAL';
    if (checklistFilter === 'VERIFIED') return item.status === 'VERIFIED';
    return true;
  });

  const missingCount = compliance?.missing_count ?? checklistItems.filter(i => i.status === 'MISSING').length;
  const pendingCount = compliance?.pending_approval_count ?? documents.filter(d => d.status === 'Pending Review').length;
  const verifiedCount = compliance?.fulfilled_count ?? documents.filter(d => d.status === 'Verified').length;

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
          <Text style={styles.headerSubtitle}>Employee 201 Records & Compliance Files</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <TouchableOpacity
            style={styles.uploadNewBtn}
            onPress={() => {
              setUploadTitle('');
              setUploadCategory('Contracts & Agreements');
              setUploadDocNumber('');
              setUploadIssueDate('');
              setUploadExpiryDate('');
              setPickedFile(null);
              setUploadError(null);
              setShowUploadModal(true);
            }}
            activeOpacity={0.8}
          >
            <Feather name="upload" size={13} color="#ffffff" style={{ marginRight: 4 }} />
            <Text style={styles.uploadNewBtnText}>Upload</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.refreshBtn} onPress={fetchDocuments} activeOpacity={0.7}>
            <Feather name="refresh-cw" size={16} color={theme.primaryLight} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Success Notification Banner */}
      {successBanner && (
        <View style={styles.successBanner}>
          <Feather name="check-circle" size={14} color={theme.emerald} style={{ marginRight: 8, marginTop: 1 }} />
          <Text style={styles.successBannerText}>{successBanner}</Text>
        </View>
      )}

      {/* Summary Metrics Bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryMetric}>
          <Text style={[styles.summaryMetricVal, missingCount > 0 ? { color: '#ef4444' } : null]}>
            {missingCount}
          </Text>
          <Text style={styles.summaryMetricLbl}>Needs Upload</Text>
        </View>
        <View style={[styles.summaryMetric, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border }]}>
          <Text style={[styles.summaryMetricVal, { color: '#d97706' }]}>
            {pendingCount}
          </Text>
          <Text style={styles.summaryMetricLbl}>For Approval</Text>
        </View>
        <View style={styles.summaryMetric}>
          <Text style={[styles.summaryMetricVal, { color: theme.emerald }]}>
            {verifiedCount}
          </Text>
          <Text style={styles.summaryMetricLbl}>Verified</Text>
        </View>
      </View>

      {/* Navigation Segment Tabs: Checklist vs Uploaded Archive */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'checklist' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('checklist')}
          activeOpacity={0.8}
        >
          <Feather
            name="check-square"
            size={13}
            color={activeTab === 'checklist' ? '#ffffff' : theme.textMuted}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.segmentBtnText, activeTab === 'checklist' && styles.segmentBtnTextActive]}>
            Required Checklist
          </Text>
          {missingCount > 0 && (
            <View style={styles.missingBadgePill}>
              <Text style={styles.missingBadgePillText}>{missingCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'archive' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('archive')}
          activeOpacity={0.8}
        >
          <Feather
            name="folder"
            size={13}
            color={activeTab === 'archive' ? '#ffffff' : theme.textMuted}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.segmentBtnText, activeTab === 'archive' && styles.segmentBtnTextActive]}>
            All Uploaded Files ({documents.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sub Filter or Search Bar */}
      {activeTab === 'checklist' ? (
        <View style={styles.filterStripContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {[
              { id: 'ALL', label: `ALL (${compliance?.checklist?.length || 0})` },
              { id: 'MISSING', label: `NEEDS UPLOAD (${missingCount})` },
              { id: 'PENDING', label: `AWAITING APPROVAL (${pendingCount})` },
              { id: 'VERIFIED', label: `VERIFIED (${verifiedCount})` },
            ].map(f => {
              const isSelected = checklistFilter === f.id;
              return (
                <TouchableOpacity
                  key={f.id}
                  style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
                  onPress={() => setChecklistFilter(f.id as any)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.categoryPillText, isSelected && styles.categoryPillTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      ) : (
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
      )}

      {/* Main Content Area */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primaryLight} />
          <Text style={styles.loadingText}>Retrieving Employee Documents...</Text>
          <Text style={styles.loadingSubtext}>Loading your 201 file credentials and requirements</Text>
        </View>
      ) : errorMsg && documents.length === 0 && (!compliance || compliance.checklist.length === 0) ? (
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
          {activeTab === 'checklist' ? (
            /* TAB 1: REQUIRED DOCUMENTS CHECKLIST */
            <>
              <View style={styles.resultsHeaderRow}>
                <Text style={styles.sectionLabel}>OFFICIAL 201 REQUIREMENTS CHECKLIST</Text>
                <Text style={styles.resultsCountBadge}>
                  {checklistItems.length} {checklistItems.length === 1 ? 'ITEM' : 'ITEMS'}
                </Text>
              </View>

              {/* Institutional Notice Card */}
              <View style={styles.complianceNoticeBox}>
                <Feather name="shield" size={14} color={theme.primaryLight} style={{ marginRight: 8, marginTop: 1 }} />
                <Text style={styles.complianceNoticeText}>
                  Uploaded files are automatically routed for Institutional / HR review and approval. Once verified by an administrator, the status will update to Verified.
                </Text>
              </View>

              {checklistItems.length === 0 ? (
                <View style={styles.noAssetsCard}>
                  <View style={styles.noAssetsIconWrap}>
                    <Feather name="check-circle" size={24} color={theme.emerald} />
                  </View>
                  <Text style={styles.noAssetsTitle}>No Items In This View</Text>
                  <Text style={styles.noAssetsSub}>All requirements under this filter are satisfied.</Text>
                </View>
              ) : (
                checklistItems.map((item, idx) => {
                  const isMissing = item.status === 'MISSING';
                  const isPending = item.status === 'PENDING_APPROVAL';
                  const isVerified = item.status === 'VERIFIED';
                  const isRejected = item.status === 'REJECTED';
                  const statusCfg = getStatusColor(item.status);

                  return (
                    <View
                      key={idx}
                      style={[
                        styles.reqCard,
                        isMissing && styles.reqCardMissing,
                        isPending && styles.reqCardPending,
                      ]}
                    >
                      {/* Top Header of Card */}
                      <View style={styles.docCardHeader}>
                        <View style={styles.docCategoryBadge}>
                          <Feather name="folder" size={10} color={theme.primaryLight} style={{ marginRight: 4 }} />
                          <Text style={styles.docCategoryText}>{item.category}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg, borderColor: statusCfg.border }]}>
                          <Feather name={statusCfg.icon as any} size={10} color={statusCfg.text} style={{ marginRight: 4 }} />
                          <Text style={[styles.statusText, { color: statusCfg.text }]}>
                            {isMissing ? 'NOT UPLOADED' : (isPending ? 'FOR APPROVAL' : (isVerified ? 'VERIFIED' : 'REJECTED'))}
                          </Text>
                        </View>
                      </View>

                      {/* Requirement Name */}
                      <Text style={styles.reqTitle}>{item.requirement_name}</Text>
                      <View style={styles.reqMetaRow}>
                        <Text style={[styles.reqTypeBadge, item.is_required ? styles.reqMandatory : styles.reqOptional]}>
                          {item.is_required ? 'MANDATORY' : 'OPTIONAL'}
                        </Text>
                        <Text style={styles.reqSubInfo}>
                          {isMissing
                            ? 'Action Required: File still needed for 201 compliance'
                            : (isPending
                              ? `Submitted on ${formatDate(item.document?.created_at)} · Awaiting HR approval`
                              : (isVerified
                                ? 'Verified and approved by Institutional HR'
                                : 'Rejected: Please review notes and re-upload'))}
                        </Text>
                      </View>

                      {/* If document attached, show file details */}
                      {item.document ? (
                        <View style={styles.attachedFileBox}>
                          <Feather name="paperclip" size={12} color={theme.primaryLight} style={{ marginRight: 6 }} />
                          <Text style={styles.attachedFileName} numberOfLines={1}>
                            {item.document.file_name || item.document.document_name}
                          </Text>
                          <Text style={styles.attachedFileSize}>{formatFileSize(item.document.file_size)}</Text>
                        </View>
                      ) : null}

                      {/* Review notes if rejected */}
                      {item.document?.review_notes ? (
                        <View style={styles.docNotesBox}>
                          <Feather name="message-square" size={11} color={theme.rose} style={{ marginRight: 6 }} />
                          <Text style={[styles.docNotesText, { color: theme.rose }]} numberOfLines={2}>
                            Reviewer notes: {item.document.review_notes}
                          </Text>
                        </View>
                      ) : null}

                      {/* Action Button Row */}
                      <View style={styles.cardActionsRow}>
                        {isMissing || isRejected ? (
                          <TouchableOpacity
                            style={styles.uploadReqBtn}
                            onPress={() => openUploadForRequirement(item)}
                            activeOpacity={0.8}
                          >
                            <Feather name="upload-cloud" size={13} color="#ffffff" style={{ marginRight: 6 }} />
                            <Text style={styles.uploadReqBtnText}>
                              {isRejected ? 'Re-upload Document' : 'Upload Document'}
                            </Text>
                          </TouchableOpacity>
                        ) : null}

                        {item.document ? (
                          <>
                            <TouchableOpacity
                              style={styles.openFileBtn}
                              onPress={() => setPreviewDocModal(item.document || null)}
                              activeOpacity={0.8}
                            >
                              <Feather name="eye" size={12} color="#ffffff" style={{ marginRight: 5 }} />
                              <Text style={styles.openFileBtnText}>View File</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.downloadIconBtn}
                              onPress={() => item.document && handleDownloadDocument(item.document)}
                              activeOpacity={0.8}
                            >
                              <Feather name="download" size={12} color={theme.textPrimary} />
                            </TouchableOpacity>
                          </>
                        ) : null}

                        {item.document ? (
                          <TouchableOpacity
                            style={styles.inspectBtn}
                            onPress={() => setSelectedDocument(item.document || null)}
                            activeOpacity={0.8}
                          >
                            <Feather name="info" size={12} color={theme.primaryLight} style={{ marginRight: 4 }} />
                            <Text style={styles.inspectBtnText}>Details</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    </View>
                  );
                })
              )}
            </>
          ) : (
            /* TAB 2: ALL UPLOADED FILES ARCHIVE */
            <>
              <View style={styles.resultsHeaderRow}>
                <Text style={styles.sectionLabel}>UPLOADED DOCUMENTS ARCHIVE</Text>
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
                    {searchQuery ? 'No Matching Documents' : 'No Uploaded Documents Found'}
                  </Text>
                  <Text style={styles.noAssetsSub}>
                    {searchQuery
                      ? 'Try adjusting your search query.'
                      : 'You currently do not have any official 201 file documents uploaded.'}
                  </Text>
                </View>
              ) : (
                filteredDocs.map((doc, idx) => {
                  const statusCfg = getStatusColor(doc.status);
                  const expiryCfg = getExpiryStatus(doc.expiry_date);
                  const isPdf = (doc.mime_type && doc.mime_type.includes('pdf')) || (doc.file_name && doc.file_name.toLowerCase().endsWith('.pdf'));

                  return (
                    <View key={doc.id || idx} style={styles.docCard}>
                      <View style={styles.docCardHeader}>
                        <View style={styles.docCategoryBadge}>
                          <Feather name="folder" size={10} color={theme.primaryLight} style={{ marginRight: 4 }} />
                          <Text style={styles.docCategoryText}>{doc.category || 'General'}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg, borderColor: statusCfg.border }]}>
                          <Feather name={statusCfg.icon as any} size={10} color={statusCfg.text} style={{ marginRight: 4 }} />
                          <Text style={[styles.statusText, { color: statusCfg.text }]}>{doc.status || 'Pending'}</Text>
                        </View>
                      </View>

                      <Text style={styles.docTitle}>{doc.document_name}</Text>
                      {doc.document_number ? (
                        <View style={styles.docRefRow}>
                          <Text style={styles.docRefLabel}>REF / DOC NO:</Text>
                          <Text style={styles.docRefVal}>{doc.document_number}</Text>
                        </View>
                      ) : null}

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

                      {doc.review_notes ? (
                        <View style={styles.docNotesBox}>
                          <Feather name="message-square" size={11} color={theme.textMuted} style={{ marginRight: 6 }} />
                          <Text style={styles.docNotesText} numberOfLines={2}>{doc.review_notes}</Text>
                        </View>
                      ) : null}

                      <View style={styles.cardActionsRow}>
                        <TouchableOpacity
                          style={styles.openFileBtn}
                          onPress={() => setPreviewDocModal(doc)}
                          activeOpacity={0.8}
                        >
                          <Feather name="eye" size={12} color="#ffffff" style={{ marginRight: 5 }} />
                          <Text style={styles.openFileBtnText}>View File</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.downloadIconBtn}
                          onPress={() => handleDownloadDocument(doc)}
                          activeOpacity={0.8}
                        >
                          <Feather name="download" size={12} color={theme.textPrimary} />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.inspectBtn}
                          onPress={() => setSelectedDocument(doc)}
                          activeOpacity={0.8}
                        >
                          <Feather name="info" size={12} color={theme.primaryLight} style={{ marginRight: 4 }} />
                          <Text style={styles.inspectBtnText}>Details</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      )}

      {/* Upload Document Modal (Always Submitted for Approval) */}
      <Modal
        visible={showUploadModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isUploading) setShowUploadModal(false);
        }}
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
                <Text style={styles.modalCategory}>OFFICIAL 201 FILE SUBMISSION</Text>
                <Text style={styles.modalTitle}>Upload Document for Approval</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowUploadModal(false)}
                disabled={isUploading}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="x" size={18} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Approval Notice */}
              <View style={styles.approvalNoticeCard}>
                <Feather name="info" size={14} color="#d97706" style={{ marginRight: 8, marginTop: 1 }} />
                <Text style={styles.approvalNoticeText}>
                  All uploads are recorded with status "Pending Review" and routed to Institutional HR / Management for formal verification.
                </Text>
              </View>

              {uploadError && (
                <View style={styles.uploadErrorBox}>
                  <Feather name="alert-triangle" size={13} color={theme.rose} style={{ marginRight: 6 }} />
                  <Text style={styles.uploadErrorText}>{uploadError}</Text>
                </View>
              )}

              {/* Document Title Input */}
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>DOCUMENT TITLE *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. SSS Form, Primary ID, Contract..."
                  placeholderTextColor={theme.textMuted}
                  value={uploadTitle}
                  onChangeText={setUploadTitle}
                  editable={!isUploading}
                />
              </View>

              {/* Category Selector */}
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>CATEGORY / CLASSIFICATION *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryPickerRow}>
                  {DOCUMENT_CATEGORIES.map(cat => {
                    const isSelected = uploadCategory === cat;
                    return (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.catPickChip, isSelected && styles.catPickChipActive]}
                        onPress={() => setUploadCategory(cat)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.catPickChipText, isSelected && styles.catPickChipTextActive]}>
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Document Number */}
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>REFERENCE / DOCUMENT NUMBER (OPTIONAL)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 12-3456789-0"
                  placeholderTextColor={theme.textMuted}
                  value={uploadDocNumber}
                  onChangeText={setUploadDocNumber}
                  editable={!isUploading}
                />
              </View>

              {/* Dates Row */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={[styles.formField, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>ISSUE DATE</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={theme.textMuted}
                    value={uploadIssueDate}
                    onChangeText={setUploadIssueDate}
                    editable={!isUploading}
                  />
                </View>

                <View style={[styles.formField, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>EXPIRY DATE</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={theme.textMuted}
                    value={uploadExpiryDate}
                    onChangeText={setUploadExpiryDate}
                    editable={!isUploading}
                  />
                </View>
              </View>

              {/* File Attachment Section */}
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>DOCUMENT FILE (PDF OR IMAGE) *</Text>
                {pickedFile ? (
                  <View style={styles.pickedFileBox}>
                    <Feather name="file-text" size={20} color={theme.primaryLight} style={{ marginRight: 10 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pickedFileName} numberOfLines={1}>{pickedFile.name}</Text>
                      <Text style={styles.pickedFileSize}>{formatFileSize(pickedFile.size)}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removeFileBtn}
                      onPress={() => setPickedFile(null)}
                      disabled={isUploading}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Feather name="trash-2" size={14} color={theme.rose} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.chooseFileBtn}
                    onPress={handlePickFile}
                    disabled={isUploading}
                    activeOpacity={0.8}
                  >
                    <Feather name="upload-cloud" size={20} color={theme.primaryLight} style={{ marginBottom: 6 }} />
                    <Text style={styles.chooseFileBtnText}>Tap to select document file</Text>
                    <Text style={styles.chooseFileSubtext}>Supports PDF, PNG, JPG (Max 10MB)</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalDownloadBtn, isUploading && { opacity: 0.7 }]}
                onPress={handleUploadSubmit}
                disabled={isUploading}
                activeOpacity={0.85}
              >
                {isUploading ? (
                  <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 8 }} />
                ) : (
                  <Feather name="send" size={13} color="#ffffff" style={{ marginRight: 6 }} />
                )}
                <Text style={styles.modalDownloadText}>
                  {isUploading ? 'Uploading...' : 'Submit for Approval'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalDismissBtn}
                onPress={() => setShowUploadModal(false)}
                disabled={isUploading}
                activeOpacity={0.8}
              >
                <Text style={styles.modalDismissText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
              <LinearGradient
                colors={theme.accentGradient as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalGradientStrip}
              />

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

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
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

                <View style={styles.complianceBox}>
                  <Feather name="shield" size={14} color={theme.primaryLight} style={{ marginRight: 8, marginTop: 1 }} />
                  <Text style={styles.complianceText}>
                    This record forms part of your official Employee 201 filing and institutional compliance documentation.
                  </Text>
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.modalDownloadBtn}
                  onPress={() => {
                    const doc = selectedDocument;
                    setSelectedDocument(null);
                    setPreviewDocModal(doc);
                  }}
                  activeOpacity={0.85}
                >
                  <Feather name="eye" size={14} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.modalDownloadText}>View File</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalDismissBtn}
                  onPress={() => handleDownloadDocument(selectedDocument)}
                  activeOpacity={0.85}
                >
                  <Feather name="download" size={13} color={theme.textPrimary} style={{ marginRight: 5 }} />
                  <Text style={styles.modalDismissText}>Download</Text>
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

      {/* ══════════════════════════════════════════════════════════
          MODAL 3: IN-APP DOCUMENT PREVIEW & DOWNLOADER MODAL
          ══════════════════════════════════════════════════════════ */}
      {previewDocModal && (
        <Modal
          visible={!!previewDocModal}
          transparent
          animationType="fade"
          onRequestClose={() => setPreviewDocModal(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, styles.viewerModalCard]}>
              <LinearGradient
                colors={theme.accentGradient as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalGradientStrip}
              />

              <View style={styles.modalHeader}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.modalCategory}>{previewDocModal.category || 'OFFICIAL 201 RECORD'}</Text>
                  <Text style={styles.modalTitle} numberOfLines={1}>{previewDocModal.document_name}</Text>
                  <Text style={{ fontSize: 10, color: theme.textMuted, marginTop: 2 }}>
                    {previewDocModal.file_name} • {formatFileSize(previewDocModal.file_size)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setPreviewDocModal(null)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Feather name="x" size={18} color={theme.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Viewer Body */}
              <View style={styles.viewerBody}>
                {(() => {
                  const baseUrl = getApiBaseUrl();
                  const cleanUrl = previewDocModal.file_url.startsWith('/') ? previewDocModal.file_url : `/${previewDocModal.file_url}`;
                  const fullUrl = `${baseUrl}${cleanUrl}`;
                  const isImage = (previewDocModal.mime_type && previewDocModal.mime_type.includes('image')) ||
                    /\.(png|jpe?g|webp|gif)$/i.test(previewDocModal.file_name || '');
                  const isPdf = (previewDocModal.mime_type && previewDocModal.mime_type.includes('pdf')) ||
                    /\.pdf$/i.test(previewDocModal.file_name || '');

                  if (isImage) {
                    return (
                      <View style={styles.imageViewerWrap}>
                        <Image
                          source={{ uri: fullUrl }}
                          style={styles.previewImage}
                          resizeMode="contain"
                        />
                      </View>
                    );
                  }

                  if (isPdf && Platform.OS === 'web') {
                    return (
                      <iframe
                        src={fullUrl}
                        style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#ffffff' }}
                        title={previewDocModal.document_name}
                      />
                    );
                  }

                  return (
                    <View style={styles.fileFallbackBox}>
                      <View style={styles.fileFallbackIconWrap}>
                        <Feather name="file-text" size={36} color={theme.primaryLight} />
                      </View>
                      <Text style={styles.fileFallbackTitle}>{previewDocModal.document_name}</Text>
                      <Text style={styles.fileFallbackSub}>{previewDocModal.file_name}</Text>
                      <Text style={styles.fileFallbackDesc}>
                        Format: {previewDocModal.mime_type || (isPdf ? 'PDF Document' : 'Official Document')} • {formatFileSize(previewDocModal.file_size)}
                      </Text>
                      <TouchableOpacity
                        style={styles.fallbackDownloadBtn}
                        onPress={() => handleDownloadDocument(previewDocModal)}
                        activeOpacity={0.85}
                      >
                        <Feather name="download" size={14} color="#ffffff" style={{ marginRight: 6 }} />
                        <Text style={styles.fallbackDownloadText}>Download File</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })()}
              </View>

              {/* Viewer Footer */}
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.modalDownloadBtn}
                  onPress={() => handleDownloadDocument(previewDocModal)}
                  activeOpacity={0.85}
                >
                  <Feather name="download" size={14} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.modalDownloadText}>Download Document</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalDismissBtn}
                  onPress={() => handleOpenDocument(previewDocModal.file_url)}
                  activeOpacity={0.8}
                >
                  <Feather name="external-link" size={13} color={theme.textPrimary} style={{ marginRight: 5 }} />
                  <Text style={styles.modalDismissText}>Open Tab</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalDismissBtn}
                  onPress={() => setPreviewDocModal(null)}
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
    paddingTop: Platform.OS === 'ios' ? 50 : 30, paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: theme.border,
    backgroundColor: theme.cardBg,
  },
  backBtn: {
    width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: theme.border, backgroundColor: theme.cardBg,
  },
  headerTitleWrap: { flex: 1, marginLeft: 12 },
  headerTitle: { fontSize: 15, fontWeight: '800', color: theme.textPrimary, letterSpacing: 0.3 },
  headerSubtitle: { fontSize: 10, color: theme.textMuted, marginTop: 1 },
  uploadNewBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.primary, paddingHorizontal: 10, paddingVertical: 8,
  },
  uploadNewBtnText: { color: '#ffffff', fontSize: 11, fontWeight: '800' },
  refreshBtn: {
    width: 34, height: 34, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: theme.border, backgroundColor: theme.cardBg,
  },

  successBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5',
    borderBottomWidth: 1, borderBottomColor: theme.emerald + '40',
    paddingHorizontal: 16, paddingVertical: 10,
  },
  successBannerText: { fontSize: 11, fontWeight: '700', color: theme.emerald, flex: 1, lineHeight: 16 },

  summaryBar: {
    flexDirection: 'row', backgroundColor: theme.cardBg,
    borderBottomWidth: 1, borderBottomColor: theme.border,
  },
  summaryMetric: { flex: 1, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  summaryMetricVal: { fontSize: 16, fontWeight: '900', color: theme.textPrimary },
  summaryMetricLbl: { fontSize: 8, fontWeight: '800', color: theme.textMuted, letterSpacing: 0.8, marginTop: 2 },

  segmentContainer: {
    flexDirection: 'row', backgroundColor: theme.cardBg,
    borderBottomWidth: 1, borderBottomColor: theme.border, padding: 6, gap: 6,
  },
  segmentBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 9, borderWidth: 1, borderColor: theme.border,
    backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc',
  },
  segmentBtnActive: {
    backgroundColor: theme.primary, borderColor: theme.primary,
  },
  segmentBtnText: { fontSize: 11, fontWeight: '700', color: theme.textMuted },
  segmentBtnTextActive: { color: '#ffffff', fontWeight: '800' },
  missingBadgePill: {
    backgroundColor: '#ef4444', paddingHorizontal: 5, paddingVertical: 1, marginLeft: 6,
  },
  missingBadgePillText: { color: '#ffffff', fontSize: 9, fontWeight: '900' },

  filterStripContainer: {
    backgroundColor: theme.cardBg, borderBottomWidth: 1, borderBottomColor: theme.border,
    paddingVertical: 8,
  },
  categoryScroll: { paddingHorizontal: 16, gap: 8 },
  categoryPill: {
    paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: theme.border,
    backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc',
  },
  categoryPillActive: {
    backgroundColor: theme.primary, borderColor: theme.primary,
  },
  categoryPillText: { fontSize: 10, fontWeight: '700', color: theme.textMuted },
  categoryPillTextActive: { color: '#ffffff', fontWeight: '800' },

  searchWrapper: {
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8,
    backgroundColor: theme.cardBg, borderBottomWidth: 1, borderBottomColor: theme.border,
  },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc',
    borderWidth: 1, borderColor: theme.border,
    paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 8 : 6,
  },
  searchInput: { flex: 1, fontSize: 12, color: theme.textPrimary, padding: 0 },

  body: { padding: 16 },
  resultsHeaderRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10,
  },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, color: theme.textMuted },
  resultsCountBadge: {
    fontSize: 10, fontWeight: '800', color: theme.primaryLight,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  complianceNoticeBox: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: theme.tealTint, borderWidth: 1, borderColor: theme.border,
    padding: 10, marginBottom: 12,
  },
  complianceNoticeText: { fontSize: 10, color: theme.textSecondary, flex: 1, lineHeight: 15 },

  // Requirement Card
  reqCard: {
    backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border,
    padding: 14, marginBottom: 10,
  },
  reqCardMissing: {
    borderLeftWidth: 3, borderLeftColor: '#ef4444',
  },
  reqCardPending: {
    borderLeftWidth: 3, borderLeftColor: '#d97706',
  },
  reqTitle: { fontSize: 14, fontWeight: '800', color: theme.textPrimary, marginBottom: 4 },
  reqMetaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  reqTypeBadge: { fontSize: 8, fontWeight: '900', letterSpacing: 0.5, paddingHorizontal: 5, paddingVertical: 1 },
  reqMandatory: {
    backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2',
    color: '#ef4444', borderWidth: 1, borderColor: '#ef444440',
  },
  reqOptional: {
    backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9',
    color: theme.textMuted, borderWidth: 1, borderColor: theme.border,
  },
  reqSubInfo: { fontSize: 10, color: theme.textMuted, flex: 1 },

  attachedFileBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc',
    padding: 8, borderWidth: 1, borderColor: theme.border, marginBottom: 8,
  },
  attachedFileName: { fontSize: 11, fontWeight: '700', color: theme.textPrimary, flex: 1 },
  attachedFileSize: { fontSize: 10, color: theme.textMuted, marginLeft: 8 },

  uploadReqBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.primary, paddingVertical: 9, paddingHorizontal: 12,
  },
  uploadReqBtnText: { color: '#ffffff', fontSize: 11, fontWeight: '800' },

  // Archive Card
  docCard: {
    backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border,
    padding: 14, marginBottom: 10,
  },
  docCardHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8,
  },
  docCategoryBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: theme.tealTint,
    paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: theme.border,
  },
  docCategoryText: { fontSize: 9, fontWeight: '800', color: theme.primaryLight, letterSpacing: 0.5 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1,
  },
  statusText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },
  docTitle: { fontSize: 14, fontWeight: '800', color: theme.textPrimary, marginBottom: 4 },
  docRefRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  docRefLabel: { fontSize: 9, fontWeight: '800', color: theme.textMuted, letterSpacing: 0.8, marginRight: 6 },
  docRefVal: {
    fontSize: 10, fontWeight: '800', color: theme.primaryLight,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  docDetailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 2 },
  docDetailItem: { minWidth: '45%', flex: 1, marginBottom: 4 },
  docDetailLabel: { fontSize: 8, fontWeight: '800', color: theme.textMuted, letterSpacing: 0.8, marginBottom: 2 },
  docDetailVal: { fontSize: 11, fontWeight: '600', color: theme.textPrimary },
  expiryChip: { paddingHorizontal: 5, paddingVertical: 1, marginLeft: 6 },
  expiryChipText: { fontSize: 8, fontWeight: '800', letterSpacing: 0.3 },
  docNotesBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
    padding: 8, marginTop: 8, borderWidth: 1, borderColor: theme.border,
  },
  docNotesText: { fontSize: 10, color: theme.textMuted, flex: 1, fontStyle: 'italic' },
  cardActionsRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.border,
  },
  openFileBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.primary, paddingVertical: 8, paddingHorizontal: 12,
  },
  openFileBtnText: { color: '#ffffff', fontSize: 11, fontWeight: '800' },
  inspectBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: theme.border, backgroundColor: theme.cardBg,
    paddingVertical: 8, paddingHorizontal: 12,
  },
  inspectBtnText: { color: theme.primaryLight, fontSize: 11, fontWeight: '800' },

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
    padding: 24, alignItems: 'center', justifyContent: 'center',
  },
  noAssetsIconWrap: {
    width: 44, height: 44, alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.tealTint, borderWidth: 1, borderColor: theme.border, marginBottom: 10,
  },
  noAssetsTitle: { fontSize: 13, fontWeight: '800', color: theme.textPrimary, marginBottom: 4 },
  noAssetsSub: { fontSize: 11, color: theme.textMuted, textAlign: 'center', lineHeight: 16 },

  // Upload Modal Styles
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center', justifyContent: 'center', padding: 16,
  },
  modalCard: {
    width: '100%', maxWidth: 460, maxHeight: '85%',
    backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border,
    overflow: 'hidden', position: 'relative',
  },
  modalGradientStrip: { height: 3, width: '100%' },
  modalHeader: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    padding: 14, borderBottomWidth: 1, borderBottomColor: theme.border,
  },
  modalCategory: { fontSize: 9, fontWeight: '800', letterSpacing: 1.2, color: theme.primaryLight, marginBottom: 2 },
  modalTitle: { fontSize: 15, fontWeight: '800', color: theme.textPrimary },
  modalCloseBtn: { padding: 4 },
  modalBody: { padding: 14 },

  approvalNoticeCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: isDarkMode ? 'rgba(217, 119, 6, 0.12)' : '#fef3c7',
    borderWidth: 1, borderColor: '#d9770640',
    padding: 10, marginBottom: 12,
  },
  approvalNoticeText: { fontSize: 10, color: '#d97706', flex: 1, lineHeight: 15, fontWeight: '600' },

  uploadErrorBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.roseTint, borderWidth: 1, borderColor: theme.rose + '40',
    padding: 10, marginBottom: 12,
  },
  uploadErrorText: { fontSize: 11, color: theme.rose, flex: 1, fontWeight: '700' },

  formField: { marginBottom: 12 },
  fieldLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8, color: theme.textMuted, marginBottom: 5 },
  textInput: {
    borderWidth: 1, borderColor: theme.border, backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc',
    paddingHorizontal: 10, paddingVertical: 8, fontSize: 12, color: theme.textPrimary,
  },

  categoryPickerRow: { gap: 6, paddingVertical: 2 },
  catPickChip: {
    paddingHorizontal: 8, paddingVertical: 5, borderWidth: 1, borderColor: theme.border,
    backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc',
  },
  catPickChipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  catPickChipText: { fontSize: 10, fontWeight: '700', color: theme.textMuted },
  catPickChipTextActive: { color: '#ffffff', fontWeight: '800' },

  chooseFileBtn: {
    borderWidth: 1, borderColor: theme.border, borderStyle: 'dashed',
    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#f8fafc',
    padding: 18, alignItems: 'center', justifyContent: 'center',
  },
  chooseFileBtnText: { fontSize: 11, fontWeight: '800', color: theme.primaryLight, marginBottom: 2 },
  chooseFileSubtext: { fontSize: 9, color: theme.textMuted },

  pickedFileBox: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: theme.border, backgroundColor: theme.tealTint,
    padding: 10,
  },
  pickedFileName: { fontSize: 11, fontWeight: '800', color: theme.textPrimary },
  pickedFileSize: { fontSize: 9, color: theme.textMuted, marginTop: 1 },
  removeFileBtn: { padding: 4 },

  modalTagBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: theme.tealTint, borderWidth: 1, borderColor: theme.border,
    padding: 12, marginBottom: 12,
  },
  modalTagLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 1, color: theme.textMuted },
  modalTagValue: {
    fontSize: 14, fontWeight: '900', color: theme.primaryLight,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', marginTop: 2,
  },
  modalFieldsList: { borderWidth: 1, borderColor: theme.border, marginBottom: 12 },
  modalFieldRow: {
    padding: 10, borderBottomWidth: 1, borderBottomColor: theme.border,
    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.01)' : '#ffffff',
  },
  modalFieldLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 0.8, color: theme.textMuted, marginBottom: 2 },
  modalFieldValue: { fontSize: 11, fontWeight: '700', color: theme.textPrimary },
  complianceBox: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: theme.tealTint,
    padding: 10, borderWidth: 1, borderColor: theme.border, marginBottom: 12,
  },
  complianceText: { fontSize: 10, color: theme.textSecondary, flex: 1, lineHeight: 15 },

  modalFooter: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderTopWidth: 1, borderTopColor: theme.border,
  },
  modalDownloadBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.primary, paddingVertical: 10,
  },
  modalDownloadText: { color: '#ffffff', fontSize: 11, fontWeight: '800' },
  modalDismissBtn: {
    borderWidth: 1, borderColor: theme.border, backgroundColor: theme.cardBg,
    paddingVertical: 10, paddingHorizontal: 14,
  },
  modalDismissText: { color: theme.textPrimary, fontSize: 11, fontWeight: '700' },

  downloadIconBtn: {
    padding: 7, borderWidth: 1, borderColor: theme.border,
    backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc',
    alignItems: 'center', justifyContent: 'center',
  },

  viewerModalCard: {
    maxWidth: 620, height: '88%', maxHeight: 680,
  },
  viewerBody: {
    flex: 1, backgroundColor: isDarkMode ? '#020617' : '#f8fafc',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  imageViewerWrap: {
    width: '100%', height: '100%',
    alignItems: 'center', justifyContent: 'center', padding: 8,
  },
  previewImage: {
    width: '100%', height: '100%',
  },
  fileFallbackBox: {
    alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center',
  },
  fileFallbackIconWrap: {
    width: 64, height: 64, backgroundColor: theme.tealTint,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    borderWidth: 1, borderColor: theme.border,
  },
  fileFallbackTitle: {
    fontSize: 14, fontWeight: '800', color: theme.textPrimary, textAlign: 'center', marginBottom: 4,
  },
  fileFallbackSub: {
    fontSize: 11, color: theme.textMuted, textAlign: 'center', marginBottom: 6,
  },
  fileFallbackDesc: {
    fontSize: 10, color: theme.textSecondary, textAlign: 'center', marginBottom: 16,
  },
  fallbackDownloadBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.primary, paddingHorizontal: 16, paddingVertical: 10,
  },
  fallbackDownloadText: {
    color: '#ffffff', fontSize: 11, fontWeight: '800',
  },
});
