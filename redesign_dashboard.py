import re

with open('c:/xampp/htdocs/atech_prime/mobile/src/screens/DashboardScreen.tsx', 'r') as f:
    content = f.read()

# Replace Quick Actions section
old_quick_actions = """        <View style={styles.grid}>
          <TouchableOpacity 
            style={styles.card} 
            activeOpacity={0.8}
            onPress={() => onNavigate('attendance')}
          >
            <View style={[styles.iconWrapper, { backgroundColor: theme.glow1 }]}>
              <Feather name="clock" size={24} color={theme.primary} />
            </View>
            <Text style={styles.cardTitle}>Time In/Out</Text>
            <Text style={styles.cardDesc}>Record your daily attendance</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.card} 
            activeOpacity={0.8}
            onPress={() => onNavigate('leave_request')}
          >
            <View style={[styles.iconWrapper, { backgroundColor: isDarkMode ? 'rgba(168, 85, 247, 0.1)' : 'rgba(147, 51, 234, 0.1)' }]}>
              <Feather name="file-text" size={24} color={theme.purple} />
            </View>
            <Text style={styles.cardTitle}>Leave Request</Text>
            <Text style={styles.cardDesc}>Apply for vacation or sick leave</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} activeOpacity={0.8}>
            <View style={[styles.iconWrapper, { backgroundColor: isDarkMode ? 'rgba(34, 197, 94, 0.1)' : 'rgba(22, 163, 74, 0.1)' }]}>
              <Feather name="map" size={24} color={theme.success} />
            </View>
            <Text style={styles.cardTitle}>Business Trip</Text>
            <Text style={styles.cardDesc}>Request official travel</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.card} 
            activeOpacity={0.8}
            onPress={() => onNavigate('undertime_request')}
          >
            <View style={[styles.iconWrapper, { backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.1)' : 'rgba(217, 119, 6, 0.1)' }]}>
              <Feather name="clock" size={24} color={theme.warning} />
            </View>
            <Text style={styles.cardTitle}>Undertime Request</Text>
            <Text style={styles.cardDesc}>Request to leave work early</Text>
          </TouchableOpacity>
        </View>"""

new_quick_actions = """        <View style={styles.actionList}>
          <TouchableOpacity style={styles.actionRow} activeOpacity={0.8} onPress={() => onNavigate('attendance')}>
            <View style={styles.actionRowLeft}>
              <View style={[styles.actionIconMini, { backgroundColor: theme.glow1 }]}>
                <Feather name="clock" size={16} color={theme.primary} />
              </View>
              <View>
                <Text style={styles.actionTitleMini}>Time In/Out</Text>
                <Text style={styles.actionDescMini}>Record daily attendance</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={16} color={theme.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionRow} activeOpacity={0.8} onPress={() => onNavigate('leave_request')}>
            <View style={styles.actionRowLeft}>
              <View style={[styles.actionIconMini, { backgroundColor: isDarkMode ? 'rgba(168, 85, 247, 0.1)' : 'rgba(147, 51, 234, 0.1)' }]}>
                <Feather name="file-text" size={16} color={theme.purple} />
              </View>
              <View>
                <Text style={styles.actionTitleMini}>Leave Request</Text>
                <Text style={styles.actionDescMini}>Apply for vacation or sick leave</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={16} color={theme.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionRow} activeOpacity={0.8}>
            <View style={styles.actionRowLeft}>
              <View style={[styles.actionIconMini, { backgroundColor: isDarkMode ? 'rgba(34, 197, 94, 0.1)' : 'rgba(22, 163, 74, 0.1)' }]}>
                <Feather name="map" size={16} color={theme.success} />
              </View>
              <View>
                <Text style={styles.actionTitleMini}>Business Trip</Text>
                <Text style={styles.actionDescMini}>Request official travel</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={16} color={theme.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionRow, { borderBottomWidth: 0 }]} activeOpacity={0.8} onPress={() => onNavigate('undertime_request')}>
            <View style={styles.actionRowLeft}>
              <View style={[styles.actionIconMini, { backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.1)' : 'rgba(217, 119, 6, 0.1)' }]}>
                <Feather name="clock" size={16} color={theme.warning} />
              </View>
              <View>
                <Text style={styles.actionTitleMini}>Undertime Request</Text>
                <Text style={styles.actionDescMini}>Request to leave work early</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={16} color={theme.textMuted} />
          </TouchableOpacity>
        </View>"""

content = content.replace(old_quick_actions, new_quick_actions)

# Remove Shadows and change padding from sidebar and general
content = content.replace("shadowColor: '#000',", "")
content = content.replace("shadowOffset: { width: 10, height: 0 },", "")
content = content.replace("shadowOpacity: 0.5,", "")
content = content.replace("shadowRadius: 20,", "")
content = content.replace("elevation: 20,", "")

content = content.replace("shadowOffset: { width: 0, height: 4 },", "")
content = content.replace("shadowOpacity: 0.3,", "")
content = content.replace("shadowRadius: 8,", "")
content = content.replace("elevation: 5,", "")

# Replace the styles for the new layout
styles_start = content.find("  grid: {")
styles_end = content.find("  activityCard: {")

new_styles = """  actionList: {
    backgroundColor: theme.cardBg,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 0,
    marginBottom: 32,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  actionRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconMini: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 0,
    marginRight: 16,
  },
  actionTitleMini: {
    color: theme.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  actionDescMini: {
    color: theme.textMuted,
    fontSize: 12,
  },
"""

content = content[:styles_start] + new_styles + content[styles_end:]

with open('c:/xampp/htdocs/atech_prime/mobile/src/screens/DashboardScreen.tsx', 'w') as f:
    f.write(content)
print("DashboardScreen redesigned successfully.")
