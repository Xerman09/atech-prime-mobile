import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Modal, Dimensions, Animated
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
const SIDEBAR_WIDTH = Math.min(SCREEN_WIDTH * 0.85, 340);

export default function DashboardScreen({ userName, token, onLogout, onNavigate }: DashboardScreenProps) {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const styles = getStyles(theme, isDarkMode);
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [companyName, setCompanyName] = useState('ATECH PRIME');
  const [companyPlan, setCompanyPlan] = useState('ENTERPRISE');
  const [modalVisible, setModalVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  const openSidebar = () => {
    setModalVisible(true);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeSidebar = (callback?: () => void) => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -SIDEBAR_WIDTH,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalVisible(false);
      if (callback) callback();
    });
  };

  // Lock background window/body scrolling on web when sidebar drawer is open
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      if (modalVisible) {
        const prevBodyOverflow = document.body.style.overflow;
        const prevHtmlOverflow = document.documentElement.style.overflow;
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        return () => {
          document.body.style.overflow = prevBodyOverflow;
          document.documentElement.style.overflow = prevHtmlOverflow;
        };
      }
    }
  }, [modalVisible]);

  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [todayTasks, setTodayTasks] = useState<any[]>([]);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(true);
  const [metrics, setMetrics] = useState({
    attendanceRate: 100,
    leaveCredits: 0.0,
    tasksDue: 0,
    isLoading: true,
  });

  const isTokenString = (str: string) => !str || str.startsWith('MS4') || (str.length > 30 && str.includes('.'));
  const [localName, setLocalName] = useState(userName);

  useEffect(() => {
    if (!isTokenString(userName)) {
      setLocalName(userName);
    }
  }, [userName]);

  useEffect(() => {
    const loadTenantInfo = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user_data');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed.name && !isTokenString(parsed.name)) {
            setLocalName(parsed.name);
          }
          if (parsed.company_name) setCompanyName(parsed.company_name);
          if (parsed.company_plan) setCompanyPlan(parsed.company_plan.toUpperCase());
        }
      } catch (e) {}
    };
    loadTenantInfo();
  }, []);

  const displayName = isTokenString(localName) ? 'Workstation User' : localName;
  const initials = displayName.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'WU';

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setCurrentDate(now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }));
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      if (!token) { setIsLoadingAnnouncements(false); return; }
      try {
        let url = `http://192.168.100.11/atech_prime/backend/public/api/hr/announcements`;
        if (Platform.OS === 'web') url = `http://${window.location.hostname}/atech_prime/backend/public/api/hr/announcements`;
        const res = await fetch(url, { 
          cache: 'no-store', 
          headers: { 
            'Accept': 'application/json', 
            'Authorization': `Bearer ${token}`,
            'X-Authorization': `Bearer ${token}`
          } 
        });
        if (res.status === 401) {
          onLogout();
          return;
        }
        if (res.ok) {
          const data = await res.json();
          setAnnouncements(data.filter((a: any) => a.status === 'published').slice(0, 3));
        }
      } catch (e) { console.error(e); } finally { setIsLoadingAnnouncements(false); }
    };
    const fetchTasks = async () => {
      if (!token) return;
      try {
        let url = `http://192.168.100.11/atech_prime/backend/public/api/todos`;
        if (Platform.OS === 'web') url = `http://${window.location.hostname}/atech_prime/backend/public/api/todos`;
        const res = await fetch(url, { 
          cache: 'no-store',
          headers: { 
            'Accept': 'application/json', 
            'Authorization': `Bearer ${token}`,
            'X-Authorization': `Bearer ${token}`
          } 
        });
        if (res.status === 401) {
          onLogout();
          return;
        }
        if (res.ok) {
          const data = await res.json();
          const today = new Date();
          const y = today.getFullYear(), m = String(today.getMonth()+1).padStart(2,'0'), d = String(today.getDate()).padStart(2,'0');
          const todayStr = `${y}-${m}-${d}`;
          const filtered = data.filter((t: any) => !t.is_completed && (t.due_date === todayStr || t.start_date === todayStr || (t.start_date && t.due_date && t.start_date <= todayStr && t.due_date >= todayStr)));
          setTodayTasks(filtered.slice(0, 3));
          setMetrics(prev => ({ ...prev, tasksDue: filtered.length }));
        }
      } catch (e) { console.error(e); }
    };
    const fetchMetrics = async () => {
      if (!token) return;
      try {
        let empIdQuery = '';
        try {
          const uData = await AsyncStorage.getItem('user_data');
          if (uData) {
            const parsed = JSON.parse(uData);
            if (parsed.employee_id) empIdQuery = `?employee_id=${parsed.employee_id}`;
          }
        } catch {}

        let url = `http://192.168.100.11/atech_prime/backend/public/api/attendance/my-summary${empIdQuery}`;
        if (Platform.OS === 'web') url = `http://${window.location.hostname}/atech_prime/backend/public/api/attendance/my-summary${empIdQuery}`;
        const res = await fetch(url, { 
          cache: 'no-store', 
          headers: { 
            'Accept': 'application/json', 
            'Authorization': `Bearer ${token}`,
            'X-Authorization': `Bearer ${token}`
          } 
        });
        if (res.status === 401) {
          onLogout();
          return;
        }
        if (res.ok) {
          const data = await res.json();
          setMetrics(prev => ({
            ...prev,
            attendanceRate: typeof data.attendance_rate === 'number' ? data.attendance_rate : 100,
            leaveCredits: typeof data.leave_credits === 'number' ? data.leave_credits : 0.0,
            tasksDue: typeof data.tasks_due === 'number' ? data.tasks_due : prev.tasksDue,
            isLoading: false,
          }));
        }
      } catch (e) { console.error('Failed to fetch dashboard metrics:', e); }
    };
    fetchAnnouncements();
    fetchTasks();
    fetchMetrics();
  }, [token]);

  // Clean, Unified Quick Actions in Green-to-Blue Theme
  const quickActions = [
    { icon: 'clock', label: "Time In/Out", sub: "Record punch", screen: 'attendance', color: theme.emerald },
    { icon: 'file-text', label: "Leave Request", sub: "Apply time off", screen: 'leave_request', color: theme.primaryLight },
    { icon: 'box', label: "Assigned Assets", sub: "Tools in custody", screen: 'assets', color: theme.emerald },
    { icon: 'map', label: "Business Trip", sub: "Travel permit", screen: 'business_trip_request', color: theme.primaryLight },
    { icon: 'corner-down-left', label: "Undertime", sub: "Early leave", screen: 'undertime_request', color: theme.primaryLight },
    { icon: 'award', label: "COE Request", sub: "Certificate", screen: 'coe_request', color: theme.primary },
    { icon: 'calendar', label: "Attendance", sub: "Audit logs", screen: 'attendance_report', color: theme.primary },
  ];

  const sidebarItems = [
    { icon: 'home', label: 'Dashboard', screen: 'dashboard', color: theme.primaryLight },
    { icon: 'clock', label: 'Time In/Out', screen: 'attendance', color: theme.emerald },
    { icon: 'box', label: 'Assigned Assets', screen: 'assets', color: theme.emerald },
    { icon: 'calendar', label: 'Attendance Report', screen: 'attendance_report', color: theme.primaryLight },
    { icon: 'file-text', label: 'Leave Requests', screen: 'leave_request', color: theme.primaryLight },
    { icon: 'corner-down-left', label: 'Undertime Requests', screen: 'undertime_request', color: theme.primaryLight },
    { icon: 'award', label: 'COE Requests', screen: 'coe_request', color: theme.primaryLight },
    { icon: 'book', label: 'Company Policies', screen: 'policies', color: theme.primary },
    { icon: 'inbox', label: 'Memorandums', screen: 'memos', color: theme.primary },
    { icon: 'check-square', label: 'To-Do List', screen: 'todo', color: theme.emerald },
  ];

  const getPriorityBadge = (p: string) => {
    const lower = (p || '').toLowerCase();
    if (lower === 'high' || lower === 'urgent') {
      return { text: p.toUpperCase(), color: theme.rose, bg: theme.roseTint, border: theme.rose };
    }
    return { text: (p || 'NORMAL').toUpperCase(), color: theme.primaryLight, bg: theme.tealTint, border: theme.primaryLight };
  };

  return (
    <View style={styles.container}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <LinearGradient colors={theme.backgroundGradient as any} style={StyleSheet.absoluteFillObject} />

      {/* Subtle ambient lighting */}
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      {/* Sidebar Modal - Smooth Left-to-Right Drawer Animation */}
      <Modal visible={modalVisible} transparent animationType="none" onRequestClose={() => closeSidebar()}>
        <View style={[StyleSheet.absoluteFillObject, Platform.OS === 'web' ? ({ position: 'fixed', zIndex: 9999 } as any) : {}]}>
          <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
            <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => closeSidebar()} />
          </Animated.View>

          <Animated.View 
            style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}
            {...(Platform.OS === 'web' ? { onWheel: (e: any) => e.stopPropagation() } : {})}
          >
            {/* Signature Top Gradient Strip */}
            <LinearGradient colors={theme.accentGradient as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.sidebarStrip} />

            <View style={styles.sidebarTop}>
              <View style={styles.avatarWrap}>
                <LinearGradient colors={['#10b981', '#08697A']} style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </LinearGradient>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sidebarName} numberOfLines={1}>{displayName}</Text>
                <View style={styles.sidebarBadgeRow}>
                  <Text style={styles.sidebarRole}>EMPLOYEE</Text>
                  <View style={styles.sidebarBadgeSep} />
                  <Text style={styles.sidebarPlan}>{companyPlan}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => closeSidebar()} style={styles.closeSidebar}>
                <Feather name="x" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.sidebarScrollView} 
              contentContainerStyle={styles.sidebarList} 
              showsVerticalScrollIndicator={false}
              bounces={false}
              nestedScrollEnabled={true}
              overScrollMode="never"
            >
              <Text style={styles.sidebarSection}>PORTAL NAVIGATION</Text>
              {sidebarItems.map((item) => (
                <TouchableOpacity key={item.screen} style={styles.sidebarItem} onPress={() => closeSidebar(() => onNavigate(item.screen))}>
                  <View style={[styles.sidebarIconBox, { backgroundColor: theme.tealTint, borderColor: theme.border }]}>
                    <Feather name={item.icon as any} size={16} color={item.color} />
                  </View>
                  <Text style={styles.sidebarItemLabel}>{item.label}</Text>
                  <Feather name="chevron-right" size={14} color={theme.textMuted} />
                </TouchableOpacity>
              ))}

              <View style={styles.sidebarDivider} />
              <Text style={styles.sidebarSection}>PREFERENCES</Text>

              <TouchableOpacity style={styles.sidebarItem} onPress={() => closeSidebar(() => onNavigate('profile'))}>
                <View style={[styles.sidebarIconBox, { backgroundColor: theme.tealTint, borderColor: theme.border }]}>
                  <Feather name="user" size={16} color={theme.primaryLight} />
                </View>
                <Text style={styles.sidebarItemLabel}>My Profile & Security</Text>
                <Feather name="chevron-right" size={14} color={theme.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.sidebarItem} onPress={toggleTheme}>
                <View style={[styles.sidebarIconBox, { backgroundColor: theme.tealTint, borderColor: theme.border }]}>
                  <Feather name={isDarkMode ? 'sun' : 'moon'} size={16} color={theme.primaryLight} />
                </View>
                <Text style={styles.sidebarItemLabel}>{isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.sidebarFooter}>
              <TouchableOpacity style={styles.logoutBtn} onPress={() => closeSidebar(() => onLogout())}>
                <Feather name="log-out" size={16} color={theme.rose} />
                <Text style={styles.logoutText}>Sign Out Workstation</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Top Navbar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuBtn} onPress={openSidebar}>
          <Feather name="menu" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerMid}>
          <Text style={styles.greeting}>WORKFORCE PORTAL</Text>
          <Text style={styles.headerName} numberOfLines={1}>{displayName}</Text>
        </View>
        <TouchableOpacity style={styles.avatarSmall} onPress={() => onNavigate('profile')}>
          <LinearGradient colors={['#10b981', '#08697A']} style={styles.avatarSmallGrad}>
            <Text style={styles.avatarSmallText}>{initials}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.body} 
        contentContainerStyle={styles.bodyContent} 
        showsVerticalScrollIndicator={false}
        scrollEnabled={!modalVisible}
      >

        {/* Tenant Status Alert */}
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

        {/* Hero Clock & Punch Card with Signature Top Strip */}
        <View style={styles.heroCard}>
          {/* Top Gradient Strip */}
          <LinearGradient
            colors={theme.accentGradient as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.heroStrip}
          />
          <View style={styles.heroContent}>
            {/* Row 1: Shift Status Badge + Date */}
            <View style={styles.heroBadgeRow}>
              <View style={styles.heroPill}>
                <View style={styles.heroPillDot} />
                <Text style={styles.heroPillText}>SHIFT IN PROGRESS</Text>
              </View>
              <View style={styles.heroDatePill}>
                <Feather name="calendar" size={11} color={theme.textMuted} style={{ marginRight: 5 }} />
                <Text style={styles.heroDate}>{currentDate}</Text>
              </View>
            </View>

            {/* Row 2: Live Clock & Shift Details */}
            <View style={styles.clockSection}>
              <View style={styles.clockLeft}>
                <View style={styles.clockHeader}>
                  <View style={styles.liveClockDot} />
                  <Text style={styles.heroClockLabel}>SYSTEM TIME</Text>
                </View>
                <View style={styles.timeValueRow}>
                  <Text style={styles.heroTimeDigits}>{currentTime.split(' ')[0] || currentTime}</Text>
                  {currentTime.split(' ')[1] ? (
                    <View style={styles.periodBadge}>
                      <Text style={styles.periodBadgeText}>{currentTime.split(' ')[1]}</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              <View style={styles.clockRightMeta}>
                <View style={styles.shiftMetaTag}>
                  <Feather name="shield" size={10} color={isDarkMode ? '#38bdf8' : theme.primary} style={{ marginRight: 4 }} />
                  <Text style={styles.shiftMetaTagText}>TIMEKEEPING</Text>
                </View>
                <Text style={styles.shiftHoursText}>08:00 AM – 05:00 PM</Text>
                <Text style={styles.shiftHoursSub}>Standard Day Shift</Text>
              </View>
            </View>

            {/* Row 3: Full-Width Emerald Punch Button */}
            <TouchableOpacity
              style={styles.punchBtn}
              onPress={() => onNavigate('attendance')}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#10b981', '#139D9E', '#08697A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.punchBtnGradient}
              >
                <View style={styles.punchIconCircle}>
                  <Feather name="clock" size={16} color="#ffffff" />
                </View>
                <View style={styles.punchTextCol}>
                  <Text style={styles.punchBtnText}>PUNCH ATTENDANCE</Text>
                  <Text style={styles.punchBtnSub}>Tap to record Time In or Time Out</Text>
                </View>
                <View style={styles.punchArrowWrap}>
                  <Feather name="arrow-right" size={16} color="#ffffff" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3 Unified Metric Summary Tiles */}
        <View style={styles.metricsRow}>
          {/* Tile 1: Attendance */}
          <TouchableOpacity 
            style={styles.metricTile} 
            onPress={() => onNavigate('attendance_report')} 
            activeOpacity={0.75}
          >
            <View style={styles.metricTileTop}>
              <Text style={styles.metricTileLabel}>ATTENDANCE</Text>
              <Feather name="trending-up" size={14} color={theme.emerald} />
            </View>
            <Text style={[styles.metricTileValue, { color: theme.emerald }]}>{metrics.attendanceRate}%</Text>
            <Text style={styles.metricTileSub}>On-time Record</Text>
          </TouchableOpacity>

          {/* Tile 2: Leave Credits */}
          <TouchableOpacity 
            style={styles.metricTile} 
            onPress={() => onNavigate('leave_request')} 
            activeOpacity={0.75}
          >
            <View style={styles.metricTileTop}>
              <Text style={styles.metricTileLabel}>LEAVE CREDITS</Text>
              <Feather name="file-text" size={14} color={theme.primaryLight} />
            </View>
            <Text style={[styles.metricTileValue, { color: theme.textPrimary }]}>{metrics.leaveCredits.toFixed(1)}</Text>
            <Text style={styles.metricTileSub}>Days Available</Text>
          </TouchableOpacity>

          {/* Tile 3: Tasks Due */}
          <TouchableOpacity 
            style={styles.metricTile} 
            onPress={() => onNavigate('todo')} 
            activeOpacity={0.75}
          >
            <View style={styles.metricTileTop}>
              <Text style={styles.metricTileLabel}>TASKS DUE</Text>
              <Feather name="check-circle" size={14} color={theme.primaryLight} />
            </View>
            <Text style={[styles.metricTileValue, { color: theme.textPrimary }]}>{metrics.tasksDue}</Text>
            <Text style={styles.metricTileSub}>Actions Today</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions Grid - Clean, Simple Cards */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>SERVICES & REQUESTS</Text>
          <Text style={styles.sectionBadge}>6 MODULES</Text>
        </View>
        <View style={styles.grid}>
          {quickActions.map((a, i) => (
            <TouchableOpacity key={i} style={styles.gridItem} onPress={() => onNavigate(a.screen)} activeOpacity={0.82}>
              <View style={styles.gridCard}>
                <View style={[styles.gridIcon, { backgroundColor: theme.tealTint }]}>
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
  // Sidebar Drawer
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.sidebarOverlay,
    ...(Platform.OS === 'web' ? ({
      position: 'fixed',
    } as any) : {}),
  },
  sidebar: {
    width: SIDEBAR_WIDTH,
    height: '100%',
    maxHeight: '100%',
    backgroundColor: theme.sidebarBg,
    borderRightWidth: 1,
    borderRightColor: theme.border,
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    zIndex: 100,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    ...(Platform.OS === 'web' ? ({
      position: 'fixed',
      overscrollBehavior: 'contain',
    } as any) : {}),
  },
  sidebarScrollView: {
    flex: 1,
    height: '100%',
    ...(Platform.OS === 'web' ? ({
      overscrollBehavior: 'contain',
      WebkitOverflowScrolling: 'touch',
    } as any) : {}),
  },
  sidebarStrip: { height: 4, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  sidebarTop: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 20, 
    paddingTop: Platform.OS === 'ios' ? 56 : 36, 
    borderBottomWidth: 1, 
    borderBottomColor: theme.border,
    flexShrink: 0,
  },
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
  sidebarFooter: { 
    padding: 20, 
    borderTopWidth: 1, 
    borderTopColor: theme.border,
    flexShrink: 0,
  },
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
    marginBottom: 20,
    backgroundColor: theme.cardBg,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 0,
    position: 'relative',
    overflow: 'hidden',
  },
  heroStrip: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, zIndex: 10 },
  heroContent: { padding: 18, width: '100%' },
  heroBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.emeraldTint,
    borderWidth: 1,
    borderColor: isDarkMode ? 'rgba(16, 185, 129, 0.35)' : 'rgba(16, 185, 129, 0.25)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 0,
  },
  heroPillDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.emerald, marginRight: 6 },
  heroPillText: {
    color: isDarkMode ? '#34d399' : '#047857',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  heroDatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#f8fafc',
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 0,
  },
  heroDate: { color: theme.textSecondary, fontSize: 11, fontWeight: '600' },
  clockSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  clockLeft: {
    flex: 1,
  },
  clockHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  liveClockDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: theme.primaryLight, marginRight: 6 },
  heroClockLabel: { color: theme.textMuted, fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  timeValueRow: { flexDirection: 'row', alignItems: 'baseline' },
  heroTimeDigits: { color: theme.textPrimary, fontSize: 34, fontWeight: '800', letterSpacing: -0.5 },
  periodBadge: {
    marginLeft: 6,
    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9',
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 0,
  },
  periodBadgeText: { color: theme.textSecondary, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  clockRightMeta: {
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  shiftMetaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.tealTint,
    borderWidth: 1,
    borderColor: isDarkMode ? 'rgba(19, 157, 158, 0.3)' : 'rgba(8, 105, 122, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 0,
    marginBottom: 4,
  },
  shiftMetaTagText: {
    color: isDarkMode ? '#38bdf8' : theme.primary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  shiftHoursText: {
    color: theme.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  shiftHoursSub: {
    color: theme.textMuted,
    fontSize: 9,
    fontWeight: '500',
    marginTop: 1,
  },
  punchBtn: {
    width: '100%',
    borderRadius: 0,
    overflow: 'hidden',
  },
  punchBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  punchIconCircle: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderRadius: 0,
  },
  punchTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  punchBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.6,
  },
  punchBtnSub: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    fontSize: 10,
    marginTop: 1,
  },
  punchArrowWrap: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  // 3 Metric Tiles
  metricsRow: { flexDirection: 'row', marginHorizontal: -4, marginBottom: 24 },
  metricTile: {
    flex: 1, marginHorizontal: 4, padding: 12, minHeight: 84, justifyContent: 'space-between',
    backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border,
  },
  metricTileTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metricTileLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8, color: theme.textMuted },
  metricTileValue: { fontSize: 20, fontWeight: '900', marginVertical: 2 },
  metricTileSub: { fontSize: 9, fontWeight: '500', color: theme.textSecondary },
  // Sections
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, color: theme.textMuted },
  sectionBadge: { fontSize: 10, fontWeight: '700', color: theme.primaryLight },
  seeAllText: { fontSize: 11, fontWeight: '700', color: theme.primaryLight },
  // Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5, marginBottom: 24 },
  gridItem: { width: '33.33%', padding: 5 },
  gridCard: {
    backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border,
    padding: 12, alignItems: 'center',
  },
  gridIcon: { width: 38, height: 38, borderWidth: 1, borderColor: theme.border, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
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
