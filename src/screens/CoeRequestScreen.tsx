import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, ActivityIndicator, Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useTheme, ThemeColors } from '../theme/ThemeContext';

interface CoeRequestScreenProps {
  onBack: () => void;
  onNavigateToForm: () => void;
  token?: string | null;
}

export default function CoeRequestScreen({ onBack, onNavigateToForm, token }: CoeRequestScreenProps) {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!token) return;
      try {
        const url = Platform.OS === 'web' 
          ? `http://${window.location.hostname}/atech_prime/backend/public/api/coe-requests?scope=personal`
          : 'http://192.168.100.11/atech_prime/backend/public/api/coe-requests?scope=personal';
          
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-Authorization': `Bearer ${token}`
          },
          cache: 'no-store'
        });
        
        if (response.ok) {
          const responseData = await response.json();
          // The backend might return the array directly or wrapped in { data: [...] }
          if (Array.isArray(responseData)) {
            setHistory(responseData);
          } else {
            setHistory(responseData.data || []);
          }
        }
      } catch (error) {
        console.error('Failed to fetch COE history:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [token]);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Approved': return theme.emerald;
      case 'Pending': return theme.amber;
      case 'Rejected': return theme.rose;
      default: return theme.textMuted;
    }
  };

  const getStatusBg = (status: string) => {
    switch(status) {
      case 'Approved': return theme.emeraldTint;
      case 'Pending': return theme.amberTint;
      case 'Rejected': return theme.roseTint;
      default: return theme.tealTint;
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr === '0000-00-00') return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <LinearGradient colors={theme.backgroundGradient} style={styles.container}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      
      {/* Signature Top Gradient Strip */}
      <LinearGradient
        colors={theme.accentGradient as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ height: 3, width: '100%' }}
      />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Feather name="arrow-left" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <View style={{ marginLeft: 8 }}>
            <Text style={styles.headerTitle}>COE Requests</Text>
            <Text style={{ fontSize: 11, color: theme.textMuted }}>Certificate of Employment</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.addButton} onPress={onNavigateToForm} activeOpacity={0.85}>
          <LinearGradient colors={['#10b981', '#08697A']} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7 }}>
            <Feather name="plus" size={16} color="#ffffff" style={{ marginRight: 4 }} />
            <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '800' }}>Apply</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        
        {isLoading ? (
          <View style={[styles.emptyState, { marginTop: 40 }]}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : history.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrapper}>
              <Feather name="inbox" size={32} color={theme.textMuted} />
            </View>
            <Text style={styles.emptyText}>No COE requests found</Text>
          </View>
        ) : (
          history.map(item => (
            <View key={item.id} style={styles.historyCard}>
              <View style={styles.cardHeader}>
                <View style={styles.typeWrapper}>
                  <View style={[styles.typeIcon, { backgroundColor: theme.tealTint }]}>
                    <Feather name="file-text" size={16} color={theme.primary} />
                  </View>
                  <Text style={styles.typeText}>{item.purpose || item.type}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusBg(item.status), borderColor: getStatusColor(item.status) }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                </View>
              </View>

              <View style={styles.purposeBox}>
                <Text style={styles.purposeLabel}>INTENDED PURPOSE & DETAILS</Text>
                <Text style={styles.purposeText} numberOfLines={2}>
                  {item.purpose || 'Certificate of Employment'}
                </Text>
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.filingDateWrap}>
                  <Feather name="calendar" size={12} color={theme.textMuted} style={{ marginRight: 5 }} />
                  <Text style={styles.submittedText}>
                    Filed: {formatDate(item.created_at ? (item.created_at.split('T')[0] || item.created_at.split(' ')[0]) : item.submittedAt)}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.viewButton}
                  onPress={() => setSelectedRequest(item)}
                >
                  <Text style={styles.viewButtonText}>View Details</Text>
                  <Feather name="chevron-right" size={16} color={theme.primary} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

      </ScrollView>

      {/* Details Modal */}
      <Modal
        visible={!!selectedRequest}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedRequest(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Top Gradient Strip */}
            <LinearGradient 
              colors={theme.primaryGradient as any}
              start={{x: 0, y: 0}} end={{x: 1, y: 0}}
              style={styles.modalGradientStrip}
            />
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Details</Text>
              <TouchableOpacity onPress={() => setSelectedRequest(null)} style={styles.closeButton}>
                <Feather name="x" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {selectedRequest && (
                <>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>DOCUMENT TYPE</Text>
                    <Text style={styles.detailValue}>Certificate of Employment (COE)</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>STATUS</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusBg(selectedRequest.status), borderColor: getStatusColor(selectedRequest.status), alignSelf: 'flex-start' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(selectedRequest.status) }]}>{selectedRequest.status}</Text>
                    </View>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>DATE FILED</Text>
                    <Text style={styles.detailValue}>
                      {formatDate(selectedRequest.created_at ? (selectedRequest.created_at.split('T')[0] || selectedRequest.created_at.split(' ')[0]) : selectedRequest.submittedAt)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>PURPOSE & REMARKS</Text>
                    <Text style={[styles.detailValue, { lineHeight: 22 }]}>
                      {selectedRequest.purpose || 'Official employment record certification'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>ESTIMATED TURNAROUND</Text>
                    <Text style={[styles.detailValue, { color: theme.primary, fontWeight: '600' }]}>
                      1–2 Working Days (Subject to HR Endorsement)
                    </Text>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    backgroundColor: isDarkMode ? 'rgba(168, 85, 247, 0.1)' : 'rgba(147, 51, 234, 0.1)',
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
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    backgroundColor: theme.inputBg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    color: theme.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 0,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: {
    color: theme.textSecondary,
    fontSize: 14,
  },
  historyCard: {
    backgroundColor: theme.cardBg,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 0,
    padding: 20,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  typeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    width: 32,
    height: 32,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  typeText: {
    color: theme.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderRadius: 0,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  purposeBox: {
    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc',
    borderWidth: 1,
    borderColor: theme.border,
    padding: 12,
    borderRadius: 0,
    marginBottom: 14,
  },
  purposeLabel: {
    color: theme.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  purposeText: {
    color: theme.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  filingDateWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submittedText: {
    color: theme.textMuted,
    fontSize: 11,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: theme.border,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewButtonText: {
    color: theme.primary,
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.inputBgFocused,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: theme.cardBgSolid,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 0, // Sharp corners rule
    position: 'relative',
    overflow: 'hidden',
    maxHeight: '85%', // Stretchy modal rule
  },
  modalGradientStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    marginTop: 6,
  },
  modalTitle: {
    color: theme.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 24,
  },
  detailRow: {
    marginBottom: 20,
  },
  detailLabel: {
    color: theme.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
  },
  detailValue: {
    color: theme.textPrimary,
    fontSize: 14,
  },
});
