import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, ActivityIndicator 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useTheme, ThemeColors } from '../theme/ThemeContext';

interface PoliciesScreenProps {
  onBack: () => void;
  token: string | null;
}

interface Policy {
  id: number;
  title: string;
  content: string;
  status: string;
  created_at: string;
}

export default function PoliciesScreen({ onBack, token }: PoliciesScreenProps) {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);
  
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    const fetchPolicies = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const apiUrl = Platform.OS === 'web' 
          ? `http://localhost/atech_prime/backend/public/api/policies`
          : `http://192.168.100.31/atech_prime/backend/public/api/policies`;
          
        const response = await fetch(apiUrl, {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          // Filter to show only active policies
          setPolicies(data.filter((p: Policy) => p.status === 'Active'));
        }
      } catch (error) {
        console.error('Failed to fetch policies:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPolicies();
  }, [token]);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatDate = (dateString: string) => {
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
        <Text style={styles.headerTitle}>Company Policies</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        
        <Text style={styles.sectionTitle}>ACTIVE POLICIES</Text>

        {isLoading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : policies.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="file-text" size={48} color={theme.textMuted} style={{ marginBottom: 16 }} />
            <Text style={styles.emptyStateText}>No active policies found.</Text>
          </View>
        ) : (
          policies.map((policy) => {
            const isExpanded = expandedId === policy.id;
            return (
              <View key={policy.id} style={styles.policyCard}>
                <TouchableOpacity 
                  style={styles.policyHeader} 
                  onPress={() => toggleExpand(policy.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.policyHeaderLeft}>
                    <View style={styles.iconContainer}>
                      <Feather name="file-text" size={18} color={theme.primary} />
                    </View>
                    <View style={styles.policyTitleContainer}>
                      <Text style={styles.policyTitle}>{policy.title}</Text>
                      <Text style={styles.policyDate}>Updated {formatDate(policy.created_at)}</Text>
                    </View>
                  </View>
                  <Feather 
                    name={isExpanded ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={theme.textMuted} 
                  />
                </TouchableOpacity>
                
                {isExpanded && (
                  <View style={styles.policyContent}>
                    <Text style={styles.policyText}>{policy.content}</Text>
                  </View>
                )}
              </View>
            );
          })
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
  sectionTitle: {
    color: theme.textMuted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: theme.cardBg,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 0,
  },
  emptyStateText: {
    color: theme.textMuted,
    fontSize: 15,
  },
  policyCard: {
    backgroundColor: theme.cardBg,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 0, // Sharp corners
    marginBottom: 16,
    overflow: 'hidden',
  },
  policyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  policyHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    backgroundColor: theme.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    marginRight: 16,
    borderRadius: 0, // Sharp corners
  },
  policyTitleContainer: {
    flex: 1,
    paddingRight: 16,
  },
  policyTitle: {
    color: theme.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  policyDate: {
    color: theme.textMuted,
    fontSize: 12,
  },
  policyContent: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    backgroundColor: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
  },
  policyText: {
    color: theme.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 16,
  },
});
