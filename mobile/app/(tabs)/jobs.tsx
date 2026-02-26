import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";
import { colors } from "../../lib/theme";

type Job = {
  id: string;
  type: string;
  status: string;
  agentId?: string;
  createdAt?: string;
  completedAt?: string;
  error?: string;
};

const STATUS_CONFIG: Record<string, { color: string; icon: string; bg: string }> = {
  queued: { color: colors.amber, icon: "time", bg: "rgba(245,158,11,0.12)" },
  running: { color: colors.cyan, icon: "play-circle", bg: "rgba(6,182,212,0.12)" },
  completed: { color: colors.green, icon: "checkmark-circle", bg: "rgba(34,197,94,0.12)" },
  failed: { color: colors.red, icon: "close-circle", bg: "rgba(239,68,68,0.12)" },
};

export default function JobsScreen() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  async function load() {
    try {
      const res = await api("/jobs?limit=50");
      const list = res?.jobs ?? res ?? [];
      setJobs(Array.isArray(list) ? list : []);
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

  const filtered = filter === "all" ? jobs : jobs.filter((j) => j.status === filter);
  const counts = {
    all: jobs.length,
    running: jobs.filter((j) => j.status === "running").length,
    queued: jobs.filter((j) => j.status === "queued").length,
    completed: jobs.filter((j) => j.status === "completed").length,
    failed: jobs.filter((j) => j.status === "failed").length,
  };

  function renderJob({ item }: { item: Job }) {
    const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.queued;
    return (
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={[styles.iconWrap, { backgroundColor: cfg.bg }]}>
            <Ionicons name={cfg.icon as any} size={20} color={cfg.color} />
          </View>
          <View style={styles.info}>
            <Text style={styles.jobType}>{item.type || "JOB"}</Text>
            {item.agentId && <Text style={styles.agent}>{item.agentId}</Text>}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.statusText, { color: cfg.color }]}>{item.status}</Text>
          </View>
        </View>
        {item.createdAt && (
          <Text style={styles.timestamp}>
            {new Date(item.createdAt).toLocaleString()}
          </Text>
        )}
        {item.error && (
          <Text style={styles.errorText} numberOfLines={2}>
            {item.error}
          </Text>
        )}
      </View>
    );
  }

  const filters = ["all", "running", "queued", "completed", "failed"] as const;

  return (
    <View style={styles.container}>
      {/* Filter chips */}
      <View style={styles.filterRow}>
        {filters.map((f) => {
          const c = counts[f];
          const active = filter === f;
          return (
            <TouchableOpacity
              key={f}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.chipText, active && { color: colors.bg }]}>
                {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)} ({c})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderJob}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.cyan} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="briefcase-outline" size={48} color={colors.textDim} />
            <Text style={styles.emptyText}>No jobs found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    flexWrap: "wrap",
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.cyan,
    borderColor: colors.cyan,
  },
  chipText: { fontSize: 11, fontWeight: "600", color: colors.textMuted },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: "row", alignItems: "center" },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  info: { flex: 1 },
  jobType: { fontSize: 14, fontWeight: "600", color: colors.white },
  agent: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  timestamp: { fontSize: 11, color: colors.textDim, marginTop: 8 },
  errorText: { fontSize: 11, color: colors.red, marginTop: 4 },
  empty: { alignItems: "center", marginTop: 60, gap: 12 },
  emptyText: { fontSize: 14, color: colors.textDim },
});
