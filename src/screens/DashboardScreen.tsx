import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Modal, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useTheme, ThemeColors } from '../theme/ThemeContext';

interface DashboardScreenProps {
  userName: string;
  token: string | null;
  onLogout: () => void;
  onNavigate: (screen: string) => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function DashboardScreen({ userName, token, onLogout, onNavigate }: DashboardScreenProps) {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const styles = getStyles(theme, isDarkMode);
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [todayTasks, setTodayTasks] = useState<any[]>([]);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(true);

  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setCurrentDate(now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }));
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    };
    tick();
    const t = setInterval(tick, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      if (!token) { setIsLoadingAnnouncements(false); return; }
      try {
        let url = `http://192.168.100.31/atech_prime/backend/public/api/hr/announcements`;
        if (Platform.OS === 'web') url = `http://${window.location.hostname}/atech_prime/backend/public/api/hr/announcements`;
        const res = await fetch(url, { cache: 'no-store', headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setAnnouncements(data.filter((a: any) => a.status === 'published').slice(0, 3));
        }
      } catch (e) { console.error(e); } finally { setIsLoadingAnnouncements(false); }
    };
    const fetchTasks = async () => {
      if (!token) return;
      try {
        let url = `http://192.168.100.31/atech_prime/backend/public/api/todos`;
        if (Platform.OS === 'web') url = `http://${window.location.hostname}/atech_prime/backend/public/api/todos`;
        const res = await fetch(url, { headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          const today = new Date();
          const y = today.getFullYear(), m = String(today.getMonth()+1).padStart(2,'0'), d = String(today.getDate()).padStart(2,'0');
          const todayStr = `${y}-${m}-${d}`;
          const filtered = data.filter((t: any) => !t.is_completed && (t.due_date === todayStr || t.start_date === todayStr || (t.start_date && t.due_date && t.start_date <= todayStr && t.due_date >= todayStr)));
          setTodayTasks(filtered.slice(0, 3));
        }
      } catch (e) { console.error(e); }
    };
    fetchAnnouncements();
    fetchTasks();
  }, [token]);

  const quickActions = [
    { icon: 'clock', label: "Time In/Out", sub: "Record attendance", screen: 'attendance', tint: theme.tealTint, color: theme.primary },
    { icon: 'file-text', label: "Leave Request", sub: "Apply for leave", screen: 'leave_request', tint: theme.greenTint, color: theme.secondary },
    { icon: 'map', label: "Business Trip", sub: "Request travel", screen: 'business_trip_request', tint: theme.blueTint, color: theme.info },
    { icon: 'corner-down-left', label: "Undertime", sub: "Early departure", screen: 'undertime_request', tint: theme.yellowTint, color: theme.warning },
    { icon: 'award', label: "COE Request", sub: "Employment cert.", screen: 'coe_request', tint: theme.tealTint, color: theme.primaryLight },
    { icon: 'calendar', label: "Attendance", sub: "View history", screen: 'attendance_report', tint: theme.greenTint, color: theme.success },
  ];

  const sidebarItems = [
    { icon: 'home', label: 'Dashboard', screen: 'dashboard' },
    { icon: 'clock', label: 'Time In/Out', screen: 'attendance' },
    { icon: 'calendar', label: 'Attendance Report', screen: 'attendance_report' },
    { icon: 'file-text', label: 'Leave Requests', screen: 'leave_request' },
    { icon: 'corner-down-left', label: 'Undertime Requests', screen: 'undertime_request' },
    { icon: 'award', label: 'COE Requests', screen: 'coe_request' },
    { icon: 'book', label: 'Company Policies', screen: 'policies' },
    { icon: 'inbox', label: 'Memorandums', screen: 'memos' },
    { icon: 'check-square', label: 'To-Do List', screen: 'todo' },
  ];

  const getPriorityColor = (p: string) => {
    if (p === 'High' || p === 'high') return theme.error;
    if (p === 'Medium' || p === 'medium') return theme.warning;
    return theme.primary;
  };

  return (
    <View style={styles.container}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <LinearGradient colors={theme.backgroundGradient as any} style={StyleSheet.absoluteFillObject} />

      {/* Accent blobs */}
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      {/* Sidebar Modal */}
      <Modal visible={isMenuOpen} transparent animationType="slide" onRequestClose={() => setIsMenuOpen(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setIsMenuOpen(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.sidebar}>
            {/* Top gradient strip */}
            <LinearGradient colors={theme.primaryGradient as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.sidebarStrip} />

            <View style={styles.sidebarTop}>
              <View style={styles.avatarWrap}>
                <LinearGradient colors={theme.primaryGradient as any} style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </LinearGradient>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sidebarName}>{userName}</Text>
                <Text style={styles.sidebarRole}>Employee</Text>
              </View>
              <TouchableOpacity onPress={() => setIsMenuOpen(false)} style={styles.closeSidebar}>
                <Feather name="x" size={22} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.sidebarList}>
              <Text style={styles.sidebarSection}>MAIN MENU</Text>
              {sidebarItems.map((item) => (
                <TouchableOpacity key={item.screen} style={styles.sidebarItem} onPress={() => { setIsMenuOpen(false); onNavigate(item.screen); }}>
                  <View style={styles.sidebarIconBox}>
                    <Feather name={item.icon as any} size={18} color={theme.primary} />
                  </View>
                  <Text style={styles.sidebarItemLabel}>{item.label}</Text>
                  <Feather name="chevron-right" size={16} color={theme.textMuted} />
                </TouchableOpacity>
              ))}

              <View style={styles.sidebarDivider} />
              <Text style={styles.sidebarSection}>ACCOUNT</Text>

              <TouchableOpacity style={styles.sidebarItem} onPress={() => { setIsMenuOpen(false); onNavigate('profile'); }}>
                <View style={styles.sidebarIconBox}><Feather name="user" size={18} color={theme.primary} /></View>
                <Text style={styles.sidebarItemLabel}>My Profile</Text>
                <Feather name="chevron-right" size={16} color={theme.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.sidebarItem} onPress={toggleTheme}>
                <View style={styles.sidebarIconBox}><Feather name={isDarkMode ? 'sun' : 'moon'} size={18} color={theme.primary} /></View>
                <Text style={styles.sidebarItemLabel}>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.sidebarFooter}>
              <TouchableOpacity style={styles.logoutBtn} onPress={() => { setIsMenuOpen(false); onLogout(); }}>
                <Feather name="log-out" size={18} color={theme.error} />
                <Text style={styles.logoutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuBtn} onPress={() => setIsMenuOpen(true)}>
          <Feather name="menu" size={22} color={theme.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerMid}>
          <Text style={styles.greeting}>Good day,</Text>
          <Text style={styles.headerName}>{userName}</Text>
        </View>
        <TouchableOpacity style={styles.avatarSmall} onPress={() => onNavigate('profile')}>
          <LinearGradient colors={theme.primaryGradient as any} style={styles.avatarSmallGrad}>
            <Text style={styles.avatarSmallText}>{initials}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Hero date/time card */}
      <View style={styles.heroCard}>
        <LinearGradient colors={theme.primaryGradient as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroGradient}>
          <View>
            <Text style={styles.heroTime}>{currentTime}</Text>
            <Text style={styles.heroDate}>{currentDate}</Text>
          </View>
          <TouchableOpacity style={styles.heroAction} onPress={() => onNavigate('attendance')} activeOpacity={0.85}>
            <Feather name="clock" size={16} color={theme.primary} />
            <Text style={styles.heroActionText}>Time In/Out</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>

        {/* Quick Actions Grid */}
        <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
        <View style={styles.grid}>
          {quickActions.map((a, i) => (
            <TouchableOpacity key={i} style={styles.gridItem} onPress={() => onNavigate(a.screen)} activeOpacity={0.8}>
              <View style={[styles.gridIcon, { backgroundColor: a.tint }]}>
                <Feather name={a.icon as any} size={20} color={a.color} />
              </View>
              <Text style={styles.gridLabel}>{a.label}</Text>
              <Text style={styles.gridSub}>{a.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Announcements */}
        {announcements.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>ANNOUNCEMENTS</Text>
            <View style={styles.card}>
              {announcements.map((ann, i) => (
                <View key={ann.id} style={[styles.annRow, i < announcements.length - 1 && styles.annRowBorder]}>
                  <View style={styles.annDot} />
                  <View style={{ flex: 1 }}>
                    <View style={styles.annHeader}>
                      <Text style={styles.annPriority}>{ann.priority?.toUpperCase()}</Text>
                      <Text style={styles.annDate}>{new Date(ann.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
                    </View>
                    <Text style={styles.annTitle}>{ann.title}</Text>
                    <Text style={styles.annDesc} numberOfLines={2}>{ann.content}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Today's Tasks */}
        {todayTasks.length > 0 && (
          <>
            <View style={styles.rowBetween}>
              <Text style={styles.sectionLabel}>TODAY'S TASKS</Text>
              <TouchableOpacity onPress={() => onNavigate('todo')} style={{ marginBottom: 12 }}>
                <Text style={styles.seeAll}>See all ?</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.card}>
              {todayTasks.map((task, i) => (
                <TouchableOpacity key={task.id} style={[styles.taskRow, i < todayTasks.length - 1 && styles.annRowBorder]} onPress={() => onNavigate('todo')}>
                  <Feather name="circle" size={15} color={theme.textMuted} style={{ marginRight: 12 }} />
                  <Text style={styles.taskTitle} numberOfLines={1}>{task.title}</Text>
                  <View style={[styles.priorityTag, { borderColor: getPriorityColor(task.priority) + '50', backgroundColor: getPriorityColor(task.priority) + '12' }]}>
                    <Text style={[styles.priorityTagText, { color: getPriorityColor(task.priority) }]}>{task.priority}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const getStyles = (theme: ThemeColors, isDarkMode: boolean) => StyleSheet.create({
  container: { flex: 1 },
  blob1: {
    position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: 100,
    backgroundColor: isDarkMode ? 'rgba(19,157,158,0.07)' : 'rgba(8,105,122,0.05)',
  },
  blob2: {
    position: 'absolute', bottom: 100, left: -80, width: 240, height: 240, borderRadius: 120,
    backgroundColor: isDarkMode ? 'rgba(166,206,56,0.05)' : 'rgba(166,206,56,0.07)',
  },
  // Sidebar
  overlay: { flex: 1, backgroundColor: theme.sidebarOverlay, justifyContent: 'flex-start', alignItems: 'flex-start' },
  sidebar: { width: Math.min(SCREEN_WIDTH * 0.82, 320), height: '100%', backgroundColor: theme.sidebarBg, borderRightWidth: 1, borderRightColor: theme.border, position: 'relative' },
  sidebarStrip: { height: 4, position: 'absolute', top: 0, left: 0, right: 0 },
  sidebarTop: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: Platform.OS === 'ios' ? 56 : 36, borderBottomWidth: 1, borderBottomColor: theme.border },
  avatarWrap: { marginRight: 12 },
  avatar: { width: 44, height: 44, borderRadius: 0, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  sidebarName: { color: theme.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 2 },
  sidebarRole: { color: theme.textMuted, fontSize: 12 },
  closeSidebar: { padding: 4, marginLeft: 8 },
  sidebarList: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  sidebarSection: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, color: theme.textMuted, marginTop: 4, marginBottom: 8, marginLeft: 4 },
  sidebarItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 4 },
  sidebarIconBox: { width: 32, height: 32, backgroundColor: theme.tealTint, borderRadius: 0, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  sidebarItemLabel: { flex: 1, color: theme.textPrimary, fontSize: 14, fontWeight: '500' },
  sidebarDivider: { height: 1, backgroundColor: theme.border, marginVertical: 12 },
  sidebarFooter: { padding: 20, borderTopWidth: 1, borderTopColor: theme.border },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderWidth: 1, borderColor: theme.error + '40', backgroundColor: theme.redTint, borderRadius: 0 },
  logoutText: { color: theme.error, fontSize: 14, fontWeight: '600', marginLeft: 8 },
  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 12, paddingHorizontal: 20,
  },
  menuBtn: { padding: 8, backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border, borderRadius: 0, marginRight: 12 },
  headerMid: { flex: 1 },
  greeting: { color: theme.textMuted, fontSize: 12, marginBottom: 1 },
  headerName: { color: theme.textPrimary, fontSize: 17, fontWeight: '700' },
  avatarSmall: { marginLeft: 12 },
  avatarSmallGrad: { width: 38, height: 38, borderRadius: 0, alignItems: 'center', justifyContent: 'center' },
  avatarSmallText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  // Hero card
  heroCard: { marginHorizontal: 20, marginBottom: 24, shadowColor: theme.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8 },
  heroGradient: { padding: 20, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', borderRadius: 0 },
  heroTime: { color: '#fff', fontSize: 32, fontWeight: '200', letterSpacing: 1, marginBottom: 4 },
  heroDate: { color: 'rgba(255,255,255,0.75)', fontSize: 13 },
  heroAction: { backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 0, flexDirection: 'row', alignItems: 'center' },
  heroActionText: { color: theme.primary, fontSize: 12, fontWeight: '700', marginLeft: 6 },
  // Body
  body: { flex: 1 },
  bodyContent: { paddingHorizontal: 20, paddingBottom: 32 },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, color: theme.textMuted, marginBottom: 12 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  seeAll: { color: theme.primary, fontSize: 12, fontWeight: '600', marginBottom: 12 },
  // Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6, marginBottom: 28 },
  gridItem: {
    width: '33.33%', padding: 6,
  },
  gridIcon: { width: 40, height: 40, borderRadius: 0, alignItems: 'center', justifyContent: 'center', marginBottom: 8, borderWidth: 1, borderColor: theme.border },
  gridLabel: { color: theme.textPrimary, fontSize: 12, fontWeight: '600', marginBottom: 2 },
  gridSub: { color: theme.textMuted, fontSize: 10 },
  // Card
  card: { backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border, borderRadius: 0, marginBottom: 24 },
  annRow: { flexDirection: 'row', alignItems: 'flex-start', padding: 14 },
  annRowBorder: { borderBottomWidth: 1, borderBottomColor: theme.border },
  annDot: { width: 6, height: 6, backgroundColor: theme.primary, borderRadius: 3, marginTop: 6, marginRight: 12 },
  annHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  annPriority: { fontSize: 10, fontWeight: '800', color: theme.primary, letterSpacing: 0.8 },
  annDate: { fontSize: 10, color: theme.textMuted },
  annTitle: { color: theme.textPrimary, fontSize: 14, fontWeight: '600', marginBottom: 3 },
  annDesc: { color: theme.textSecondary, fontSize: 12, lineHeight: 17 },
  taskRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  taskTitle: { flex: 1, color: theme.textPrimary, fontSize: 14, fontWeight: '500' },
  priorityTag: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 0 },
  priorityTagText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
});
