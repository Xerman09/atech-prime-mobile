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

      {/* Signature Top Gradient Strip */}
      <LinearGradient
        colors={theme.accentGradient as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.signatureStrip}
      />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Feather name="arrow-left" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Memorandums & Notices</Text>
          <Text style={styles.headerSubtitle}>Official Company Directives</Text>
        </View>
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
              <Feather name="file-text" size={28} color={theme.rose} />
            </View>
            <Text style={styles.emptyTitle}>No memorandums published</Text>
            <Text style={styles.emptySubtitle}>Official executive circulars and policy notices will appear here.</Text>
          </View>
        ) : (
          memos.map(memo => (
            <View key={memo.id} style={styles.memoCard}>
              <View style={styles.memoCardTop}>
                <View style={styles.memoTitleRow}>
                  <View style={styles.tagDot} />
                  <Text style={styles.memoTitle}>{memo.title}</Text>
                </View>
                <View style={styles.dateBadge}>
                  <Text style={styles.memoDate}>{formatDate(memo.created_at)}</Text>
                </View>
              </View>
              
              <View style={styles.authorRow}>
                <Feather name="user-check" size={12} color={theme.royalBlue} style={{ marginRight: 5 }} />
                <Text style={styles.memoAuthor}>Issued by: {memo.name || 'Executive Management'}</Text>
              </View>
              <Text style={styles.memoContent}>{memo.content}</Text>
              
              {memo.file_path ? (
                <TouchableOpacity 
                  style={styles.attachmentBtn}
                  onPress={() => handleOpenAttachment(memo.file_path as string)}
                  activeOpacity={0.8}
                >
                  <Feather name="paperclip" size={14} color={theme.royalBlue} />
                  <Text style={styles.attachmentText}>View Official Document PDF</Text>
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
  scrollContent: { padding: 20 },
  centerBox: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  centerText: { marginTop: 12, color: theme.textMuted, fontSize: 13 },
  emptyContainer: {
    padding: 40, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: theme.border, backgroundColor: theme.cardBg, marginTop: 20,
  },
  emptyIcon: { width: 56, height: 56, backgroundColor: theme.roseTint, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { color: theme.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 6 },
  emptySubtitle: { color: theme.textMuted, fontSize: 12, textAlign: 'center', lineHeight: 18 },
  memoCard: {
    backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border,
    borderLeftWidth: 3.5, borderLeftColor: theme.royalBlue,
    padding: 18, marginBottom: 14,
  },
  memoCardTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 8, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: theme.border,
  },
  memoTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
  tagDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.royalBlue, marginRight: 8 },
  memoTitle: { fontSize: 15, fontWeight: '700', color: theme.textPrimary, flex: 1 },
  dateBadge: {
    backgroundColor: theme.tealTint, borderWidth: 1, borderColor: theme.border,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  memoDate: { fontSize: 11, color: theme.textPrimary, fontWeight: '600' },
  authorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  memoAuthor: { fontSize: 12, color: theme.textSecondary, fontWeight: '500' },
  memoContent: { fontSize: 13, color: theme.textSecondary, lineHeight: 20, marginBottom: 14 },
  attachmentBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: theme.blueTint,
    paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: 'rgba(37, 99, 235, 0.3)',
    alignSelf: 'flex-start',
  },
  attachmentText: { color: theme.royalBlue, fontWeight: '700', fontSize: 12, marginLeft: 6 },
});
