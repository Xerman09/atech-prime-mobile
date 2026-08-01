import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, ActivityIndicator 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';

interface LeaveRequestScreenProps {
  onBack: () => void;
  onNavigateToForm: () => void;
  token?: string | null;
}

export default function LeaveRequestScreen({ onBack, onNavigateToForm, token }: LeaveRequestScreenProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!token) return;
      try {
        const url = Platform.OS === 'web' 
          ? 'http://localhost/atech_prime/backend/public/api/leave-requests?scope=personal'
          : 'http://192.168.100.31/atech_prime/backend/public/api/leave-requests?scope=personal';
          
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
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
        console.error('Failed to fetch leave history:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [token]);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Approved': return '#22c55e';
      case 'Pending': return '#f59e0b';
      case 'Rejected': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  const getStatusBg = (status: string) => {
    switch(status) {
      case 'Approved': return 'rgba(34, 197, 94, 0.1)';
      case 'Pending': return 'rgba(245, 158, 11, 0.1)';
      case 'Rejected': return 'rgba(239, 68, 68, 0.1)';
      default: return 'rgba(148, 163, 184, 0.1)';
    }
  };

  return (
    <LinearGradient colors={['#020617', '#0f172a', '#020617']} style={styles.container}>
      <StatusBar style="light" />
      
      {/* Decorative Background Elements */}
      <View style={styles.glow1} />
      <View style={styles.glow2} />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Feather name="arrow-left" size={24} color="#f8fafc" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Leave History</Text>
        </View>
        
        <TouchableOpacity style={styles.addButton} onPress={onNavigateToForm}>
          <Feather name="plus" size={20} color="#f8fafc" />
          <Text style={styles.addButtonText}>Apply</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        
        {isLoading ? (
          <View style={[styles.emptyState, { marginTop: 40 }]}>
            <ActivityIndicator size="large" color="#a855f7" />
          </View>
        ) : history.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrapper}>
              <Feather name="inbox" size={32} color="#64748b" />
            </View>
            <Text style={styles.emptyText}>No leave requests found</Text>
          </View>
        ) : (
          history.map(item => (
            <View key={item.id} style={styles.historyCard}>
              <View style={styles.cardHeader}>
                <View style={styles.typeWrapper}>
                  <View style={[styles.typeIcon, { backgroundColor: 'rgba(168, 85, 247, 0.1)' }]}>
                    <Feather name="file-text" size={16} color="#a855f7" />
                  </View>
                  <Text style={styles.typeText}>{item.leave_type || item.type}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusBg(item.status), borderColor: getStatusColor(item.status) }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                </View>
              </View>

              <View style={styles.dateContainer}>
                <View style={styles.dateBlock}>
                  <Text style={styles.dateLabel}>Start Date</Text>
                  <Text style={styles.dateValue}>{item.start_date || item.startDate}</Text>
                </View>
                <Feather name="arrow-right" size={16} color="#64748b" />
                <View style={styles.dateBlock}>
                  <Text style={styles.dateLabel}>End Date</Text>
                  <Text style={styles.dateValue}>{item.end_date || item.endDate}</Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.submittedText}>Submitted: {item.created_at ? new Date(item.created_at).toLocaleDateString() : item.submittedAt}</Text>
              </View>
            </View>
          ))
        )}

      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderRadius: 150,
    transform: [{ scale: 2 }],
  },
  glow2: {
    position: 'absolute',
    bottom: -100,
    right: -100,
    width: 300,
    height: 300,
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
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
    borderBottomColor: 'rgba(51, 65, 85, 0.5)',
    backgroundColor: 'rgba(2, 6, 23, 0.5)',
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
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#a855f7',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 0,
  },
  addButtonText: {
    color: '#f8fafc',
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
    borderColor: 'rgba(51, 65, 85, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  historyCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
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
    color: '#f8fafc',
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
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
    padding: 12,
    borderRadius: 0,
    marginBottom: 16,
  },
  dateBlock: {
    flex: 1,
  },
  dateLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  dateValue: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '500',
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(51, 65, 85, 0.5)',
    paddingTop: 12,
  },
  submittedText: {
    color: '#64748b',
    fontSize: 11,
  },
});
