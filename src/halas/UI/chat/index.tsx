import { useState, useEffect, useRef } from "react";
import { Layout, Input, Button, Flex, Avatar, Spin } from "antd";
import { Send, Sparkles, Bot, User } from "lucide-react";
import { useTranslation } from "@/i18n/utils";

const { Sider } = Layout;
const { TextArea } = Input;

const CHAT_WIDTH = 320;

const MessageItem = ({ role, content }) => {
  const isUser = role === "user";
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        marginBottom: 16,
        flexDirection: isUser ? "row-reverse" : "row",
      }}
    >
      <Avatar
        style={{
          backgroundColor: isUser ? "#1677ff" : "#52c41a",
          flexShrink: 0,
        }}
        icon={isUser ? <User size={16} /> : <Bot size={16} />}
      />
      <div
        style={{
          backgroundColor: isUser ? "#e6f4ff" : "#f6ffed",
          padding: "8px 12px",
          borderRadius: 12,
          borderTopRightRadius: isUser ? 2 : 12,
          borderTopLeftRadius: isUser ? 12 : 2,
          maxWidth: "85%",
          fontSize: 14,
          lineHeight: 1.5,
          color: "#333",
        }}
      >
        {content}
      </div>
    </div>
  );
};

export default function ChatPanel() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "你好！我是你的创意助手。我可以帮你生成图片、寻找素材或者提供设计灵感。",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // 模拟 AI 回复
    setTimeout(() => {
      const aiMsg = {
        role: "assistant",
        content: "收到！正在为你构思... (这里将接入 Agent 能力)",
      };
      setMessages((prev) => [...prev, aiMsg]);
      setLoading(false);
    }, 1000);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <Sider
      width={CHAT_WIDTH}
      theme="light"
      style={{
        borderLeft: "1px solid #f0f0f0",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#fff",
        zIndex: 10,
      }}
    >
      <div
        style={{
          padding: 16,
          borderBottom: "1px solid #f0f0f0",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Sparkles size={18} color="#faad14" />
        <span style={{ fontWeight: 600, fontSize: 16 }}>AI 创意助手</span>
      </div>

      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 16,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {messages.map((msg, index) => (
          <MessageItem key={index} role={msg.role} content={msg.content} />
        ))}
        {loading && (
          <div style={{ padding: 10, textAlign: "center" }}>
            <Spin size="small" />
          </div>
        )}
      </div>

      <div style={{ padding: 16, borderTop: "1px solid #f0f0f0" }}>
        <Flex gap={8}>
          <TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入描述..."
            autoSize={{ minRows: 1, maxRows: 4 }}
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            style={{ borderRadius: 8, resize: "none" }}
          />
          <Button
            type="primary"
            icon={<Send size={16} />}
            onClick={handleSend}
            style={{ height: "auto", borderRadius: 8 }}
          />
        </Flex>
      </div>
    </Sider>
  );
}
