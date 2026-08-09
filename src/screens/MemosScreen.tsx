import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, ActivityIndicator, Linking
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

interface MemosScreenProps {
  token: string | null;
  onBack: () => void;
}

interface Memo {
  id: number;
  title: string;
  content: string;
  file_path: string | null;
  name: string;
  created_at: string;
}

export default function MemosScreen({ token, onBack }: MemosScreenProps) {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);
  const [memos, setMemos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [debugMsg, setDebugMsg] = useState<string>('');

  useEffect(() => {
    const fetchMemos = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        let apiUrl = `http://192.168.100.31/atech_prime/backend/public/api/memos`;
        if (Platform.OS === 'web') {
          apiUrl = `http://${window.location.hostname}/atech_prime/backend/public/api/memos`;
        }
          
        const response = await fetch(apiUrl, {
          method: 'GET',
          cache: 'no-store', // Prevent aggressive fetch caching
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const rawData = await response.json();
          const data = Array.isArray(rawData) ? rawData : (rawData.data || []);
          
          const filtered = data.filter((m: any) => m.status && m.status.toLowerCase() === 'published');
          setDebugMsg(`Success. Raw: ${data.length}, Filtered: ${filtered.length}. Token: ${token.substring(0, 10)}...`);
          setMemos(filtered);
        } else {
          setDebugMsg(`HTTP Error: ${response.status} ${response.statusText}`);
        }
      } catch (error: any) {
        setDebugMsg(`Fetch Error: ${error?.message || String(error)}`);
        console.error('Failed to fetch memos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMemos();
  }, [token]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const handleOpenAttachment = (filePath: string) => {
    let baseUrl = `http://192.168.100.31/atech_prime/backend/public/`;
    if (Platform.OS === 'web') {
      baseUrl = `http://${window.location.hostname}/atech_prime/backend/public/`;
    }
      
    Linking.openURL(`${baseUrl}${filePath}`).catch(err => console.error("Couldn't load page", err));
  };

  return (
    <LinearGradient colors={theme.backgroundGradient as any} style={styles.container}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      
      {/* Decorative Background Elements */}
      <View style={styles.glow1} />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Feather name="arrow-left" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Memorandums</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={styles.loadingText}>Loading memorandums...</Text>
          </View>
        ) : memos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="file-text" size={48} color={theme.textSecondary} style={styles.emptyIcon} />
            <Text style={styles.emptyText}>No memorandums available.</Text>
            {!!debugMsg && (
              <Text style={{ marginTop: 20, color: 'red', fontSize: 12, textAlign: 'center', paddingHorizontal: 20 }}>
                DEBUG: {debugMsg}
              </Text>
            )}
          </View>
        ) : (
          memos.map(memo => (
            <View key={memo.id} style={styles.memoCard}>
              <View style={styles.memoHeader}>
                <Text style={styles.memoTitle}>{memo.title}</Text>
                <Text style={styles.memoDate}>{formatDate(memo.created_at)}</Text>
              </View>
              
              <Text style={styles.memoAuthor}>Posted by: {memo.name || 'System Admin'}</Text>
              <Text style={styles.memoContent}>{memo.content}</Text>
              
              {memo.file_path && (
                <TouchableOpacity 
                  style={styles.attachmentButton}
                  onPress={() => handleOpenAttachment(memo.file_path as string)}
                >
                  <Feather name="paperclip" size={16} color={theme.primary} />
                  <Text style={styles.attachmentText}>View Attachment</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  glow1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: theme.primary,
    opacity: 0.1,
    ...Platform.select({
      web: { filter: 'blur(60px)' }
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: theme.textSecondary,
    fontSize: 14,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyText: {
    color: theme.textSecondary,
    fontSize: 16,
    textAlign: 'center',
  },
  memoCard: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  memoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  memoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textPrimary,
    flex: 1,
    marginRight: 10,
  },
  memoDate: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  memoAuthor: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  memoContent: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.primary + '15',
    padding: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  attachmentText: {
    color: theme.primary,
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
  }
});
