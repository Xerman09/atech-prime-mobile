import re

with open('c:/xampp/htdocs/atech_prime/mobile/src/screens/LoginScreen.tsx', 'r') as f:
    content = f.read()

# Replace Imports
content = content.replace("import { Feather } from '@expo/vector-icons';", "import { Feather } from '@expo/vector-icons';\nimport { useTheme, ThemeColors } from '../theme/ThemeContext';")

# Replace hook
content = content.replace("export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {\n  const [email, setEmail]", "export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {\n  const { theme, isDarkMode } = useTheme();\n  const styles = getStyles(theme);\n  const [email, setEmail]")

# Replace Gradient and StatusBar
content = content.replace("colors={['#020617', '#0f172a', '#020617']}\n      style={styles.container}", "colors={theme.backgroundGradient}\n      style={styles.container}")
content = content.replace('<StatusBar style="light" />', '<StatusBar style={isDarkMode ? "light" : "dark"} />')

# Replace Icons
content = content.replace("color={isEmailFocused ? '#38bdf8' : '#64748b'}", "color={isEmailFocused ? theme.primary : theme.textMuted}")
content = content.replace("color={isPasswordFocused ? '#38bdf8' : '#64748b'}", "color={isPasswordFocused ? theme.primary : theme.textMuted}")
content = content.replace('color="#64748b"', 'color={theme.textMuted}')
content = content.replace('color="#0f172a"', 'color={theme.cardBgSolid}')

# Replace Button Gradient
content = content.replace("colors={['#0284c7', '#2563eb']}", "colors={theme.primaryGradient}")

# Replace Styles
styles_start = content.find("const styles = StyleSheet.create({")
styles_content = content[styles_start:]
styles_content = styles_content.replace("const styles = StyleSheet.create({", "const getStyles = (theme: ThemeColors) => StyleSheet.create({")
styles_content = styles_content.replace("'rgba(56, 189, 248, 0.15)'", "theme.glow1")
styles_content = styles_content.replace("'rgba(37, 99, 235, 0.15)'", "theme.glow2")
styles_content = styles_content.replace("'rgba(15, 23, 42, 0.85)'", "theme.cardBg")
styles_content = styles_content.replace("'rgba(51, 65, 85, 0.5)'", "theme.border")
styles_content = styles_content.replace("'#38bdf8'", "theme.primary")
styles_content = styles_content.replace("'#f8fafc'", "theme.textPrimary")
styles_content = styles_content.replace("'#64748b'", "theme.textMuted")
styles_content = styles_content.replace("'#94a3b8'", "theme.textSecondary")
styles_content = styles_content.replace("'rgba(2, 6, 23, 0.5)'", "theme.inputBg")
styles_content = styles_content.replace("'#334155'", "theme.border")
styles_content = styles_content.replace("'rgba(2, 6, 23, 0.8)'", "theme.inputBgFocused")
styles_content = styles_content.replace("'#2563eb'", "theme.primary")

content = content[:styles_start] + styles_content

with open('c:/xampp/htdocs/atech_prime/mobile/src/screens/LoginScreen.tsx', 'w') as f:
    f.write(content)
print("LoginScreen updated.")
