import re

with open('c:/xampp/htdocs/atech_prime/mobile/src/screens/TimeInOutScreen.tsx', 'r') as f:
    content = f.read()

# Replace Imports
content = content.replace("import { Feather } from '@expo/vector-icons';", "import { Feather } from '@expo/vector-icons';\nimport { useTheme, ThemeColors } from '../theme/ThemeContext';")

# Replace Hook
content = content.replace("export default function TimeInOutScreen({ onBack, employeeId, token }: TimeInOutScreenProps) {\n  const [currentTime", "export default function TimeInOutScreen({ onBack, employeeId, token }: TimeInOutScreenProps) {\n  const { theme, isDarkMode } = useTheme();\n  const styles = getStyles(theme, isDarkMode);\n  const [currentTime")

# Linear Gradient and Status Bar
content = content.replace("colors={['#020617', '#0f172a', '#020617']}", "colors={theme.backgroundGradient}")
content = content.replace('<StatusBar style="light" />', '<StatusBar style={isDarkMode ? "light" : "dark"} />')

# Icons & UI elements
content = content.replace('color="#f8fafc"', 'color={theme.textPrimary}')
content = content.replace("colors={hasTimedIn ? ['#334155', '#1e293b'] : ['#059669', '#10b981']}", "colors={hasTimedIn ? [theme.border, theme.cardBgSolid] : [theme.success, '#10b981']}")
content = content.replace("color={hasTimedIn ? '#94a3b8' : '#ffffff'}", "color={hasTimedIn ? theme.textSecondary : '#ffffff'}")
content = content.replace("color: '#94a3b8'", "color: theme.textSecondary")

content = content.replace("colors={(!hasTimedIn || hasTimedOut) ? ['#334155', '#1e293b'] : ['#e11d48', '#f43f5e']}", "colors={(!hasTimedIn || hasTimedOut) ? [theme.border, theme.cardBgSolid] : [theme.error, '#f43f5e']}")
content = content.replace("color={(!hasTimedIn || hasTimedOut) ? '#94a3b8' : '#ffffff'}", "color={(!hasTimedIn || hasTimedOut) ? theme.textSecondary : '#ffffff'}")

content = content.replace('color="#6366f1"', 'color={theme.primary}')
content = content.replace('color="#22c55e"', 'color={theme.success}')
content = content.replace('color="#ef4444"', 'color={theme.error}')
content = content.replace("backgroundColor: status === 'In' ? '#22c55e' : (status === 'Out' ? '#ef4444' : '#3b82f6')", "backgroundColor: status === 'In' ? theme.success : (status === 'Out' ? theme.error : theme.primary)")

# Style replacements
styles_start = content.find("const styles = StyleSheet.create({")
styles_content = content[styles_start:]
styles_content = styles_content.replace("const styles = StyleSheet.create({", "const getStyles = (theme: ThemeColors, isDarkMode: boolean) => StyleSheet.create({")
styles_content = styles_content.replace("'rgba(16, 185, 129, 0.1)'", "theme.glow1")
styles_content = styles_content.replace("'rgba(244, 63, 94, 0.1)'", "theme.glow2")
styles_content = styles_content.replace("'rgba(51, 65, 85, 0.5)'", "theme.border")
styles_content = styles_content.replace("'rgba(2, 6, 23, 0.5)'", "theme.inputBg")
styles_content = styles_content.replace("'#f8fafc'", "theme.textPrimary")
styles_content = styles_content.replace("'rgba(15, 23, 42, 0.7)'", "theme.cardBg")
styles_content = styles_content.replace("'#94a3b8'", "theme.textSecondary")
styles_content = styles_content.replace("'rgba(34, 197, 94, 0.1)'", "isDarkMode ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.2)'")
styles_content = styles_content.replace("'rgba(34, 197, 94, 0.3)'", "isDarkMode ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.4)'")
styles_content = styles_content.replace("'rgba(239, 68, 68, 0.1)'", "isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.2)'")
styles_content = styles_content.replace("'rgba(239, 68, 68, 0.3)'", "isDarkMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.4)'")
styles_content = styles_content.replace("'rgba(59, 130, 246, 0.1)'", "isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.2)'")
styles_content = styles_content.replace("'rgba(59, 130, 246, 0.3)'", "isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.4)'")
styles_content = styles_content.replace("'#e2e8f0'", "theme.textPrimary")
styles_content = styles_content.replace("'#64748b'", "theme.textMuted")
styles_content = styles_content.replace("'rgba(15, 23, 42, 0.85)'", "theme.cardBg")
styles_content = styles_content.replace("'rgba(30, 41, 59, 0.5)'", "theme.inputBg")
styles_content = styles_content.replace("'rgba(51, 65, 85, 0.8)'", "theme.border")

content = content[:styles_start] + styles_content

with open('c:/xampp/htdocs/atech_prime/mobile/src/screens/TimeInOutScreen.tsx', 'w') as f:
    f.write(content)
print("TimeInOutScreen updated.")
