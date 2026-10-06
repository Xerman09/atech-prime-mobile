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

export default function MemosScreen({ token, onBack }: MemosScreenProps) {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);
  const [memos, setMemos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
          cache: 'no-store',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const rawData = await response.json();
          const data = Array.isArray(rawData) ? rawData : (rawData.data || []);
          const filtered = data.filter((m: any) => m.status && m.status.toLowerCase() === 'published');
          setMemos(filtered);
        }
      } catch (error) {
        console.error('Failed to fetch memos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMemos();
  }, [token]);

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

  const handleOpenAttachment = (filePath: string) => {
    let baseUrl = `http://192.168.100.31/atech_prime/backend/public/`;
    if (Platform.OS === 'web') {
      baseUrl = `http://${window.location.hostname}/atech_prime/backend/public/`;
    }
    Linking.openURL(`${baseUrl}${filePath}`).catch(err => console.error("Couldn't open attachment", err));
  };

  return (
    <View style={styles.container}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <LinearGradient colors={theme.backgroundGradient as any} style={StyleSheet.absoluteFillObject} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Feather name="arrow-left" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Memorandums & Notices</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={styles.centerText}>Loading memorandums...</Text>
          </View>
        ) : memos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Feather name="file-text" size={28} color={theme.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No memorandums published</Text>
            <Text style={styles.emptySubtitle}>Official company memos and directives will appear here.</Text>
          </View>
        ) : (
          memos.map(memo => (
            <View key={memo.id} style={styles.memoCard}>
              <View style={styles.memoCardTop}>
                <View style={styles.memoTitleRow}>
                  <View style={styles.tagDot} />
                  <Text style={styles.memoTitle}>{memo.title}</Text>
                </View>
                <Text style={styles.memoDate}>{formatDate(memo.created_at)}</Text>
              </View>
              
              <Text style={styles.memoAuthor}>Issued by: {memo.name || 'Management'}</Text>
              <Text style={styles.memoContent}>{memo.content}</Text>
              
              {memo.file_path ? (
                <TouchableOpacity 
                  style={styles.attachmentBtn}
                  onPress={() => handleOpenAttachment(memo.file_path as string)}
                >
                  <Feather name="paperclip" size={14} color={theme.primary} />
                  <Text style={styles.attachmentText}>View Official Attachment</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ))
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 56 : 36, paddingHorizontal: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: theme.border,
  },
  backBtn: {
    padding: 8, backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border, borderRadius: 0
  },
  headerTitle: { color: theme.textPrimary, fontSize: 17, fontWeight: '700' },
  scrollContent: { padding: 20 },
  centerBox: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  centerText: { marginTop: 12, color: theme.textMuted, fontSize: 13 },
  emptyContainer: {
    padding: 40, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: theme.border, backgroundColor: theme.cardBg, borderRadius: 0, marginTop: 20
  },
  emptyIcon: { width: 56, height: 56, backgroundColor: theme.tealTint, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { color: theme.textPrimary, fontSize: 15, fontWeight: '600', marginBottom: 6 },
  emptySubtitle: { color: theme.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 18 },
  memoCard: {
    backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border,
    padding: 18, marginBottom: 14, borderRadius: 0
  },
  memoCardTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 8, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: theme.border
  },
  memoTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
  tagDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.primary, marginRight: 8 },
  memoTitle: { fontSize: 15, fontWeight: '700', color: theme.textPrimary, flex: 1 },
  memoDate: { fontSize: 12, color: theme.textMuted, fontWeight: '500' },
  memoAuthor: { fontSize: 12, color: theme.textSecondary, marginBottom: 10, fontStyle: 'italic' },
  memoContent: { fontSize: 13, color: theme.textSecondary, lineHeight: 20, marginBottom: 12 },
  attachmentBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: theme.tealTint,
    paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: theme.border,
    alignSelf: 'flex-start', borderRadius: 0
  },
  attachmentText: { color: theme.primary, fontWeight: '600', fontSize: 12, marginLeft: 6 }
});
