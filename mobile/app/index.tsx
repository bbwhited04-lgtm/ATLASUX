import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { saveAuth } from "../lib/api";
import { colors } from "../lib/theme";

const GATE_CODE = "atlasbeta2026bew051164";

export default function LoginScreen() {
  const router = useRouter();
  const [gateCode, setGateCode] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (gateCode.trim() !== GATE_CODE) {
      Alert.alert("Access Denied", "Invalid gate code.");
      return;
    }
    if (!email.trim()) {
      Alert.alert("Email Required", "Enter your email to continue.");
      return;
    }

    setLoading(true);
    try {
      // For now, save a placeholder auth — real OAuth comes later
      await saveAuth(
        "mobile-session",
        "9a8a332c-c47d-4792-a0d4-56ad4e4a3391"
      );
      router.replace("/(tabs)/dashboard");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.inner}>
        {/* Logo */}
        <View style={styles.logoWrap}>
          <View style={styles.logoCircle}>
            <Ionicons name="planet" size={48} color={colors.cyan} />
          </View>
          <Text style={styles.brand}>Atlas UX</Text>
          <Text style={styles.tagline}>AI Employee Platform</Text>
        </View>

        {/* Gate code */}
        <Text style={styles.label}>Access Code</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter gate code"
          placeholderTextColor={colors.textDim}
          value={gateCode}
          onChangeText={setGateCode}
          autoCapitalize="none"
          secureTextEntry
        />

        {/* Email */}
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="you@example.com"
          placeholderTextColor={colors.textDim}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        {/* Login button */}
        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.btnText}>
            {loading ? "Connecting..." : "Enter Atlas UX"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          &copy; 2026 Atlas UX — DEAD APP CORP
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  inner: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  logoWrap: { alignItems: "center", marginBottom: 40 },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(6,182,212,0.1)",
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  brand: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.cyan,
    letterSpacing: 1,
  },
  tagline: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
    marginBottom: 6,
    marginTop: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.white,
  },
  btn: {
    backgroundColor: colors.cyan,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 28,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { fontSize: 16, fontWeight: "700", color: colors.bg },
  footer: {
    textAlign: "center",
    fontSize: 11,
    color: colors.textDim,
    marginTop: 32,
  },
});
