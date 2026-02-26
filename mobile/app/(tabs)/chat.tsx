import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";
import { colors } from "../../lib/theme";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const AGENTS = [
  { id: "atlas", name: "Atlas", icon: "planet" },
  { id: "binky", name: "Binky", icon: "flash" },
  { id: "cheryl", name: "Cheryl", icon: "headset" },
  { id: "sunday", name: "Sunday", icon: "megaphone" },
];

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [activeAgent, setActiveAgent] = useState("atlas");
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: `Hi, I'm ${AGENTS.find((a) => a.id === activeAgent)?.name ?? "Atlas"}. How can I help you today?`,
      },
    ]);
  }, [activeAgent]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || sending) return;

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const res = await api("/chat", {
        method: "POST",
        body: JSON.stringify({ message: text, agentId: activeAgent }),
      });
      const reply = res?.reply ?? res?.content ?? "No response.";
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: "assistant", content: reply },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `e-${Date.now()}`, role: "assistant", content: "Connection error. Try again." },
      ]);
    } finally {
      setSending(false);
    }
  }

  function renderMessage({ item }: { item: Message }) {
    const isUser = item.role === "user";
    return (
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        {!isUser && (
          <Text style={styles.agentLabel}>
            {AGENTS.find((a) => a.id === activeAgent)?.name ?? "Atlas"}
          </Text>
        )}
        <Text style={[styles.messageText, isUser && { color: colors.bg }]}>
          {item.content}
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Agent picker */}
      <View style={styles.agentRow}>
        {AGENTS.map((agent) => (
          <TouchableOpacity
            key={agent.id}
            style={[
              styles.agentChip,
              activeAgent === agent.id && styles.agentChipActive,
            ]}
            onPress={() => setActiveAgent(agent.id)}
          >
            <Ionicons
              name={agent.icon as any}
              size={14}
              color={activeAgent === agent.id ? colors.bg : colors.textMuted}
            />
            <Text
              style={[
                styles.agentChipText,
                activeAgent === agent.id && { color: colors.bg },
              ]}
            >
              {agent.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Message..."
          placeholderTextColor={colors.textDim}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={2000}
          editable={!sending}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!input.trim() || sending}
        >
          <Ionicons
            name={sending ? "hourglass" : "send"}
            size={20}
            color={!input.trim() || sending ? colors.textDim : colors.bg}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  agentRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  agentChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  agentChipActive: {
    backgroundColor: colors.cyan,
    borderColor: colors.cyan,
  },
  agentChipText: { fontSize: 12, fontWeight: "600", color: colors.textMuted },
  messageList: { padding: 16, paddingBottom: 8 },
  bubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  userBubble: {
    backgroundColor: colors.cyan,
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: colors.bgCard,
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  agentLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.cyan,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  messageText: { fontSize: 14, color: colors.text, lineHeight: 20 },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.white,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cyan,
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: { backgroundColor: colors.bgCard },
});
