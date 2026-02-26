import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { clearAuth } from "../../lib/api";
import { colors } from "../../lib/theme";

export default function SettingsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState(true);
  const [haptics, setHaptics] = useState(true);

  async function handleLogout() {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await clearAuth();
          router.replace("/");
        },
      },
    ]);
  }

  const sections = [
    {
      title: "Account",
      items: [
        { icon: "person", label: "Profile", action: () => {} },
        { icon: "business", label: "Organization", action: () => {} },
        { icon: "key", label: "API Keys", action: () => {} },
      ],
    },
    {
      title: "Integrations",
      items: [
        { icon: "logo-microsoft", label: "Microsoft Teams", action: () => {} },
        { icon: "paper-plane", label: "Telegram", action: () => {} },
        { icon: "mail", label: "Email", action: () => {} },
      ],
    },
    {
      title: "About",
      items: [
        { icon: "information-circle", label: "Version 1.0.0-alpha", action: () => {} },
        { icon: "document-text", label: "Terms of Service", action: () => {} },
        { icon: "shield-checkmark", label: "Privacy Policy", action: () => {} },
      ],
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Preferences */}
      <Text style={styles.sectionTitle}>Preferences</Text>
      <View style={styles.card}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleLeft}>
            <Ionicons name="notifications" size={20} color={colors.cyan} />
            <Text style={styles.toggleLabel}>Push Notifications</Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: colors.bgInput, true: colors.cyanDark }}
            thumbColor={notifications ? colors.cyan : colors.textDim}
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.toggleRow}>
          <View style={styles.toggleLeft}>
            <Ionicons name="phone-portrait" size={20} color={colors.cyan} />
            <Text style={styles.toggleLabel}>Haptic Feedback</Text>
          </View>
          <Switch
            value={haptics}
            onValueChange={setHaptics}
            trackColor={{ false: colors.bgInput, true: colors.cyanDark }}
            thumbColor={haptics ? colors.cyan : colors.textDim}
          />
        </View>
      </View>

      {/* Sections */}
      {sections.map((section) => (
        <View key={section.title}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.card}>
            {section.items.map((item, idx) => (
              <View key={item.label}>
                <TouchableOpacity style={styles.menuRow} onPress={item.action}>
                  <Ionicons name={item.icon as any} size={20} color={colors.cyan} />
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textDim} />
                </TouchableOpacity>
                {idx < section.items.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </View>
      ))}

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out" size={20} color={colors.red} />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>Atlas UX v1.0.0-alpha{"\n"}DEAD APP CORP</Text>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  card: {
    marginHorizontal: 16,
    backgroundColor: colors.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  toggleLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  toggleLabel: { fontSize: 14, color: colors.text },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
  },
  menuLabel: { flex: 1, fontSize: 14, color: colors.text },
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: 14 },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 32,
    paddingVertical: 14,
    backgroundColor: "rgba(239,68,68,0.1)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
  },
  logoutText: { fontSize: 15, fontWeight: "600", color: colors.red },
  footer: {
    textAlign: "center",
    fontSize: 11,
    color: colors.textDim,
    marginTop: 24,
    lineHeight: 18,
  },
});
