import { Layout } from 'antd';
import { useCopilotChat } from "@copilotkit/react-core";
import { Role, TextMessage } from "@copilotkit/runtime-client-gql";
import { Sparkles } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { MakeAssistantMessage } from '../agent-ui/make-assistant-message';
import { MakeUserMessage } from '../agent-ui/make-user-message';
import { MakeInput } from '../agent-ui/make-input';

const { Sider } = Layout;
const CHAT_WIDTH = 320;

export default function ChatPanel() {
  const { visibleMessages, appendMessage, isLoading, stop } = useCopilotChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSend = async (text: string) => {
    appendMessage(new TextMessage({
      role: Role.User,
      content: text
    }));
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleMessages, isLoading]);

  return (
    <Sider 
      width={CHAT_WIDTH} 
      theme="light" 
      style={{ 
        borderLeft: '1px solid #f0f0f0', 
        display: 'flex', 
        flexDirection: 'column',
        backgroundColor: '#fff',
        zIndex: 10,
        height: '100%'
      }}
    >
      <div style={{ padding: '16px 16px 0 16px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, borderBottom: '1px solid #f0f0f0', paddingBottom: 12 }}>
        <Sparkles size={18} color="#faad14" />
        <span style={{ fontWeight: 600, fontSize: 16 }}>AI 创意助手</span>
      </div>

      <div 
        ref={scrollRef}
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          minHeight: 0,
          padding: '0 12px',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {visibleMessages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#999', marginTop: 40, fontSize: 14 }}>
            <p>我是 Halas 助手。<br/>我可以帮你生成图片、修改文案。</p>
          </div>
        )}

        {visibleMessages.map((msg, index) => {
          if (msg.role === Role.User) {
            return <MakeUserMessage key={index} message={msg} />;
          } else {
            const isCurrent = index === visibleMessages.length - 1;
            return (
              <MakeAssistantMessage 
                key={index} 
                message={msg} 
                isLoading={isLoading && isCurrent && !msg.content} 
                isCurrentMessage={isCurrent}
                isGenerating={isLoading && isCurrent}
              />
            );
          }
        })}
      </div>

      <div style={{ borderTop: '1px solid #f0f0f0' }}>
        <MakeInput 
          inProgress={isLoading} 
          onSend={handleSend} 
          onStop={stop}
        />
      </div>
    </Sider>
  );
}
