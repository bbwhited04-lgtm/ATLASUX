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

type Agent = {
  id: string;
  name: string;
  title: string;
  status: string;
  reportsTo?: string;
};

const ROLE_ICONS: Record<string, string> = {
  atlas: "planet",
  binky: "flash",
  tina: "cash",
  larry: "shield",
  jenny: "document-text",
  cheryl: "headset",
  sunday: "megaphone",
  petra: "clipboard",
  sandy: "calendar",
  frank: "reader",
  default: "person-circle",
};

export default function AgentsScreen() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function load() {
    try {
      const res = await api("/agents");
      const list = res?.agents ?? res ?? [];
      setAgents(Array.isArray(list) ? list : []);
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

  function statusColor(status: string) {
    switch (status) {
      case "active":
      case "online":
        return colors.green;
      case "idle":
        return colors.amber;
      case "busy":
        return colors.cyan;
      default:
        return colors.textDim;
    }
  }

  function renderAgent({ item }: { item: Agent }) {
    const icon = ROLE_ICONS[item.id] ?? ROLE_ICONS.default;
    const isExpanded = expanded === item.id;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => setExpanded(isExpanded ? null : item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.row}>
          <View style={styles.iconWrap}>
            <Ionicons name={icon as any} size={24} color={colors.cyan} />
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.title}>{item.title}</Text>
          </View>
          <View style={[styles.statusDot, { backgroundColor: statusColor(item.status) }]} />
        </View>
        {isExpanded && (
          <View style={styles.details}>
            <Text style={styles.detailText}>Status: {item.status}</Text>
            {item.reportsTo && (
              <Text style={styles.detailText}>Reports to: {item.reportsTo}</Text>
            )}
            <Text style={styles.detailText}>ID: {item.id}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Agent Roster</Text>
        <Text style={styles.count}>{agents.length} agents</Text>
      </View>
      <FlatList
        data={agents}
        keyExtractor={(item) => item.id}
        renderItem={renderAgent}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.cyan} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={48} color={colors.textDim} />
            <Text style={styles.emptyText}>No agents found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  heading: { fontSize: 20, fontWeight: "700", color: colors.white },
  count: { fontSize: 13, color: colors.textMuted },
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(6,182,212,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: "600", color: colors.white },
  title: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  details: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  detailText: { fontSize: 12, color: colors.textMuted, marginBottom: 4 },
  empty: { alignItems: "center", marginTop: 60, gap: 12 },
  emptyText: { fontSize: 14, color: colors.textDim },
});
