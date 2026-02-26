import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { api } from "../../lib/api";
import { colors } from "../../lib/theme";

type Stats = {
  activeJobs: number;
  completedToday: number;
  agents: number;
  totalSpend: string;
};

export default function DashboardScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    activeJobs: 0,
    completedToday: 0,
    agents: 0,
    totalSpend: "$0",
  });
  const [refreshing, setRefreshing] = useState(false);
  const [recentJobs, setRecentJobs] = useState<any[]>([]);

  async function load() {
    try {
      const [jobsData, agentsData] = await Promise.allSettled([
        api("/jobs?limit=5"),
        api("/agents"),
      ]);

      if (jobsData.status === "fulfilled") {
        const jobs = jobsData.value?.jobs || jobsData.value || [];
        setRecentJobs(Array.isArray(jobs) ? jobs.slice(0, 5) : []);
        const active = Array.isArray(jobs)
          ? jobs.filter((j: any) => j.status === "running" || j.status === "queued").length
          : 0;
        const completed = Array.isArray(jobs)
          ? jobs.filter((j: any) => j.status === "completed").length
          : 0;
        setStats((s) => ({ ...s, activeJobs: active, completedToday: completed }));
      }
      if (agentsData.status === "fulfilled") {
        const agents = agentsData.value?.agents || agentsData.value || [];
        setStats((s) => ({
          ...s,
          agents: Array.isArray(agents) ? agents.length : 0,
        }));
      }
    } catch {}
  }

  useEffect(() => {
    load();
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const statCards = [
    { label: "Active Jobs", value: stats.activeJobs, icon: "flash", color: colors.cyan },
    { label: "Completed", value: stats.completedToday, icon: "checkmark-circle", color: colors.green },
    { label: "Agents", value: stats.agents, icon: "people", color: colors.purple },
    { label: "Spend", value: stats.totalSpend, icon: "wallet", color: colors.amber },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.cyan} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome back</Text>
        <Text style={styles.title}>Atlas UX</Text>
        <Text style={styles.subtitle}>AI Employee Platform</Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {statCards.map((s) => (
          <View key={s.label} style={styles.statCard}>
            <Ionicons name={s.icon as any} size={24} color={s.color} />
            <Text style={[styles.statValue, { color: s.color }]}>
              {s.value}
            </Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => router.push("/(tabs)/chat")}
        >
          <Ionicons name="chatbubble" size={20} color={colors.cyan} />
          <Text style={styles.actionText}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => router.push("/(tabs)/jobs")}
        >
          <Ionicons name="play-circle" size={20} color={colors.green} />
          <Text style={styles.actionText}>Run Job</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => router.push("/(tabs)/agents")}
        >
          <Ionicons name="people" size={20} color={colors.purple} />
          <Text style={styles.actionText}>Agents</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Jobs */}
      <Text style={styles.sectionTitle}>Recent Jobs</Text>
      {recentJobs.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No recent jobs</Text>
        </View>
      ) : (
        recentJobs.map((job: any, i: number) => (
          <View key={job.id || i} style={styles.jobCard}>
            <View style={styles.jobHeader}>
              <Text style={styles.jobType}>{job.type || "JOB"}</Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      job.status === "completed"
                        ? "rgba(34,197,94,0.15)"
                        : job.status === "running"
                        ? "rgba(6,182,212,0.15)"
                        : job.status === "failed"
                        ? "rgba(239,68,68,0.15)"
                        : "rgba(148,163,184,0.15)",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    {
                      color:
                        job.status === "completed"
                          ? colors.green
                          : job.status === "running"
                          ? colors.cyan
                          : job.status === "failed"
                          ? colors.red
                          : colors.textMuted,
                    },
                  ]}
                >
                  {job.status}
                </Text>
              </View>
            </View>
            {job.agentId && (
              <Text style={styles.jobAgent}>Agent: {job.agentId}</Text>
            )}
          </View>
        ))
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  greeting: { fontSize: 14, color: colors.textMuted },
  title: { fontSize: 28, fontWeight: "800", color: colors.cyan, marginTop: 4 },
  subtitle: { fontSize: 14, color: colors.textDim, marginTop: 2 },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    marginTop: 20,
  },
  statCard: {
    width: "46%",
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 16,
    margin: "2%",
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: { fontSize: 28, fontWeight: "700", marginTop: 8 },
  statLabel: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.white,
    paddingHorizontal: 20,
    marginTop: 28,
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 4,
  },
  actionText: { fontSize: 12, fontWeight: "600", color: colors.text, marginTop: 6 },
  emptyCard: {
    marginHorizontal: 20,
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: { color: colors.textDim, fontSize: 14 },
  jobCard: {
    marginHorizontal: 20,
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  jobHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  jobType: { fontSize: 14, fontWeight: "600", color: colors.white },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: "600", textTransform: "uppercase" },
  jobAgent: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
});
