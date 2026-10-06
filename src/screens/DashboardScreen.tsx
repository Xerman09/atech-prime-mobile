import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Modal, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  const [companyName, setCompanyName] = useState('ATECH PRIME');
  const [companyPlan, setCompanyPlan] = useState('ENTERPRISE');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [todayTasks, setTodayTasks] = useState<any[]>([]);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(true);

  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setCurrentDate(now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }));
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    };
    tick();
    const t = setInterval(tick, 10000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const loadTenantInfo = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user_data');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed.company_name) setCompanyName(parsed.company_name);
          if (parsed.company_plan) setCompanyPlan(parsed.company_plan.toUpperCase());
        }
      } catch (e) {}
    };
    loadTenantInfo();
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

  // Colorful Quick Actions matching Frontend Palette
  const quickActions = [
    { icon: 'clock', label: "Time In/Out", sub: "Record punch", screen: 'attendance', tint: theme.emeraldTint, color: theme.emerald, border: theme.emerald },
    { icon: 'file-text', label: "Leave Request", sub: "Apply time off", screen: 'leave_request', tint: theme.blueTint, color: theme.royalBlue, border: theme.royalBlue },
    { icon: 'map', label: "Business Trip", sub: "Travel permit", screen: 'business_trip_request', tint: theme.indigoTint, color: theme.indigo, border: theme.indigo },
    { icon: 'corner-down-left', label: "Undertime", sub: "Early leave", screen: 'undertime_request', tint: theme.amberTint, color: theme.amber, border: theme.amber },
    { icon: 'award', label: "COE Request", sub: "Certificate", screen: 'coe_request', tint: theme.tealTint, color: theme.primary, border: theme.primary },
    { icon: 'calendar', label: "Attendance", sub: "Audit logs", screen: 'attendance_report', tint: theme.cyanTint, color: theme.cyan, border: theme.cyan },
  ];

  const sidebarItems = [
    { icon: 'home', label: 'Dashboard', screen: 'dashboard', color: theme.royalBlue, tint: theme.blueTint },
    { icon: 'clock', label: 'Time In/Out', screen: 'attendance', color: theme.emerald, tint: theme.emeraldTint },
    { icon: 'calendar', label: 'Attendance Report', screen: 'attendance_report', color: theme.cyan, tint: theme.cyanTint },
    { icon: 'file-text', label: 'Leave Requests', screen: 'leave_request', color: theme.royalBlue, tint: theme.blueTint },
    { icon: 'corner-down-left', label: 'Undertime Requests', screen: 'undertime_request', color: theme.amber, tint: theme.amberTint },
    { icon: 'award', label: 'COE Requests', screen: 'coe_request', color: theme.primary, tint: theme.tealTint },
    { icon: 'book', label: 'Company Policies', screen: 'policies', color: theme.indigo, tint: theme.indigoTint },
    { icon: 'inbox', label: 'Memorandums', screen: 'memos', color: theme.rose, tint: theme.roseTint },
    { icon: 'check-square', label: 'To-Do List', screen: 'todo', color: theme.secondary, tint: theme.greenTint },
  ];

  const getPriorityBadge = (p: string) => {
    const lower = (p || '').toLowerCase();
    if (lower === 'high' || lower === 'urgent') {
      return { text: p.toUpperCase(), color: theme.rose, bg: theme.roseTint, border: theme.rose };
    }
    if (lower === 'medium') {
      return { text: p.toUpperCase(), color: theme.amber, bg: theme.amberTint, border: theme.amber };
    }
    return { text: (p || 'NORMAL').toUpperCase(), color: theme.cyan, bg: theme.cyanTint, border: theme.cyan };
  };

  return (
    <View style={styles.container}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <LinearGradient colors={theme.backgroundGradient as any} style={StyleSheet.absoluteFillObject} />

      {/* Subtle colorful ambient blobs matching frontend */}
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      {/* Sidebar Modal */}
      <Modal visible={isMenuOpen} transparent animationType="slide" onRequestClose={() => setIsMenuOpen(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setIsMenuOpen(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.sidebar}>
            {/* Signature Top Gradient Strip */}
            <LinearGradient colors={theme.accentGradient as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.sidebarStrip} />

            <View style={styles.sidebarTop}>
              <View style={styles.avatarWrap}>
                <LinearGradient colors={['#2563eb', '#139D9E']} style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </LinearGradient>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sidebarName} numberOfLines={1}>{userName}</Text>
                <View style={styles.sidebarBadgeRow}>
                  <Text style={styles.sidebarRole}>EMPLOYEE</Text>
                  <View style={styles.sidebarBadgeSep} />
                  <Text style={styles.sidebarPlan}>{companyPlan}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setIsMenuOpen(false)} style={styles.closeSidebar}>
                <Feather name="x" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.sidebarList} showsVerticalScrollIndicator={false}>
              <Text style={styles.sidebarSection}>PORTAL NAVIGATION</Text>
              {sidebarItems.map((item) => (
                <TouchableOpacity key={item.screen} style={styles.sidebarItem} onPress={() => { setIsMenuOpen(false); onNavigate(item.screen); }}>
                  <View style={[styles.sidebarIconBox, { backgroundColor: item.tint, borderColor: item.color + '30' }]}>
                    <Feather name={item.icon as any} size={16} color={item.color} />
                  </View>
                  <Text style={styles.sidebarItemLabel}>{item.label}</Text>
                  <Feather name="chevron-right" size={14} color={theme.textMuted} />
                </TouchableOpacity>
              ))}

              <View style={styles.sidebarDivider} />
              <Text style={styles.sidebarSection}>PREFERENCES</Text>

              <TouchableOpacity style={styles.sidebarItem} onPress={() => { setIsMenuOpen(false); onNavigate('profile'); }}>
                <View style={[styles.sidebarIconBox, { backgroundColor: theme.tealTint, borderColor: theme.primary + '30' }]}>
                  <Feather name="user" size={16} color={theme.primary} />
                </View>
                <Text style={styles.sidebarItemLabel}>My Profile & Security</Text>
                <Feather name="chevron-right" size={14} color={theme.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.sidebarItem} onPress={toggleTheme}>
                <View style={[styles.sidebarIconBox, { backgroundColor: theme.amberTint, borderColor: theme.amber + '30' }]}>
                  <Feather name={isDarkMode ? 'sun' : 'moon'} size={16} color={theme.amber} />
                </View>
                <Text style={styles.sidebarItemLabel}>{isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.sidebarFooter}>
              <TouchableOpacity style={styles.logoutBtn} onPress={() => { setIsMenuOpen(false); onLogout(); }}>
                <Feather name="log-out" size={16} color={theme.rose} />
                <Text style={styles.logoutText}>Sign Out Workstation</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Top Navbar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuBtn} onPress={() => setIsMenuOpen(true)}>
          <Feather name="menu" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerMid}>
          <Text style={styles.greeting}>WORKFORCE PORTAL</Text>
          <Text style={styles.headerName} numberOfLines={1}>{userName}</Text>
        </View>
        <TouchableOpacity style={styles.avatarSmall} onPress={() => onNavigate('profile')}>
          <LinearGradient colors={['#2563eb', '#139D9E']} style={styles.avatarSmallGrad}>
            <Text style={styles.avatarSmallText}>{initials}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>

        {/* Tenant Status Alert matching Frontend Dashboard */}
        <View style={styles.tenantBanner}>
          <View style={styles.tenantLeft}>
            <View style={styles.liveDot} />
            <Text style={styles.tenantText} numberOfLines={1}>
              Organization: <Text style={styles.tenantBold}>{companyName}</Text>
            </Text>
          </View>
          <View style={styles.liveBadge}>
            <Text style={styles.liveBadgeText}>LIVE CONNECTED</Text>
          </View>
        </View>

        {/* Hero Clock & Punch Card with Signature Frontend Strip */}
        <View style={styles.heroCard}>
          {/* Top Gradient Strip */}
          <LinearGradient
            colors={theme.accentGradient as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.heroStrip}
          />
          <LinearGradient
            colors={isDarkMode ? ['#05252b', '#03191d'] : ['#08697A', '#064b57']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroContent}>
              <View style={styles.heroBadgeRow}>
                <View style={styles.heroPill}>
                  <View style={[styles.heroPillDot, { backgroundColor: theme.secondary }]} />
                  <Text style={styles.heroPillText}>SHIFT IN PROGRESS</Text>
                </View>
                <Text style={styles.heroDate}>{currentDate}</Text>
              </View>

              <View style={styles.heroMainRow}>
                <View>
                  <Text style={styles.heroClockLabel}>SYSTEM TIME</Text>
                  <Text style={styles.heroTime}>{currentTime}</Text>
                </View>

                {/* Vibrant Emerald/Lime Punch Button */}
                <TouchableOpacity
                  style={styles.punchBtn}
                  onPress={() => onNavigate('attendance')}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={['#10b981', '#A6CE38']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.punchBtnGradient}
                  >
                    <Feather name="clock" size={16} color="#042a30" />
                    <Text style={styles.punchBtnText}>PUNCH ATTENDANCE</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* 3 Metric Summary Tiles matching Frontend Balance Cards */}
        <View style={styles.metricsRow}>
          {/* Tile 1: Royal Blue Inflow/Attendance */}
          <View style={[styles.metricTile, { backgroundColor: theme.royalBlue }]}>
            <View style={styles.metricTileTop}>
              <Text style={styles.metricTileLabel}>ATTENDANCE</Text>
              <Feather name="trending-up" size={14} color="rgba(255,255,255,0.9)" />
            </View>
            <Text style={styles.metricTileValue}>100%</Text>
            <Text style={styles.metricTileSub}>On-time Record</Text>
          </View>

          {/* Tile 2: Crisp Dark/White with Outflow/Leave info */}
          <View style={[styles.metricTile, { backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border }]}>
            <View style={styles.metricTileTop}>
              <Text style={[styles.metricTileLabel, { color: theme.textMuted }]}>LEAVE CREDITS</Text>
              <Feather name="file-text" size={14} color={theme.royalBlue} />
            </View>
            <Text style={[styles.metricTileValue, { color: theme.textPrimary }]}>15.0</Text>
            <Text style={[styles.metricTileSub, { color: theme.textSecondary }]}>Days Available</Text>
          </View>

          {/* Tile 3: Emerald/Lime Liquid Reserves / Pending Status */}
          <View style={[styles.metricTile, { backgroundColor: theme.emerald }]}>
            <View style={styles.metricTileTop}>
              <Text style={[styles.metricTileLabel, { color: '#042a30' }]}>TASKS DUE</Text>
              <Feather name="check-circle" size={14} color="#042a30" />
            </View>
            <Text style={[styles.metricTileValue, { color: '#042a30' }]}>{todayTasks.length}</Text>
            <Text style={[styles.metricTileSub, { color: '#06424d' }]}>Actions Today</Text>
          </View>
        </View>

        {/* Quick Actions Grid with Colorful Tiles */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>SERVICES & REQUESTS</Text>
          <Text style={styles.sectionBadge}>6 MODULES</Text>
        </View>
        <View style={styles.grid}>
          {quickActions.map((a, i) => (
            <TouchableOpacity key={i} style={styles.gridItem} onPress={() => onNavigate(a.screen)} activeOpacity={0.82}>
              <View style={[styles.gridCard, { borderTopColor: a.border }]}>
                <View style={[styles.gridIcon, { backgroundColor: a.tint, borderColor: a.border + '35' }]}>
                  <Feather name={a.icon as any} size={20} color={a.color} />
                </View>
                <Text style={styles.gridLabel}>{a.label}</Text>
                <Text style={styles.gridSub}>{a.sub}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Announcements with Colorful Priority Badges */}
        {announcements.length > 0 && (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>OFFICIAL DIRECTIVES & MEMOS</Text>
              <TouchableOpacity onPress={() => onNavigate('memos')}>
                <Text style={styles.seeAllText}>View all ?</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.card}>
              {announcements.map((ann, i) => {
                const badge = getPriorityBadge(ann.priority);
                return (
                  <View key={ann.id} style={[styles.annRow, i < announcements.length - 1 && styles.annRowBorder]}>
                    <View style={[styles.priorityIndicator, { backgroundColor: badge.color }]} />
                    <View style={{ flex: 1 }}>
                      <View style={styles.annHeader}>
                        <View style={[styles.priorityChip, { backgroundColor: badge.bg, borderColor: badge.border + '40' }]}>
                          <Text style={[styles.priorityChipText, { color: badge.color }]}>{badge.text}</Text>
                        </View>
                        <Text style={styles.annDate}>
                          {new Date(ann.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </Text>
                      </View>
                      <Text style={styles.annTitle}>{ann.title}</Text>
                      <Text style={styles.annDesc} numberOfLines={2}>{ann.content}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* Today's Tasks */}
        {todayTasks.length > 0 && (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>TODAY'S SCHEDULED TASKS</Text>
              <TouchableOpacity onPress={() => onNavigate('todo')}>
                <Text style={styles.seeAllText}>Open To-Do ?</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.card}>
              {todayTasks.map((task, i) => {
                const badge = getPriorityBadge(task.priority);
                return (
                  <TouchableOpacity key={task.id} style={[styles.taskRow, i < todayTasks.length - 1 && styles.annRowBorder]} onPress={() => onNavigate('todo')}>
                    <View style={[styles.taskCheckIcon, { borderColor: badge.color }]}>
                      <View style={[styles.taskCheckDot, { backgroundColor: badge.color }]} />
                    </View>
                    <Text style={styles.taskTitle} numberOfLines={1}>{task.title}</Text>
                    <View style={[styles.priorityChip, { backgroundColor: badge.bg, borderColor: badge.border + '40' }]}>
                      <Text style={[styles.priorityChipText, { color: badge.color }]}>{badge.text}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
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
    position: 'absolute', top: -80, right: -80, width: 260, height: 260,
    backgroundColor: theme.glow1, opacity: 0.12,
  },
  blob2: {
    position: 'absolute', bottom: 120, left: -100, width: 280, height: 280,
    backgroundColor: theme.glow2, opacity: 0.1,
  },
  // Sidebar
  overlay: { flex: 1, backgroundColor: theme.sidebarOverlay, justifyContent: 'flex-start', alignItems: 'flex-start' },
  sidebar: { width: Math.min(SCREEN_WIDTH * 0.85, 340), height: '100%', backgroundColor: theme.sidebarBg, borderRightWidth: 1, borderRightColor: theme.border, position: 'relative' },
  sidebarStrip: { height: 4, position: 'absolute', top: 0, left: 0, right: 0 },
  sidebarTop: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: Platform.OS === 'ios' ? 56 : 36, borderBottomWidth: 1, borderBottomColor: theme.border },
  avatarWrap: { marginRight: 12 },
  avatar: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  sidebarName: { color: theme.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 2 },
  sidebarBadgeRow: { flexDirection: 'row', alignItems: 'center' },
  sidebarRole: { color: theme.royalBlue, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  sidebarBadgeSep: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: theme.textMuted, marginHorizontal: 6 },
  sidebarPlan: { color: theme.emerald, fontSize: 10, fontWeight: '800' },
  closeSidebar: { padding: 4, marginLeft: 8 },
  sidebarList: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  sidebarSection: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, color: theme.textMuted, marginTop: 6, marginBottom: 8, marginLeft: 4 },
  sidebarItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4 },
  sidebarIconBox: { width: 32, height: 32, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  sidebarItemLabel: { flex: 1, color: theme.textPrimary, fontSize: 13, fontWeight: '600' },
  sidebarDivider: { height: 1, backgroundColor: theme.border, marginVertical: 14 },
  sidebarFooter: { padding: 20, borderTopWidth: 1, borderTopColor: theme.border },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderWidth: 1, borderColor: theme.rose + '40',
    backgroundColor: theme.roseTint,
  },
  logoutText: { color: theme.rose, fontSize: 13, fontWeight: '700', marginLeft: 8 },
  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: theme.border,
  },
  menuBtn: { padding: 8, backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border, marginRight: 12 },
  headerMid: { flex: 1 },
  greeting: { color: theme.royalBlue, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  headerName: { color: theme.textPrimary, fontSize: 16, fontWeight: '700' },
  avatarSmall: { marginLeft: 12 },
  avatarSmallGrad: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  avatarSmallText: { color: '#fff', fontSize: 13, fontWeight: '900' },
  // Body
  body: { flex: 1 },
  bodyContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },
  // Tenant Status Alert (Exact match to frontend)
  tenantBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: theme.emeraldTint, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.25)',
    paddingHorizontal: 12, paddingVertical: 8, marginBottom: 16,
  },
  tenantLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.emerald, marginRight: 8 },
  tenantText: { fontSize: 11, color: theme.textSecondary },
  tenantBold: { fontWeight: '700', color: theme.textPrimary },
  liveBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)', borderWidth: 1, borderColor: theme.emerald,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  liveBadgeText: { fontSize: 9, fontWeight: '800', color: theme.emerald, letterSpacing: 0.5 },
  // Hero Card
  heroCard: {
    marginBottom: 20, backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border,
    position: 'relative', overflow: 'hidden',
  },
  heroStrip: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, zIndex: 10 },
  heroGradient: { padding: 18 },
  heroContent: { width: '100%' },
  heroBadgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  heroPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 8, paddingVertical: 3 },
  heroPillDot: { width: 5, height: 5, borderRadius: 2.5, marginRight: 6 },
  heroPillText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  heroDate: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '500' },
  heroMainRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  heroClockLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 9, fontWeight: '800', letterSpacing: 1, marginBottom: 2 },
  heroTime: { color: '#ffffff', fontSize: 28, fontWeight: '300', letterSpacing: 1 },
  punchBtn: { overflow: 'hidden' },
  punchBtnGradient: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10,
  },
  punchBtnText: { color: '#042a30', fontWeight: '900', fontSize: 11, letterSpacing: 0.5, marginLeft: 6 },
  // 3 Metric Tiles
  metricsRow: { flexDirection: 'row', marginHorizontal: -4, marginBottom: 24 },
  metricTile: {
    flex: 1, marginHorizontal: 4, padding: 12, minHeight: 84, justifyContent: 'space-between',
  },
  metricTileTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metricTileLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8, color: 'rgba(255,255,255,0.85)' },
  metricTileValue: { fontSize: 20, fontWeight: '900', color: '#ffffff', marginVertical: 2 },
  metricTileSub: { fontSize: 9, fontWeight: '500', color: 'rgba(255,255,255,0.75)' },
  // Sections
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, color: theme.textMuted },
  sectionBadge: { fontSize: 10, fontWeight: '700', color: theme.royalBlue },
  seeAllText: { fontSize: 11, fontWeight: '700', color: theme.royalBlue },
  // Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5, marginBottom: 24 },
  gridItem: { width: '33.33%', padding: 5 },
  gridCard: {
    backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border, borderTopWidth: 3,
    padding: 12, alignItems: 'center',
  },
  gridIcon: { width: 38, height: 38, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  gridLabel: { color: theme.textPrimary, fontSize: 11, fontWeight: '700', textAlign: 'center', marginBottom: 2 },
  gridSub: { color: theme.textMuted, fontSize: 9, textAlign: 'center' },
  // Cards
  card: { backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border, marginBottom: 24 },
  annRow: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, position: 'relative' },
  annRowBorder: { borderBottomWidth: 1, borderBottomColor: theme.border },
  priorityIndicator: { width: 3, position: 'absolute', top: 0, bottom: 0, left: 0 },
  annHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  priorityChip: { borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2 },
  priorityChipText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  annDate: { fontSize: 10, color: theme.textMuted },
  annTitle: { color: theme.textPrimary, fontSize: 13, fontWeight: '700', marginBottom: 2 },
  annDesc: { color: theme.textSecondary, fontSize: 12, lineHeight: 17 },
  taskRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  taskCheckIcon: {
    width: 16, height: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  taskCheckDot: { width: 6, height: 6 },
  taskTitle: { flex: 1, color: theme.textPrimary, fontSize: 13, fontWeight: '600' },
});
