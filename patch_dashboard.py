import re

with open('c:/xampp/htdocs/atech_prime/mobile/src/screens/DashboardScreen.tsx', 'r') as f:
    content = f.read()

# Replace Imports
content = content.replace("import { Feather } from '@expo/vector-icons';", "import { Feather } from '@expo/vector-icons';\nimport { useTheme, ThemeColors } from '../theme/ThemeContext';")

# Replace hook
content = content.replace("export default function DashboardScreen({ userName, onLogout, onNavigate }: DashboardScreenProps) {\n  const [currentDate, setCurrentDate]", "export default function DashboardScreen({ userName, onLogout, onNavigate }: DashboardScreenProps) {\n  const { theme, isDarkMode, toggleTheme } = useTheme();\n  const styles = getStyles(theme);\n  const [currentDate, setCurrentDate]")

# Replace Gradient and StatusBar
content = content.replace("colors={['#020617', '#0f172a', '#020617']}", "colors={theme.backgroundGradient}")
content = content.replace('<StatusBar style="light" />', '<StatusBar style={isDarkMode ? "light" : "dark"} />')

# Replace Icons & UI Elements
content = content.replace('color="#f8fafc"', 'color={theme.textPrimary}')
content = content.replace("colors={['#2563eb', '#6366f1', '#22d3ee']}", "colors={theme.primaryGradient as any}")
content = content.replace('color="#94a3b8"', 'color={theme.textSecondary}')
content = content.replace('color="#38bdf8"', 'color={theme.primary}')
content = content.replace('color="#ef4444"', 'color={theme.error}')
content = content.replace('color="#a855f7"', 'color={theme.purple}')
content = content.replace('color="#22c55e"', 'color={theme.success}')
content = content.replace('color="#f59e0b"', 'color={theme.warning}')
content = content.replace("backgroundColor: 'rgba(56, 189, 248, 0.1)'", "backgroundColor: theme.glow1")
content = content.replace("backgroundColor: 'rgba(168, 85, 247, 0.1)'", "backgroundColor: isDarkMode ? 'rgba(168, 85, 247, 0.1)' : 'rgba(147, 51, 234, 0.1)'")
content = content.replace("backgroundColor: 'rgba(34, 197, 94, 0.1)'", "backgroundColor: isDarkMode ? 'rgba(34, 197, 94, 0.1)' : 'rgba(22, 163, 74, 0.1)'")
content = content.replace("backgroundColor: 'rgba(245, 158, 11, 0.1)'", "backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.1)' : 'rgba(217, 119, 6, 0.1)'")

# Add toggle theme button
toggle_button = """
              <TouchableOpacity style={styles.sidebarItem} onPress={toggleTheme}>
                <Feather name={isDarkMode ? "sun" : "moon"} size={20} color={theme.textSecondary} style={styles.sidebarItemIcon} />
                <Text style={styles.sidebarItemText}>{isDarkMode ? "Light Mode" : "Dark Mode"}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.sidebarItem}>
"""
content = content.replace("<TouchableOpacity style={styles.sidebarItem}>\n                <Feather name=\"settings\"", toggle_button + "                <Feather name=\"settings\"")

# Replace Styles
styles_start = content.find("const styles = StyleSheet.create({")
styles_content = content[styles_start:]
styles_content = styles_content.replace("const styles = StyleSheet.create({", "const getStyles = (theme: ThemeColors) => StyleSheet.create({")
styles_content = styles_content.replace("'rgba(56, 189, 248, 0.1)'", "theme.glow1")
styles_content = styles_content.replace("'rgba(37, 99, 235, 0.1)'", "theme.glow2")
styles_content = styles_content.replace("'rgba(15, 23, 42, 0.85)'", "theme.cardBg")
styles_content = styles_content.replace("'rgba(51, 65, 85, 0.5)'", "theme.border")
styles_content = styles_content.replace("'rgba(2, 6, 23, 0.5)'", "theme.inputBg")
styles_content = styles_content.replace("'#94a3b8'", "theme.textSecondary")
styles_content = styles_content.replace("'#f8fafc'", "theme.textPrimary")
styles_content = styles_content.replace("'rgba(255, 255, 255, 0.05)'", "theme.cardBg")
styles_content = styles_content.replace("'rgba(255, 255, 255, 0.1)'", "theme.border")
styles_content = styles_content.replace("'rgba(2, 6, 23, 0.85)'", "theme.sidebarOverlay")
styles_content = styles_content.replace("'#0f172a'", "theme.sidebarBg")
styles_content = styles_content.replace("'rgba(15, 23, 42, 0.95)'", "theme.sidebarBg")
styles_content = styles_content.replace("'rgba(56, 189, 248, 0.5)'", "theme.border")
styles_content = styles_content.replace("'#38bdf8'", "theme.primary")
styles_content = styles_content.replace("'#64748b'", "theme.textMuted")
styles_content = styles_content.replace("'#e2e8f0'", "theme.textPrimary")
styles_content = styles_content.replace("'rgba(239, 68, 68, 0.1)'", "isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(220, 38, 38, 0.1)'")
styles_content = styles_content.replace("'rgba(239, 68, 68, 0.3)'", "isDarkMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(220, 38, 38, 0.3)'")
styles_content = styles_content.replace("'#ef4444'", "theme.error")
styles_content = styles_content.replace("'rgba(15, 23, 42, 0.6)'", "theme.dateContainerBg")
styles_content = styles_content.replace("'rgba(56, 189, 248, 0.3)'", "theme.border")

content = content[:styles_start] + styles_content

with open('c:/xampp/htdocs/atech_prime/mobile/src/screens/DashboardScreen.tsx', 'w') as f:
    f.write(content)
print("DashboardScreen updated.")
