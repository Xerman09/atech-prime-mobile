import re

files = [
    'c:/xampp/htdocs/atech_prime/mobile/src/screens/LeaveRequestScreen.tsx',
    'c:/xampp/htdocs/atech_prime/mobile/src/screens/LeaveRequestFormScreen.tsx',
    'c:/xampp/htdocs/atech_prime/mobile/src/screens/UndertimeRequestScreen.tsx',
    'c:/xampp/htdocs/atech_prime/mobile/src/screens/UndertimeRequestFormScreen.tsx'
]

replacements = [
    (r"import \{ Feather \} from '@expo/vector-icons';", "import { Feather } from '@expo/vector-icons';\nimport { useTheme, ThemeColors } from '../theme/ThemeContext';"),
    (r"export default function \w+\(.*\) \{", lambda m: m.group(0) + "\n  const { theme, isDarkMode } = useTheme();\n  const styles = getStyles(theme, isDarkMode);"),
    (r"colors=\{ *\['#020617', '#0f172a', '#020617'\] *\}", "colors={theme.backgroundGradient}"),
    (r"colors=\{ *\['#2563eb', '#6366f1', '#22d3ee'\] *\}", "colors={theme.primaryGradient as any}"),
    (r"colors=\{ *\['#0284c7', '#2563eb'\] *\}", "colors={theme.primaryGradient as any}"),
    (r'<StatusBar style="light" />', '<StatusBar style={isDarkMode ? "light" : "dark"} />'),
    (r'color="#f8fafc"', "color={theme.textPrimary}"),
    (r'color="#94a3b8"', "color={theme.textSecondary}"),
    (r'color="#64748b"', "color={theme.textMuted}"),
    (r'color="#38bdf8"', "color={theme.primary}"),
    (r'color="#a855f7"', "color={theme.purple}"),
    (r'color="#22c55e"', "color={theme.success}"),
    (r'color="#ef4444"', "color={theme.error}"),
    (r'color="#f59e0b"', "color={theme.warning}"),
]

style_replacements = [
    (r"const styles = StyleSheet\.create\(\{", "const getStyles = (theme: ThemeColors, isDarkMode: boolean) => StyleSheet.create({"),
    (r"'#f8fafc'", "theme.textPrimary"),
    (r"'#94a3b8'", "theme.textSecondary"),
    (r"'#64748b'", "theme.textMuted"),
    (r"'#38bdf8'", "theme.primary"),
    (r"'#a855f7'", "theme.purple"),
    (r"'#22c55e'", "theme.success"),
    (r"'#ef4444'", "theme.error"),
    (r"'#f59e0b'", "theme.warning"),
    (r"'#0f172a'", "theme.cardBgSolid"),
    (r"'rgba\(15, 23, 42, 0.85\)'", "theme.cardBg"),
    (r"'rgba\(51, 65, 85, 0.5\)'", "theme.border"),
    (r"'rgba\(2, 6, 23, 0.5\)'", "theme.inputBg"),
    (r"'rgba\(2, 6, 23, 0.8\)'", "theme.inputBgFocused"),
    (r"'rgba\(168, 85, 247, 0.1\)'", "isDarkMode ? 'rgba(168, 85, 247, 0.1)' : 'rgba(147, 51, 234, 0.1)'"),
    (r"'rgba\(236, 72, 153, 0.1\)'", "theme.glow2"),
    (r"'rgba\(56, 189, 248, 0.1\)'", "theme.glow1"),
    (r"'rgba\(16, 185, 129, 0.1\)'", "theme.glow1"),
    (r"'rgba\(244, 63, 94, 0.1\)'", "theme.glow2"),
    (r"'rgba\(51, 65, 85, 0.8\)'", "theme.border"),
    (r"'rgba\(255, 255, 255, 0.02\)'", "isDarkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)'"),
    (r"'rgba\(2, 6, 23, 0.8\)'", "theme.sidebarOverlay"),
    (r"'#e2e8f0'", "theme.textPrimary"),
]

for file_path in files:
    try:
        with open(file_path, 'r') as f:
            content = f.read()

        for pattern, repl in replacements:
            content = re.sub(pattern, repl, content)

        # Style replacements
        styles_start = content.find("const styles = StyleSheet.create({")
        if styles_start != -1:
            styles_content = content[styles_start:]
            for pattern, repl in style_replacements:
                styles_content = re.sub(pattern, repl, styles_content)
            content = content[:styles_start] + styles_content

        with open(file_path, 'w') as f:
            f.write(content)
        print(f"Updated {file_path}")
    except Exception as e:
        print(f"Failed to update {file_path}: {e}")

